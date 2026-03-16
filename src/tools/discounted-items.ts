import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

export function createDiscountedItemsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_discounted_items",
    definition: {
      title: "Get Discounted Items",
      description: "Get currently discounted items (cenové trháky / sales). Returns products on sale, optionally filtered by food category. Without a category, returns deals across all categories. Call with list_categories=true to see available category IDs.",
      inputSchema: {
        category_id: z.number().optional().describe("Food category ID to filter by. Use list_categories=true first to see available categories and their IDs. If omitted, returns discounted items across all categories."),
        limit: z.number().min(1).max(50).default(14).describe("Maximum number of products to return (1-50, default: 14)"),
        page: z.number().min(0).default(0).describe("Page number for pagination (0-based, default: 0)"),
        sort: z.enum(["recommended", "price-asc", "price-desc", "unit-price-asc"]).default("recommended").describe("Sort order (default: recommended)"),
        list_categories: z.boolean().default(false).describe("If true, returns the list of available sales categories instead of products")
      }
    },
    handler: async (args: { category_id?: number; limit?: number; page?: number; sort?: string; list_categories?: boolean }) => {
      const { category_id, limit = 14, page = 0, sort = "recommended", list_categories = false } = args;
      try {
        const api = createRohlikAPI();

        if (list_categories) {
          const categories = await api.getSalesCategories();

          if (categories.length === 0) {
            return {
              content: [{ type: "text" as const, text: "No sales categories found." }]
            };
          }

          const output = `Available sales categories:\n\n` +
            categories.map(c => `• ${c.name} (ID: ${c.id})`).join('\n');

          return {
            content: [{ type: "text" as const, text: output }]
          };
        }

        const products = await api.getDiscountedProducts(
          category_id ?? null,
          page,
          limit,
          sort
        );

        if (products.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No discounted items found." }]
          };
        }

        const output = `Found ${products.length} discounted items${category_id ? ` in category ${category_id}` : ' across all categories'} (page ${page}):\n\n` +
          products.map(p => {
            const badge = p.badges?.find((b: any) => b.position === 'PRICE');
            const discount = badge?.text ? ` (${badge.text})` : '';
            const originalPrice = p.prices?.originalPrice ? `${p.prices.originalPrice} ${p.prices?.currency || ''}` : null;
            const salePrice = p.prices?.salePrice ? `${p.prices.salePrice} ${p.prices?.currency || ''}` : null;
            const price = salePrice || `${p.prices?.originalPrice || '?'} ${p.prices?.currency || ''}`;
            const priceInfo = originalPrice && salePrice
              ? `Price: ${salePrice} (was ${originalPrice})`
              : `Price: ${price}`;

            return `• ${p.name}${discount}\n  ${priceInfo}\n  Unit price: ${p.prices?.unitPrice || '?'} ${p.prices?.currency || ''}/${p.unit || 'unit'}\n  Amount: ${p.textualAmount || '?'}\n  ID: ${p.productId}`;
          }).join('\n\n');

        return {
          content: [{ type: "text" as const, text: output }]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: error instanceof Error ? error.message : String(error)
            }
          ],
          isError: true
        };
      }
    }
  };
}
