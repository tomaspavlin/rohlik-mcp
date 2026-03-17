import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";
import { getCurrency } from "../locale.js";

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
          const name = product.name || 'Unknown product';
          const amount = product.amount || 1;
          const textualAmount = product.textualAmount || '';
          const totalPrice = product.priceComposition?.total?.amount ?? 0;
          const unitPrice = product.priceComposition?.unit?.amount ?? 0;
          const productId = product.id || 'N/A';

          return `  ${index + 1}. [${productId}] ${name}
     Amount: ${amount}x (${textualAmount})
     Price: ${totalPrice} ${getCurrency()} (unit: ${unitPrice} ${getCurrency()})`;
        };

        const order = orderDetail;
        const orderNumber = order.id || orderId;
        const orderDate = order.orderTime || 'Unknown date';
        const totalPrice = order.priceComposition?.total?.amount ?? 'Unknown';
        const deliveryPrice = order.priceComposition?.delivery?.amount ?? 0;
        const status = order.state || 'Unknown status';
        const deliverySlot = order.deliverySlot;
        const deliveryInfo = deliverySlot
          ? `${deliverySlot.since} - ${deliverySlot.till}`
          : 'N/A';
        const items = order.items || [];

        const output = `ORDER DETAILS - ${orderNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order Date: ${orderDate}
Delivery Slot: ${deliveryInfo}
Delivery Type: ${order.deliveryType || 'N/A'}
Status: ${status}
Total: ${totalPrice} ${getCurrency()} (delivery: ${deliveryPrice} ${getCurrency()})

PRODUCTS (${items.length} items):
${items.map(formatProduct).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${totalPrice} ${getCurrency()}`;

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