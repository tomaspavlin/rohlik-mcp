import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";
import { getCurrency } from "../locale.js";

export function createCartManagementTools(createRohlikAPI: () => RohlikAPI) {
  return {
    addToCart: {
      name: "add_to_cart",
      definition: {
        title: "Add to Cart",
        description: "Add products to the shopping cart. For discounted items (from get_discounted_items), pass the saleId as action_id to get the sale price applied.",
        inputSchema: {
          products: z.array(z.object({
            product_id: z.number().describe("The ID of the product to add"),
            quantity: z.number().min(1).describe("Quantity of the product to add"),
            action_id: z.number().optional().describe("Sale/action ID from get_discounted_items (saleId). Pass this to apply the discounted price (especially for zachráň/last-minute items).")
          })).min(1, "At least one product is required").describe("Array of products to add to cart")
        }
      },
      handler: async ({ products }: {
        products: Array<{ product_id: number; quantity: number; action_id?: number }>;
      }) => {
        try {
          const api = createRohlikAPI();
          const addedProducts = await api.addToCart(products);
          const successCount = addedProducts.length;
          const totalRequested = products.length;

          const output = `Successfully added ${successCount}/${totalRequested} products to cart.\n` +
            (addedProducts.length > 0 ? `Added product IDs: ${addedProducts.join(', ')}` : 'No products were added.');

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
    },

    getCartContent: {
      name: "get_cart_content",
      definition: {
        title: "Get Cart Content",
        description: "Get the current contents of the shopping cart",
        inputSchema: {}
      },
      handler: async () => {
        try {
          const api = createRohlikAPI();
          const cartContent = await api.getCartContent();

          if (cartContent.total_items === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Your cart is empty."
                }
              ]
            };
          }

          const output = `Cart Summary:
• Total items: ${cartContent.total_items}
• Total price: ${cartContent.total_price} ${getCurrency()}
• Can order: ${cartContent.can_make_order ? 'Yes' : 'No'}

Products in cart:
${cartContent.products.map(product => 
  `• ${product.name} (${product.brand})\n  Quantity: ${product.quantity}\n  Price: ${product.price} ${getCurrency()}\n  Category: ${product.category_name}\n  Cart ID: ${product.cart_item_id}`
).join('\n\n')}`;

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
    },

    removeFromCart: {
      name: "remove_from_cart",
      definition: {
        title: "Remove from Cart",
        description: "Remove an item from the shopping cart",
        inputSchema: {
          order_field_id: z.string().min(1, "Order field ID is required").describe("The order field ID of the item to remove (cart_item_id from cart content)")
        }
      },
      handler: async ({ order_field_id }: { order_field_id: string }) => {
        try {
          const api = createRohlikAPI();
          const success = await api.removeFromCart(order_field_id);

          const output = success 
            ? `Successfully removed item with ID ${order_field_id} from cart.`
            : `Failed to remove item with ID ${order_field_id} from cart.`;

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
    }
  };
}