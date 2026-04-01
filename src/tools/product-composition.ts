import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

export function createProductCompositionTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_product_composition",
    definition: {
      title: "Get Product Composition",
      description: "Get allergen, ingredient, and nutritional data for one or more products. No authentication needed. Useful for checking allergens (gluten, eggs, nuts, etc.) and nutritional values before recommending or adding to cart.",
      inputSchema: {
        product_ids: z.array(z.number()).min(1).max(20).describe("Array of product IDs to get composition for (max 20)")
      }
    },
    handler: async ({ product_ids }: { product_ids: number[] }) => {
      try {
        const api = createRohlikAPI();
        const compositions = await api.getProductComposition(product_ids);

        if (compositions.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No composition data found for the given product IDs." }]
          };
        }

        const output = compositions.map(comp => {
          const allergens = comp.allergens || {};
          const contained = (allergens.contained || []).map((a: any) => a.name || a).join(', ') || 'none';
          const possibly = (allergens.possiblyContained || []).map((a: any) => a.name || a).join(', ') || 'none';

          const ingredients = (comp.ingredients || [])
            .map((ing: any) => ing.title + (ing.value ? ` (${ing.value.amount}${ing.value.unit})` : ''))
            .join(', ') || 'not available';

          const nutrition = comp.nutritionalValues?.[0];
          let nutritionStr = 'not available';
          if (nutrition?.values) {
            const v = nutrition.values;
            nutritionStr = `per ${nutrition.portion}: ` +
              `${v.energyKCal?.amount || '?'} kcal, ` +
              `protein ${v.protein?.amount || '?'}g, ` +
              `carbs ${v.carbohydrates?.amount || '?'}g, ` +
              `fat ${v.fats?.amount || '?'}g, ` +
              `fiber ${v.fiber?.amount || '?'}g, ` +
              `salt ${v.salt?.amount || '?'}g`;
          }

          return `Product ID: ${comp.productId}\n` +
            `  Allergens: ${contained}\n` +
            `  May contain: ${possibly}\n` +
            `  Ingredients: ${ingredients}\n` +
            `  Nutrition: ${nutritionStr}`;
        }).join('\n\n');

        return {
          content: [{ type: "text" as const, text: output }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: error instanceof Error ? error.message : String(error)
          }],
          isError: true
        };
      }
    }
  };
}
