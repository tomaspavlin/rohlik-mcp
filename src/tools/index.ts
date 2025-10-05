import { RohlikAPI } from "../rohlik-api.js";
import { createSearchProductsTool } from "./search-products.js";
import { createCartManagementTools } from "./cart-management.js";
import { createShoppingListsTool } from "./shopping-lists.js";
import { createAccountDataTool } from "./account-data.js";
import { createOrderAnalyticsTool } from "./order-analytics.js";

export function createAllTools(createRohlikAPI: () => RohlikAPI) {
  const searchProducts = createSearchProductsTool(createRohlikAPI);
  const cartTools = createCartManagementTools(createRohlikAPI);
  const shoppingLists = createShoppingListsTool(createRohlikAPI);
  const accountData = createAccountDataTool(createRohlikAPI);
  const orderAnalytics = createOrderAnalyticsTool(createRohlikAPI);

  return {
    [searchProducts.name]: searchProducts,
    [cartTools.addToCart.name]: cartTools.addToCart,
    [cartTools.getCartContent.name]: cartTools.getCartContent,
    [cartTools.removeFromCart.name]: cartTools.removeFromCart,
    [shoppingLists.name]: shoppingLists,
    [accountData.name]: accountData,
    [orderAnalytics.name]: orderAnalytics,
  };
}