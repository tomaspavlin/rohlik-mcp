import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

export function createOrderDetailTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_order_detail",
    definition: {
      title: "Get Order Detail",
      description: "Get detailed information about a specific order by its ID, including all products",
      inputSchema: {
        orderId: z.string().describe("The order ID to fetch details for")
      }
    },
    handler: async (args: { orderId: string }) => {
      const { orderId } = args;
      
      try {
        const api = createRohlikAPI();
        const orderDetail = await api.getOrderDetail(orderId);

        if (!orderDetail) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Order with ID ${orderId} not found.`
              }
            ]
          };
        }

        const formatProduct = (product: any, index: number): string => {
          const name = product.productName || product.name || 'Unknown product';
          const quantity = product.quantity || 1;
          const price = product.price || product.totalPrice || 0;
          const brand = product.brand || '';
          
          return `  ${index + 1}. ${name}${brand ? ` (${brand})` : ''}
     Quantity: ${quantity}
     Price: ${price} CZK`;
        };

        const order = orderDetail;
        const orderNumber = order.orderNumber || order.id || orderId;
        const orderDate = order.deliveredAt || order.createdAt || 'Unknown date';
        const totalPrice = order.totalPrice || order.price || 'Unknown price';
        const status = order.status || 'Unknown status';
        const deliveryDate = order.deliveryDate || order.deliveredAt || 'Unknown delivery date';
        const products = order.products || order.items || [];

        const output = `📦 ORDER DETAILS - ${orderNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order Date: ${orderDate}
Delivery Date: ${deliveryDate}
Status: ${status}
Total Price: ${totalPrice} CZK

📋 PRODUCTS (${products.length} items):
${products.map(formatProduct).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${totalPrice} CZK`;

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