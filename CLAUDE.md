# Rohlik MCP Server - Project Context

## Overview
This is a Model Context Protocol (MCP) server for Rohlik Group's online grocery services across Europe (Rohlik.cz, Knuspr.de, Gurkerl.at, Kifli.hu, Sezamo.ro).

## Project Structure
```
src/
├── index.ts              # Main server entry point
├── rohlik-api.ts         # API client with all HTTP calls
├── types.ts              # TypeScript type definitions
└── tools/                # Individual MCP tools
    ├── search-products.ts
    ├── cart-management.ts
    ├── shopping-lists.ts
    ├── account-data.ts
    ├── order-history.ts
    ├── order-detail.ts
    ├── delivery-info.ts
    ├── upcoming-orders.ts
    ├── premium-info.ts
    ├── delivery-slots.ts
    ├── announcements.ts
    ├── reusable-bags.ts
    ├── frequent-items.ts      # Analyze purchase patterns
    ├── meal-suggestions.ts    # Data-driven meal shopping
    ├── shopping-scenarios.ts  # User help guide
    └── discounted-items.ts    # Browse current sales/deals

tests/
├── README.md             # Comprehensive testing guide
├── helpers.ts            # Mock data generators
├── frequent-items.test.ts    # Unit tests for frequency analysis
├── meal-suggestions.test.ts  # Unit tests for meal suggestions
└── validate-api.ts       # Integration tests for API endpoints
```

## Environment Variables
- `ROHLIK_USERNAME` - User email (required)
- `ROHLIK_PASSWORD` - User password (required)
- `ROHLIK_BASE_URL` - Service URL (optional, defaults to rohlik.cz)
- `ROHLIK_DEBUG` - Enable debug logging (optional, set to "true")

## Available Tools (17 total)
**Smart Shopping:** get_meal_suggestions, get_frequent_items, get_shopping_scenarios
**Core Shopping:** search_products, add_to_cart, get_cart_content, remove_from_cart, get_shopping_list
**Deals & Discounts:** get_discounted_items
**Order Management:** get_account_data, get_order_history, get_order_detail, get_upcoming_orders
**Delivery:** get_delivery_info, get_delivery_slots
**Account:** get_premium_info, get_announcements, get_reusable_bags_info

## Key Implementation Details
- Each tool is in separate file for modularity
- API client handles authentication (login/logout per request)
- All endpoints use reverse-engineered Rohlik Group APIs
- Session management via cookies
- Error handling with typed exceptions
- Unit tests for data transformation logic (smart shopping features)
- Integration tests for API validation

## Development Commands
- `npm run build` - Compile TypeScript
- `npm start` - Run production server
- `npm run dev` - Development mode
- `npm run inspect` - Test with MCP Inspector
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run validate-api` - Integration tests for API endpoints

## Testing
- **`/test-mcp` skill** - Use this skill whenever you need to investigate what an API endpoint returns, verify tool field mappings, debug tool output, or test changes. It lets you call the API directly via `node --env-file=.env` without needing the user to run the Inspector.
- **Unit tests** - Test data transformation logic in smart shopping features (frequent-items, meal-suggestions)
- **Integration tests** - Validate all API endpoints against real Rohlik API
- **Test helpers** - Mock data generators for consistent test data
- See `tests/README.md` for comprehensive testing documentation

## Documentation Structure
- `README.md` - Quick overview, installation, basic usage, troubleshooting
- `docs/README.md` - Comprehensive user guide (500+ lines)
- `tests/README.md` - Testing guide with examples and best practices
- `CLAUDE.md` - This file, for Claude Code context