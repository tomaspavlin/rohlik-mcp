[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/tomaspavlin-rohlik-mcp-badge.png)](https://mseep.ai/app/tomaspavlin-rohlik-mcp)

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
- *Add ingredients for apple pie to the cart. Only gluten-free and budget-friendly.*
- *Or actually, instead of apple pie I want to make pumpkin pie. Change the ingredients.*
- *What are the items in my cart?*
- *Add the items in the attached shopping list photo to the cart.*
- *Add the bread I marked as favorite in Rohlik to my cart.*
- *What are the cheapest delivery slots for tomorrow?*

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

### Getting info
- `get_account_data` - Get comprehensive account information including delivery details, orders, announcements, cart, and premium status
- `get_order_history` - View your past delivered orders with details
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

## Testing

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

### Testing with MCP Inspector

You can test the MCP server using the official MCP Inspector (https://modelcontextprotocol.io/legacy/tools/inspector):

```bash
npm run inspect
```

In the Inspector, set the ROHLIK_USERNAME and ROHLIK_PASSWORD envs.

### Publishing as NPM package

1. Update version in package.json
2. `npm publish`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- https://github.com/dvejsada/HA-RohlikCZ for reverse engineering the Rohlik.cz API
