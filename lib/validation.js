import { z } from 'zod/v4';

// ─── Cart Request Schema ─────────────────────────────────────────────────────
// Validates the POST body for /api/cart.
// Expects: { ingredients: [{ item: string, amount?: string }, ...] }
//
// Constraints:
//   • `ingredients` must be a non-empty array with at most 50 items
//   • Each `item` must be a non-empty string (≤ 200 chars)
//   • `amount` is optional but, if present, must be ≤ 100 chars
// ─────────────────────────────────────────────────────────────────────────────

const ingredientSchema = z.object({
  item: z
    .string()
    .min(1, 'Ingredient name cannot be empty')
    .max(200, 'Ingredient name must be 200 characters or fewer'),
  amount: z
    .string()
    .max(100, 'Amount must be 100 characters or fewer')
    .optional(),
});

const cartBodySchema = z.object({
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'At least one ingredient is required')
    .max(50, 'A maximum of 50 ingredients is allowed per request'),
});

// ─── Public Helper ───────────────────────────────────────────────────────────

/**
 * Parses and validates the cart request body against the schema.
 *
 * @param {unknown} body - The raw parsed JSON body from the request.
 * @returns {{ success: true, data: { ingredients: Array<{ item: string, amount?: string }> } }
 *         | { success: false, error: string }}
 */
export function parseCartBody(body) {
  const result = cartBodySchema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Flatten Zod errors into a human-readable message for the 400 response.
  const messages = z.prettifyError(result.error);
  return { success: false, error: messages };
}
