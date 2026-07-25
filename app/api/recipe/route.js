import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { applyRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ── Structured Logger ──────────────────────────────────────────────────────
const log = createLogger('api:recipe');

export async function GET(request) {
  // ── Rate Limiting ────────────────────────────────────────────────────────
  try {
    const { success, limit, remaining, reset } = await applyRateLimit(request);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  } catch (rateLimitError) {
    // If Redis is unreachable, log and proceed (fail-open).
    log.warn({ err: rateLimitError }, 'Rate limiter unavailable — proceeding without limit');
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const dietary = searchParams.get('dietary') || 'None';
  const allergies = searchParams.get('allergies') || 'None';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    log.info({ query, dietary, allergies }, 'Recipe search started');

    // Execute YouTube and Gemini requests concurrently
    const [youtubeResult, recipeResult] = await Promise.allSettled([
      fetchYouTubeVideos(query),
      generateRecipe(query, dietary, allergies)
    ]);

    let responseData = {
      videos: [],
      recipe: null,
      errors: []
    };

    if (youtubeResult.status === 'fulfilled') {
      responseData.videos = youtubeResult.value;
    } else {
      log.error({ err: youtubeResult.reason, query }, 'YouTube API call failed');
      responseData.errors.push('Failed to fetch videos');
    }

    if (recipeResult.status === 'fulfilled') {
      responseData.recipe = recipeResult.value;
    } else {
      log.error({ err: recipeResult.reason, query }, 'Gemini API call failed');
      responseData.errors.push('Failed to generate recipe');
    }

    if (!responseData.videos.length && !responseData.recipe) {
      log.error({ query }, 'Both YouTube and Gemini failed — returning 500');
      return NextResponse.json({ error: 'Failed to retrieve any data. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    log.error({ err: error }, 'Unhandled error in recipe route');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function fetchYouTubeVideos(query) {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    log.warn('YOUTUBE_API_KEY not set — returning mock videos');
    return getMockVideos(query);
  }

  const startTime = performance.now();

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query + ' cooking recipe')}&type=video&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const data = await response.json();
  const durationMs = Math.round(performance.now() - startTime);

  log.info(
    { durationMs, resultCount: data.items?.length ?? 0, query },
    'YouTube API call completed'
  );

  return data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high.url
  }));
}

async function generateRecipe(query, dietary, allergies) {
  log.debug(
    { hasApiKey: !!process.env.GEMINI_API_KEY, query, dietary, allergies },
    'generateRecipe called'
  );

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    log.warn('GEMINI_API_KEY not set — returning mock recipe');
    return getMockRecipe(query);
  }

  const startTime = performance.now();

  const prompt = `You are an expert culinary architect and supply chain mapper. Your job is to take a user's food query and output a STRICT JSON object representing the recipe.

USER CONTEXT:
The user is strictly: ${dietary}. 
EXCLUDE THESE INGREDIENTS: ${allergies}.

CRITICAL INSTRUCTIONS FOR INGREDIENTS:
1. If the user's prompt is NOT related to food, cooking, or recipes (e.g., asking for code, math, or general knowledge), you must reject the request. Do not generate a recipe structure. Instead, return EXACTLY this JSON: { "isError": true, "message": "Keep it strictly culinary. I cannot cook that for you." }
2. Translate abstract measurements into standard Indian retail packaging (e.g., instead of "3 onions", output "1kg Red Onions". Instead of "a pinch of salt", output "1 standard pack iodized salt").
3. Be highly specific with proteins and produce (e.g., "500g bone-in chicken curry cut", not just "chicken").
4. Do not include markdown formatting like \`\`\`json in your response. Return ONLY the raw JSON string.

EXPECTED SCHEMA:
{
  "foodItem": "string",
  "prepTime": "string",
  "cookTime": "string",
  "ingredients": [
    { "item": "string (Specific retail name)", "amount": "string (Retail unit like 500g, 1kg, 1 tray)" }
  ],
  "instructions": [
    { "step": 1, "action": "string" }
  ]
}

Dish to generate: "${query}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const durationMs = Math.round(performance.now() - startTime);

    // ── Telemetry: Log Gemini latency and token usage ─────────────────────
    // Extract token counts from the response metadata (if available).
    // These are fire-and-forget — they don't block the response.
    const usageMetadata = response.usageMetadata || {};
    log.info(
      {
        durationMs,
        model: 'gemini-2.5-flash',
        query,
        promptTokens: usageMetadata.promptTokenCount ?? null,
        completionTokens: usageMetadata.candidatesTokenCount ?? null,
        totalTokens: usageMetadata.totalTokenCount ?? null,
      },
      'Gemini API call completed'
    );

    let jsonStr = response.text;
    log.debug({ responseLength: jsonStr?.length }, 'Raw Gemini response received');
    
    // Fallback sanitation just in case the model ignored responseMimeType
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    log.error(
      { err: error, durationMs, model: 'gemini-2.5-flash', query },
      'Gemini API call failed'
    );
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

function getMockVideos(query) {
  return [
    {
      videoId: 'CqjbA9dC2-M', // Example video ID
      title: `The BEST ${query} Recipe`,
      channelTitle: 'Culinary Masterclass',
      thumbnailUrl: ''
    },
    {
      videoId: 'jNQXAC9IVRw',
      title: `How To Cook Perfect ${query}`,
      channelTitle: 'Chef John',
      thumbnailUrl: ''
    },
    {
      videoId: 'tPEE9ZwTmy0',
      title: `${query} - Easy Step by Step`,
      channelTitle: 'Home Kitchen',
      thumbnailUrl: ''
    }
  ];
}

function getMockRecipe(query) {
  return {
    foodItem: query.charAt(0).toUpperCase() + query.slice(1),
    prepTime: '20 mins',
    cookTime: '30 mins',
    ingredients: [
      { item: 'Flour', amount: '2 cups' },
      { item: 'Sugar', amount: '1/2 cup' },
      { item: 'Eggs', amount: '2 large' },
      { item: 'Milk', amount: '1 cup' },
      { item: 'Butter', amount: '4 tbsp' }
    ],
    instructions: [
      { step: 1, action: 'Preheat oven to 350°F (175°C).' },
      { step: 2, action: 'Mix all dry ingredients in a large bowl.' },
      { step: 3, action: 'Whisk wet ingredients together and gently fold into the dry mixture.' },
      { step: 4, action: 'Bake for 30 minutes until golden brown.' }
    ]
  };
}
