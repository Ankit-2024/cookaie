import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { applyRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

// ─── Structured Logger ───────────────────────────────────────────────────────
const log = createLogger('api:recipes');

// ─── POST /api/recipes ───────────────────────────────────────────────────────
// Persists a newly generated recipe (+ optional YouTube videos) to PostgreSQL.
//
// Request body:
//   {
//     recipe: { foodItem, prepTime, cookTime, ingredients, instructions },
//     videos: [{ videoId, title, channelTitle, thumbnailUrl }]  // optional
//   }
//
// Returns: 201 with the saved recipe record.

export async function POST(request) {
  // ── Rate Limiting ──────────────────────────────────────────────────────────
  try {
    const { success, limit, reset } = await applyRateLimit(request);
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
    log.warn({ err: rateLimitError }, 'Rate limiter unavailable — proceeding without limit');
  }

  // ── Parse & Validate ───────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }

  const { recipe, videos } = body;

  if (!recipe || !recipe.foodItem || !recipe.ingredients || !recipe.instructions) {
    return NextResponse.json(
      { error: 'Request body must include a valid "recipe" object with foodItem, ingredients, and instructions.' },
      { status: 400 }
    );
  }

  // ── Persist to Database ────────────────────────────────────────────────────
  try {
    const startTime = performance.now();

    const saved = await prisma.recipe.create({
      data: {
        title: recipe.foodItem,
        prepTime: recipe.prepTime || null,
        cookTime: recipe.cookTime || null,
        ingredients: recipe.ingredients,   // Stored as JSON column
        instructions: recipe.instructions, // Stored as JSON column
        videos: videos || null,            // Optional YouTube results
      },
    });

    const durationMs = Math.round(performance.now() - startTime);
    log.info(
      { recipeId: saved.id, title: saved.title, durationMs },
      'Recipe persisted to database'
    );

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    log.error({ err: error }, 'Failed to persist recipe to database');

    // Report to Sentry with full context, but return a clean error to client.
    Sentry.captureException(error, {
      tags: { route: '/api/recipes', method: 'POST' },
      extra: { recipeTitle: recipe?.foodItem },
    });

    return NextResponse.json(
      { error: 'Failed to save recipe. Please try again.' },
      { status: 500 }
    );
  }
}

// ─── GET /api/recipes ────────────────────────────────────────────────────────
// Fetches recent recipe history, ordered by most recent first.
//
// Query params:
//   ?limit=5   (default: 5, max: 20)
//
// Returns: 200 with an array of recipe records.

export async function GET(request) {
  // ── Rate Limiting ──────────────────────────────────────────────────────────
  try {
    const { success, limit, reset } = await applyRateLimit(request);
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
    log.warn({ err: rateLimitError }, 'Rate limiter unavailable — proceeding without limit');
  }

  // ── Parse Query Params ─────────────────────────────────────────────────────
  const searchParams = request.nextUrl.searchParams;
  const rawLimit = parseInt(searchParams.get('limit') || '5', 10);
  const limit = Math.min(Math.max(rawLimit, 1), 20); // Clamp between 1 and 20

  // ── Fetch from Database ────────────────────────────────────────────────────
  try {
    const startTime = performance.now();

    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        prepTime: true,
        cookTime: true,
        ingredients: true,
        instructions: true,
        videos: true,
        createdAt: true,
      },
    });

    const durationMs = Math.round(performance.now() - startTime);
    log.info(
      { count: recipes.length, limit, durationMs },
      'Recipe history fetched from database'
    );

    return NextResponse.json(recipes);
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch recipe history from database');

    // Report to Sentry with full context.
    Sentry.captureException(error, {
      tags: { route: '/api/recipes', method: 'GET' },
    });

    return NextResponse.json(
      { error: 'Failed to load recipe history. Please try again.' },
      { status: 500 }
    );
  }
}
