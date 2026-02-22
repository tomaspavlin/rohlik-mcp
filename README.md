# <img src="https://www.rohlik.cz/favicon/cz/favicon.ico" alt="Rohlik" width="30" height="30"> Rohlik MCP Server

**Enhance your favourite LLM with capabilities to buy groceries.**

> [!WARNING]
> This MCP server is made for study purposes with use of reverse engineered Rohlik API. It is for personal use only.

This is a Model Context Protocol (MCP) server that enables AI assistants to interact with the Rohlik Group's online grocery delivery services across multiple countries. This server provides tools for searching products, managing shopping carts, and accessing account info.

**Supported Services:**
- 🇨🇿 **[Rohlik.cz](https://www.rohlik.cz)** - Czech Republic
- 🇩🇪 **[Knuspr.de](https://www.knuspr.de)** - Germany  
- 🇦🇹 **[Gurkerl.at](https://www.gurkerl.at)** - Austria
- 🇭🇺 **[Kifli.hu](https://www.kifli.hu)** - Hungary
- 🇷🇴 **[Sezamo.ro](https://www.sezamo.ro)** - Romania
- 🇮🇹 **[Sezamo.it](https://www.sezamo.it)** - Italy (planned)
- 🇪🇸 **[Sezamo.es](https://www.sezamo.es)** - Spain (planned)

Example LLM prompts that work very well with the Rohlik MCP:

**🛒 Regular Shopping:**
- *Add ingredients for apple pie to the cart. Only gluten-free and budget-friendly.*
- *Or actually, instead of apple pie I want to make pumpkin pie. Change the ingredients.*
- *What are the items in my cart?*
- *Add the items in the attached shopping list photo to the cart.*
- *Add the bread I marked as favorite in Rohlik to my cart.*

**🤖 Smart Shopping:**
- *"Add breakfast items I typically order"*
- *"Show me lunch suggestions for this week"*
- *"What do I usually buy for dinner?"*
- *"I need snacks - suggest what I normally order"*
- *"Show my top 20 most purchased items"*
- *"What can I do with Rohlik MCP?"*

**📅 Planning:**
- *What are the cheapest delivery slots for tomorrow?*
- *When is my next delivery?*
- *Show my last 5 orders*

## 📚 Documentation

**New to Rohlik MCP?** Check out our [Complete Guide for Newcomers](./docs/README.md)!

## Usage

### Claude Desktop Configuration

Add the MCP to Claude Desktop configuration:
- On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "rohlik": {
      "command": "npx",
      "args": ["-y", "@tomaspavlin/rohlik-mcp"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password",
        "ROHLIK_BASE_URL": "https://www.rohlik.cz"
      }
    }
  }
}
```

### Supported Regions

The server supports multiple Rohlik regions by setting the `ROHLIK_BASE_URL` environment variable:

* **Czech Republic**: `https://www.rohlik.cz` (default)
* **Germany**: `https://www.knuspr.de`
* **Austria**: `https://www.gurkerl.at`
* **Hungary**: `https://www.kifli.hu`
* **Romania**: `https://www.sezamo.ro`
* **Italy** (planned): `https://www.sezamo.it`
* **Spain** (planned): `https://www.sezamo.es`

If `ROHLIK_BASE_URL` is not specified, it defaults to the Czech version.

## Tools

### Core Shopping
- `search_products` - Search for grocery products by name with filtering options
- `add_to_cart` - Add multiple products to your shopping cart
- `get_cart_content` - View current cart contents and totals
- `remove_from_cart` - Remove items from your shopping cart
- `get_shopping_list` - Retrieve shopping lists by ID

### 🤖 Smart Shopping
- `get_meal_suggestions` - Get personalized suggestions for breakfast, lunch, dinner, snacks, baking, drinks, or healthy eating based on your order history
- `get_frequent_items` - Analyze order history to find most frequently purchased items (overall + per category)
- `get_shopping_scenarios` - Interactive guide showing what you can do with the MCP

### Getting info
- `get_account_data` - Get comprehensive account information including delivery details, orders, announcements, cart, and premium status
- `get_order_history` - View your past delivered orders with details
- `get_order_detail` - Get detailed information about a specific order including all products
- `get_upcoming_orders` - See your scheduled upcoming orders
- `get_delivery_info` - Get current delivery information and fees
- `get_delivery_slots` - View available delivery time slots for your address
- `get_premium_info` - Check your Rohlik Premium subscription status and benefits
- `get_announcements` - View current announcements and notifications
- `get_reusable_bags_info` - Track your reusable bags and environmental impact

## Development

### Installation

```bash
npm install
npm run build
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Launch the production server
- `npm run dev` - Start development mode with watch
- `npm run inspect` - Test with MCP Inspector
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Testing

### Unit Tests

The project includes unit tests for smart shopping data transformation logic:

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**What's tested:**
- Frequency analysis algorithms (`get_frequent_items`)
- Meal suggestion filtering and ranking (`get_meal_suggestions`)
- Price averaging and calculations
- Category filtering and grouping
- Edge cases (empty data, missing fields, etc.)

See [tests/README.md](./tests/README.md) for detailed testing documentation.

### Testing with Claude Desktop

Add this to configuration:

```json
{
  "mcpServers": {
    "rohlik-local": {
      "command": "node",
      "args": ["/path/to/rohlik-mcp/dist/index.js"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password",
        "ROHLIK_BASE_URL": "https://www.rohlik.cz"
      }
    }
  }
}
```

### Debug Mode

If you're experiencing authentication issues, enable debug mode to see detailed logs:

```json
{
  "mcpServers": {
    "rohlik-local": {
      "command": "node",
      "args": ["/path/to/rohlik-mcp/dist/index.js"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password",
        "ROHLIK_BASE_URL": "https://www.rohlik.cz",
        "ROHLIK_DEBUG": "true"
      }
    }
  }
}
```

Debug logs will appear in `~/Library/Logs/Claude/mcp-server-rohlik-local.log` (macOS) or `%APPDATA%/Claude/logs/mcp-server-rohlik-local.log` (Windows).

### Testing with MCP Inspector

You can test the MCP server using the official MCP Inspector (https://modelcontextprotocol.io/legacy/tools/inspector):

```bash
npm run inspect
```

In the Inspector, set the ROHLIK_USERNAME and ROHLIK_PASSWORD envs.

### API Validation Tool

To validate that all Rohlik API endpoints are working correctly and diagnose authentication issues:

```bash
npm run validate-api
```

This will:
- Test all 11 API endpoints used by the MCP server
- Show detailed HTTP request/response logs in the console
- Generate a JSON report: `tests/validation-results.json`
- Generate a beautiful HTML report: `tests/validation-report.html`

The validator automatically loads credentials from your Claude Desktop config or environment variables. Open the HTML report in your browser for an easy-to-read summary of all tests.

## Troubleshooting

### Common Issues

#### Claude Desktop does not see the MCP server (on Windows)

For your config file, instead of `%APPDATA%/Claude/claude_desktop_config.json` use `C:\Users\[YOUR WINDOWS USER]\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json`

#### "Login failed" Error

**Possible causes:**
1. Wrong username/password in configuration
2. Rohlik API changed or is temporarily unavailable
3. Network connectivity issues

**Solutions:**
1. Verify credentials in your `claude_desktop_config.json`
2. Enable debug mode: `"ROHLIK_DEBUG": "true"` in env section
3. Check logs: `~/Library/Logs/Claude/mcp-server-rohlik*.log` (macOS) or `%APPDATA%\Claude\logs\mcp-server-rohlik*.log` (Windows)
4. Run API validator: `npm run validate-api` to test all endpoints

#### "No order history found"

**Cause:** Your account has no past orders, or orders are not accessible

**Solution:** Ensure you have at least one completed order on Rohlik before using smart shopping features (`get_meal_suggestions`, `get_frequent_items`)

#### Slow response times

**Causes:**
- Analyzing too many orders (smart shopping features)
- Network latency to Rohlik servers
- API rate limiting

**Solutions:**
- For smart shopping: reduce number of orders analyzed (try 10 instead of default 20)
- Use fewer requests or add delays between bulk operations
- Check your network connection

#### Products not found or search returns no results

**Causes:**
- Product out of stock or discontinued
- Product ID changed in Rohlik system
- Spelling mistake in search query

**Solutions:**
- Search by partial name instead of full product name
- Try alternative spellings or broader search terms
- Verify product exists on Rohlik website directly

#### Server fails with `spawn npx ENOENT`

Under Claude Desktop, fails with:
```shell
spawn npx ENOENT
Server disconnected. Transport closed unexpectedly.
```

**Solutions:**
- Change config to use absolute path to npx as /Users/adam/.local/share/mise/installs/node/22.14.0/bin/npx)
- See more info: https://github.com/tomaspavlin/rohlik-mcp/issues/6

### Enabling Debug Mode

Add `ROHLIK_DEBUG` to your configuration to see detailed logs:

```json
{
  "mcpServers": {
    "rohlik-local": {
      "command": "node",
      "args": ["/path/to/rohlik-mcp/dist/index.js"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password",
        "ROHLIK_BASE_URL": "https://www.rohlik.cz",
        "ROHLIK_DEBUG": "true"
      }
    }
  }
}
```

**View logs:**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp-server-rohlik-local.log

# Windows
type %APPDATA%\Claude\logs\mcp-server-rohlik-local.log
```

### Using the API Validation Tool

If you encounter authentication or API issues, run the validator:

```bash
npm run validate-api
```

This will:
- Test all 11 API endpoints used by the MCP
- Show detailed HTTP request/response information
- Generate `validation-results.json` with test results
- Create `validation-report.html` for easy viewing in browser
- Help identify which specific endpoints are failing

### Publishing as NPM package

1. Update version in package.json
2. `npm publish`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- https://github.com/dvejsada/HA-RohlikCZ for reverse engineering the Rohlik.cz API
