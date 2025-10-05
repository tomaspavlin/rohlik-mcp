import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

interface OrderProduct {
  productName?: string;
  name?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
  brand?: string;
  categoryName?: string;
  primaryCategoryName?: string;
}

interface OrderData {
  id?: string;
  orderNumber?: string;
  deliveredAt?: string;
  createdAt?: string;
  totalPrice?: number;
  price?: number;
  status?: string;
  products?: OrderProduct[];
  items?: OrderProduct[];
}

interface OrderAnalytics {
  totalOrders: number;
  dateRange: {
    from: string;
    to: string;
  };
  totalSpent: number;
  averageOrderValue: number;
  totalProducts: number;
  mostUsedProducts: Array<{
    name: string;
    brand?: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>;
  topCategories: Array<{
    category: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>;
  topBrands: Array<{
    brand: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
  }>;
}

export function createOrderAnalyticsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "analyze_orders_by_months",
    definition: {
      title: "Analyze Orders by Months",
      description: "Get orders from the last N months and calculate comprehensive analytics including most used products, spending patterns, categories, and brands",
      inputSchema: {
        months: z.number().min(1).max(24).default(6).describe("Number of months to look back (1-24, default: 6)"),
        maxOrders: z.number().min(10).max(500).default(100).describe("Maximum number of orders to fetch (10-500, default: 100)"),
        topCount: z.number().min(5).max(50).default(10).describe("Number of top items to show in each category (5-50, default: 10)")
      }
    },
    handler: async (args: { months?: number; maxOrders?: number; topCount?: number }) => {
      const { months = 6, maxOrders = 100, topCount = 10 } = args;
      
      try {
        const api = createRohlikAPI();
        
        // Calculate date range
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);
        
        // Get order history
        const orderHistory = await api.getOrderHistory(maxOrders);
        
        if (!orderHistory || (Array.isArray(orderHistory) && orderHistory.length === 0)) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No order history found for the specified period."
              }
            ]
          };
        }

        const orders = Array.isArray(orderHistory) ? orderHistory : [orderHistory];
        
        // Filter orders within the date range
        const filteredOrders = orders.filter((order: OrderData) => {
          const orderDate = new Date(order.deliveredAt || order.createdAt || '');
          return orderDate >= fromDate && orderDate <= toDate;
        });

        if (filteredOrders.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No orders found in the last ${months} months.`
              }
            ]
          };
        }

        // Fetch detailed information for each order
        const detailedOrders: OrderData[] = [];
        for (const order of filteredOrders) {
          try {
            const orderId = order.id || order.orderNumber;
            if (orderId) {
              const detail = await api.getOrderDetail(orderId);
              if (detail) {
                detailedOrders.push(detail);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch details for order ${order.id}:`, error);
            // Include the order even without detailed products
            detailedOrders.push(order);
          }
        }

        // Calculate analytics
        const analytics = calculateOrderAnalytics(detailedOrders, fromDate, toDate, topCount);
        
        // Format the output
        const output = formatAnalyticsOutput(analytics, months);

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

