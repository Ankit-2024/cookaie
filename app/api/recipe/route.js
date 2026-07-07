import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const dietary = searchParams.get('dietary') || 'None';
  const allergies = searchParams.get('allergies') || 'None';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
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
      console.error('YouTube API Error:', youtubeResult.reason);
      responseData.errors.push('Failed to fetch videos');
    }

    if (recipeResult.status === 'fulfilled') {
      responseData.recipe = recipeResult.value;
    } else {
      console.error('LLM API Error:', recipeResult.reason);
      responseData.errors.push('Failed to generate recipe');
    }

    if (!responseData.videos.length && !responseData.recipe) {
      return NextResponse.json({ error: 'Failed to retrieve any data. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function fetchYouTubeVideos(query) {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    console.warn('YOUTUBE_API_KEY is not set or invalid. Returning mock videos.');
    return getMockVideos(query);
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query + ' cooking recipe')}&type=video&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
  
  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const data = await response.json();
  
  return data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.high.url
  }));
}

async function generateRecipe(query, dietary, allergies) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('GEMINI_API_KEY is not set or invalid. Returning mock recipe.');
    return getMockRecipe(query);
  }

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

    let jsonStr = response.text;
    
    // Fallback sanitation just in case the model ignored responseMimeType
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
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
