---
name: test-mcp
description: |
  Build and test MCP tools using direct API calls or MCP Inspector.
  Use when testing tool changes, verifying API responses, debugging
  MCP tools, or investigating what an API endpoint returns.
disable-model-invocation: false
argument-hint: "[tool-name]"
---

# Testing MCP Tools

Use this skill whenever you need to:
- **Investigate** what an API endpoint returns (e.g. before updating a tool's field mappings)
- **Verify** that tool changes correctly map API response fields
- **Debug** why a tool returns wrong or missing data
- **Test** tool changes after implementation

## 1. Build the project

Run `npm run build` to compile TypeScript. Fix any compilation errors before proceeding.

## 2. Call the API directly

Call API methods directly using Node with the `.env` file for credentials:

```bash
node --env-file=.env --input-type=module -e "
import { RohlikAPI } from './dist/rohlik-api.js';
const api = new RohlikAPI({ username: process.env.ROHLIK_USERNAME, password: process.env.ROHLIK_PASSWORD });
const result = await api.methodName(args);
console.log(JSON.stringify(result, null, 2));
"
```

Replace `methodName` and `args` with the appropriate API method. Check `src/rohlik-api.ts` for available methods.

This lets you inspect the raw API response shape to understand what fields are available, verify field names, and confirm your tool's output matches the actual data.

## 3. MCP Inspector (manual testing)

If the user wants to test the full MCP tool flow (not just the API), tell them to run `npm run inspect` in a separate terminal. The Inspector provides a web UI to invoke individual MCP tools with custom arguments.

If the user provides a specific tool name via `$ARGUMENTS`, suggest they test that tool.

## 4. Debugging with console.error

MCP servers communicate over stdout (used for the JSON-RPC protocol), so `console.log` output is invisible in the Inspector.

**Always use `console.error` for debug logging.** It writes to stderr, which is visible in the terminal where the Inspector was launched.

Example:
```typescript
console.error('[ROHLIK_DEBUG] Response:', JSON.stringify(response, null, 2));
```

**Remember to remove debug logging before committing.**

## 5. Unit tests

For logic-only changes (no API calls), run `npm test` to execute unit tests. Use `npm run test:watch` during development.