function calculateOrderAnalytics(orders: OrderData[], fromDate: Date, toDate: Date, topCount: number): OrderAnalytics {
  const productMap = new Map<string, {
    name: string;
    brand?: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>();
  
  const categoryMap = new Map<string, {
    category: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>();
  
  const brandMap = new Map<string, {
    brand: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
  }>();
  
  const monthlyMap = new Map<string, {
    month: string;
    orderCount: number;
    totalSpent: number;
  }>();

  let totalSpent = 0;
  let totalProducts = 0;

  orders.forEach(order => {
    const orderTotal = order.totalPrice || order.price || 0;
    totalSpent += orderTotal;
    
    // Monthly breakdown
    const orderDate = new Date(order.deliveredAt || order.createdAt || '');
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthData = monthlyMap.get(monthKey) || {
      month: monthKey,
      orderCount: 0,
      totalSpent: 0
    };
    monthData.orderCount++;
    monthData.totalSpent += orderTotal;
    monthlyMap.set(monthKey, monthData);

    // Process products
    const products = order.products || order.items || [];
    products.forEach((product: OrderProduct) => {
      const productName = product.productName || product.name || 'Unknown Product';
      const brand = product.brand || '';
      const quantity = product.quantity || 1;
      const productPrice = product.price || product.totalPrice || 0;
      const category = product.categoryName || product.primaryCategoryName || 'Unknown Category';
      
      totalProducts += quantity;
      
      // Product analytics
      const productKey = `${productName}|${brand}`;
      const productData = productMap.get(productKey) || {
        name: productName,
        brand: brand || undefined,
        totalQuantity: 0,
        totalSpent: 0,
        orderCount: 0
      };
      productData.totalQuantity += quantity;
      productData.totalSpent += productPrice;
      productData.orderCount++;
      productMap.set(productKey, productData);
      
      // Category analytics
      const categoryData = categoryMap.get(category) || {
        category,
        totalQuantity: 0,
        totalSpent: 0,
        orderCount: 0
      };
      categoryData.totalQuantity += quantity;
      categoryData.totalSpent += productPrice;
      categoryData.orderCount++;
      categoryMap.set(category, categoryData);
      
      // Brand analytics
      if (brand) {
        const brandData = brandMap.get(brand) || {
          brand,
          totalQuantity: 0,
          totalSpent: 0,
          orderCount: 0
        };
        brandData.totalQuantity += quantity;
        brandData.totalSpent += productPrice;
        brandData.orderCount++;
        brandMap.set(brand, brandData);
      }
    });
  });

  // Sort and limit results
  const mostUsedProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, topCount);
    
  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, topCount);
    
  const topBrands = Array.from(brandMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, topCount);
    
  const monthlyBreakdown = Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(month => ({
      ...month,
      averageOrderValue: month.totalSpent / month.orderCount
    }));

  return {
    totalOrders: orders.length,
    dateRange: {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0]
    },
    totalSpent,
    averageOrderValue: totalSpent / orders.length,
    totalProducts,
    mostUsedProducts,
    topCategories,
    topBrands,
    monthlyBreakdown
  };
}

function formatAnalyticsOutput(analytics: OrderAnalytics, months: number): string {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} CZK`;
  
  return `📊 ORDER ANALYTICS - LAST ${months} MONTHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 PERIOD: ${analytics.dateRange.from} to ${analytics.dateRange.to}

💰 SPENDING SUMMARY:
• Total Orders: ${analytics.totalOrders}
• Total Spent: ${formatCurrency(analytics.totalSpent)}
• Average Order Value: ${formatCurrency(analytics.averageOrderValue)}
• Total Products Ordered: ${analytics.totalProducts}

🔥 MOST ORDERED PRODUCTS:
${analytics.mostUsedProducts.map((product, index) => 
  `${index + 1}. ${product.name}${product.brand ? ` (${product.brand})` : ''}
   📦 Quantity: ${product.totalQuantity} | 💰 Spent: ${formatCurrency(product.totalSpent)} | 📋 Orders: ${product.orderCount}`
).join('\n')}

📂 TOP CATEGORIES BY SPENDING:
${analytics.topCategories.map((category, index) => 
  `${index + 1}. ${category.category}
   📦 Quantity: ${category.totalQuantity} | 💰 Spent: ${formatCurrency(category.totalSpent)} | 📋 Orders: ${category.orderCount}`
).join('\n')}

🏷️ TOP BRANDS BY SPENDING:
${analytics.topBrands.map((brand, index) => 
  `${index + 1}. ${brand.brand}
   📦 Quantity: ${brand.totalQuantity} | 💰 Spent: ${formatCurrency(brand.totalSpent)} | 📋 Orders: ${brand.orderCount}`
).join('\n')}

📈 MONTHLY BREAKDOWN:
${analytics.monthlyBreakdown.map(month => 
  `${month.month}: ${month.orderCount} orders | ${formatCurrency(month.totalSpent)} | Avg: ${formatCurrency(month.averageOrderValue)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}