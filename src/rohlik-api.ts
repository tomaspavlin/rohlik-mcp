import fetch from 'node-fetch';
import { Product, SearchResult, CartContent, RohlikCredentials, RohlikAPIResponse, AccountData } from './types.js';
import { getAcceptLanguage } from './locale.js';

const BASE_URL = process.env.ROHLIK_BASE_URL || 'https://www.rohlik.cz';

export class RohlikAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'RohlikAPIError';
  }
}

export class RohlikAPI {
  private credentials: RohlikCredentials;
  private userId?: number;
  private addressId?: number;
  private sessionCookies: string = '';
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 100; // Minimum 100ms between requests

  constructor(credentials: RohlikCredentials) {
    this.credentials = credentials;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest<T>(
    url: string,
    options: Partial<Parameters<typeof fetch>[1]> = {}
  ): Promise<RohlikAPIResponse<T>> {
    // Apply rate limiting to prevent HTTP 429 errors
    await this.rateLimit();

    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': getAcceptLanguage(),
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Referer': BASE_URL,
      'Origin': BASE_URL,
      'rhl-email': this.credentials.username,
      'rhl-pass': this.credentials.password,
      'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      ...(this.sessionCookies && { Cookie: this.sessionCookies }),
      ...(options.headers as Record<string, string> || {})
    };

    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });

    // Store cookies for session management
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.sessionCookies = setCookieHeader;
    }

    if (!response.ok) {
      throw new RohlikAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    return await response.json() as RohlikAPIResponse<T>;
  }

  async login(): Promise<void> {
    // Auth is handled via rhl-email/rhl-pass headers on every request.
    // No explicit login needed — the headers authenticate each call.
    // Fetch userId/addressId lazily for endpoints that need them.
    if (!this.userId) {
      try {
        const response = await this.makeRequest<any>('/services/frontend-service/user');
        const user = response.data?.user;
        const address = response.data?.address;
        if (user?.id) this.userId = user.id;
        if (address?.id) this.addressId = address.id;
      } catch {
        // Non-fatal: some endpoints work without userId/addressId
      }
    }
  }

  async logout(): Promise<void> {
    // No-op: header-based auth doesn't require logout.
  }

  async searchProducts(
    productName: string,
    limit: number = 10,
    favouriteOnly: boolean = false
  ): Promise<SearchResult[]> {
    await this.login();

    try {
      const searchParams = new URLSearchParams({
        search: productName,
        offset: '0',
        limit: String(limit + 5),
        companyId: '1',
        filterData: JSON.stringify({ filters: [] }),
        canCorrect: 'true'
      });

      const response = await this.makeRequest<any>(`/services/frontend-service/search-metadata?${searchParams}`);
      
      let products = response.data?.productList || [];

      // Remove sponsored content
      products = products.filter((p: any) => 
        !p.badge?.some((badge: any) => badge.slug === 'promoted')
      );

      // Filter favourites if requested
      if (favouriteOnly) {
        products = products.filter((p: any) => p.favourite);
      }

      // Limit results
      products = products.slice(0, limit);

      return products.map((p: any) => {
        const activeSale = p.sales?.find((s: any) => s.active);
        const result: any = {
          id: p.productId,
          name: p.productName,
          price: `${p.price.full} ${p.price.currency}`,
          brand: p.brand,
          amount: p.textualAmount
        };
        if (activeSale) {
          result.salePrice = `${activeSale.price.full} ${activeSale.price.currency}`;
          result.originalPrice = `${activeSale.originalPrice.full} ${activeSale.originalPrice.currency}`;
          result.discountPercentage = activeSale.discountPercentage;
          result.saleType = activeSale.type;
        }
        return result;
      });
    } finally {
      await this.logout();
    }
  }

  async addToCart(products: Product[]): Promise<number[]> {
    await this.login();

    try {
      const addedProducts: number[] = [];

      for (const product of products) {
        try {
          const payload = {
            actionId: product.action_id || null,
            productId: product.product_id,
            quantity: product.quantity,
            recipeId: null,
            source: 'true:Shopping Lists'
          };

          await this.makeRequest('/services/frontend-service/v2/cart', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          addedProducts.push(product.product_id);
        } catch (error) {
          console.error(`Failed to add product ${product.product_id}:`, error);
        }
      }

      return addedProducts;
    } finally {
      await this.logout();
    }
  }

  async getCartContent(): Promise<CartContent> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/services/frontend-service/v2/cart');
      const data = response.data || {};

      return {
        total_price: data.totalPrice || 0,
        total_items: Object.keys(data.items || {}).length,
        can_make_order: data.submitConditionPassed || false,
        products: Object.entries(data.items || {}).map(([productId, productData]: [string, any]) => ({
          id: productId,
          cart_item_id: productData.orderFieldId || '',
          name: productData.productName || '',
          quantity: productData.quantity || 0,
          price: productData.price || 0,
          category_name: productData.primaryCategoryName || '',
          brand: productData.brand || ''
        }))
      };
    } finally {
      await this.logout();
    }
  }

  async removeFromCart(orderFieldId: string): Promise<boolean> {
    await this.login();

    try {
      await this.makeRequest(`/services/frontend-service/v2/cart?orderFieldId=${orderFieldId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${orderFieldId}:`, error);
      return false;
    } finally {
      await this.logout();
    }
  }

  async getShoppingList(shoppingListId: string): Promise<{ name: string; products: any[] }> {
    await this.login();

    try {
      const response = await this.makeRequest<any>(`/api/v1/shopping-lists/id/${shoppingListId}`);
      // Handle both wrapped and direct responses
      const listData = response.data || response;
      return {
        name: listData?.name || 'Unknown List',
        products: listData?.products || []
      };
    } finally {
      await this.logout();
    }
  }

  async getAccountData(): Promise<AccountData> {
    await this.login();

    try {
      const result: AccountData = {};
      
      // Define endpoints similar to the Python implementation
      const endpoints = {
        delivery: '/services/frontend-service/first-delivery?reasonableDeliveryTime=true',
        next_order: '/api/v3/orders/upcoming',
        announcements: '/services/frontend-service/announcements/top',
        bags: '/api/v1/reusable-bags/user-info',
        timeslot: '/services/frontend-service/v1/timeslot-reservation',
        last_order: '/api/v3/orders/delivered?offset=0&limit=1',
        premium_profile: '/services/frontend-service/premium/profile',
        delivery_announcements: '/services/frontend-service/announcements/delivery',
        delivered_orders: '/api/v3/orders/delivered?offset=0&limit=50'
      };

      // Fetch data from all endpoints
      for (const [endpoint, path] of Object.entries(endpoints)) {
        try {
          const response = await this.makeRequest<any>(path);
          (result as any)[endpoint] = response.data || response;
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
          (result as any)[endpoint] = null;
        }
      }

      // Handle next delivery slot endpoint (requires userId and addressId)
      if (this.userId && this.addressId) {
        try {
          const nextDeliveryPath = `/services/frontend-service/timeslots-api/0?userId=${this.userId}&addressId=${this.addressId}&reasonableDeliveryTime=true`;
          const response = await this.makeRequest<any>(nextDeliveryPath);
          result.next_delivery_slot = response.data || response;
        } catch (error) {
          console.error('Error fetching next_delivery_slot:', error);
          result.next_delivery_slot = null;
        }
      } else {
        result.next_delivery_slot = null;
      }

      // Get cart content (call internal method to avoid double login)
      try {
        const response = await this.makeRequest<any>('/services/frontend-service/v2/cart');
        const data = response.data || {};

        result.cart = {
          total_price: data.totalPrice || 0,
          total_items: Object.keys(data.items || {}).length,
          can_make_order: data.submitConditionPassed || false,
          products: Object.entries(data.items || {}).map(([productId, productData]: [string, any]) => ({
            id: productId,
            cart_item_id: productData.orderFieldId || '',
            name: productData.productName || '',
            quantity: productData.quantity || 0,
            price: productData.price || 0,
            category_name: productData.primaryCategoryName || '',
            brand: productData.brand || ''
          }))
        };
      } catch (error) {
        console.error('Error fetching cart:', error);
        result.cart = undefined;
      }

      return result;
    } finally {
      await this.logout();
    }
  }

  async getOrderHistory(limit: number = 50): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>(`/api/v3/orders/delivered?offset=0&limit=${limit}`);
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getDeliveryInfo(): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/services/frontend-service/first-delivery?reasonableDeliveryTime=true');
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getUpcomingOrders(): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/api/v3/orders/upcoming');
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getPremiumInfo(): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/services/frontend-service/premium/profile');
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getDeliverySlots(): Promise<any> {
    await this.login();

    try {
      if (this.userId && this.addressId) {
        const response = await this.makeRequest<any>(`/services/frontend-service/timeslots-api/0?userId=${this.userId}&addressId=${this.addressId}&reasonableDeliveryTime=true`);
        return response.data || response;
      } else {
        throw new RohlikAPIError('User ID or Address ID not available');
      }
    } finally {
      await this.logout();
    }
  }

  async getAnnouncements(): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/services/frontend-service/announcements/top');
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getReusableBagsInfo(): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>('/api/v1/reusable-bags/user-info');
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getSalesCategories(): Promise<{ id: number; name: string; slug: string }[]> {
    await this.login();

    try {
      // Get subcategory IDs
      const subResponse = await this.makeRequest<any>('/api/v1/categories/sales/subcategories');
      const subData = subResponse as any;
      const categoryIds: number[] = subData.categoryIds || [];

      if (categoryIds.length === 0) {
        return [];
      }

      // Get category names
      const params = new URLSearchParams();
      for (const id of categoryIds) {
        params.append('categories', String(id));
      }
      params.append('type', 'favorite-sales');

      const catResponse = await this.makeRequest<any>(`/api/v1/categories?${params}`);
      const categories = Array.isArray(catResponse) ? catResponse : [];

      return categories.map((c: any) => ({
        id: c.categoryId,
        name: c.name,
        slug: c.slug
      }));
    } finally {
      await this.logout();
    }
  }

  async getDiscountedProducts(
    saleType: string = 'sales',
    categoryId: number | null = null,
    page: number = 0,
    size: number = 14,
    sort: string = 'recommended'
  ): Promise<any[]> {
    await this.login();

    try {
      // Step 1: Get product IDs for the sales category
      const categoryPath = categoryId ? `/${categoryId}` : '';
      const listParams = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort,
        filter: '',
        excludeProductIds: ''
      });

      const listResponse = await this.makeRequest<any>(
        `/api/v1/categories/${saleType}${categoryPath}/products?${listParams}`
      );

      const data = listResponse as any;
      const productIds: number[] = data.productIds || [];

      if (productIds.length === 0) {
        return [];
      }

      // Step 2: Get product card details
      const cardParams = new URLSearchParams();
      for (const id of productIds) {
        cardParams.append('products', String(id));
      }
      cardParams.append('categoryType', saleType);

      const cardResponse = await this.makeRequest<any>(
        `/api/v1/products/card?${cardParams}`
      );

      return Array.isArray(cardResponse) ? cardResponse : [];
    } finally {
      await this.logout();
    }
  }

  async getOrderDetail(orderId: string): Promise<any> {
    await this.login();

    try {
      const response = await this.makeRequest<any>(`/api/v3/orders/${orderId}`);
      return response.data || response;
    } finally {
      await this.logout();
    }
  }

  async getProductComposition(productIds: number[]): Promise<any[]> {
    const params = new URLSearchParams();
    for (const id of productIds) {
      params.append('products', String(id));
    }

    const response = await fetch(`${BASE_URL}/api/v1/products/composition?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new RohlikAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }
}