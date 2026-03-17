import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";
import { RohlikCredentials } from "../types.js";

export function createSearchProductsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "search_products",
    definition: {
      title: "Search Products",
      description: "Search for products on Rohlik.cz by name",
      inputSchema: {
        product_name: z.string().min(1, "Product name cannot be empty").describe("The name or search term for the product"),
        limit: z.number().min(1).max(50).default(10).describe("Maximum number of products to return (1-50, default: 10)"),
        favourite_only: z.boolean().default(false).describe("Whether to return only favourite products (default: false)")
      }
    },
    handler: async (args: { product_name: string; limit?: number; favourite_only?: boolean }) => {
      const { product_name, limit = 10, favourite_only = false } = args;
      try {
        const api = createRohlikAPI();
        const results = await api.searchProducts(product_name, limit, favourite_only);

        const output = `Found ${results.length} products:\n\n` +
          results.map((product: any) => {
            const priceInfo = product.salePrice
              ? `Price: ${product.salePrice} (was ${product.originalPrice}, -${product.discountPercentage}%)`
              : `Price: ${product.price}`;
            return `• ${product.name} (${product.brand})\n  ${priceInfo}\n  Amount: ${product.amount}\n  ID: ${product.id}`;
          }).join('\n\n');

        return {
          content: [
            {
              type: "text" as const,
              text: output
            }
          ]
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