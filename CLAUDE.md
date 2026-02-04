# CLAUDE.md - Developer Guide for MCPal

This file provides context for AI assistants (like Claude) working on this codebase.

## Project Overview

**MCPal** is an MCP (Model Context Protocol) server that sends native desktop notifications. It allows LLM applications to notify users and receive their responses (clicks, button selections, or text replies).

### Key Features
- **Cross-platform**: Works on macOS, Linux, and Windows via `node-notifier`
- LLM-aware icons on macOS (shows Claude/Cursor/VS Code logo)
- Action buttons and text reply support
- Smart timeouts (10s simple, 30s actions, 60s reply)
- Custom app branding on macOS (MCPal.app)

### Platform Support
| Platform | Notifications | Custom Icons | Actions | Reply |
|----------|--------------|--------------|---------|-------|
| macOS | ✅ terminal-notifier | ✅ | ✅ | ✅ |
| Linux | ✅ notify-send | ❌ | ❌ | ❌ |
| Windows | ✅ toast | ❌ | ✅ | ❌ |

## Architecture

```
src/
├── index.ts              # MCP server entry point, tool registration
├── notify.ts             # Core notification logic, client icon detection
├── assets/
│   ├── mcpal.icns        # App bundle icon (left side of notification)
│   └── clients/          # LLM client logos (right side of notification)
│       └── claude.png
└── scripts/
    ├── setup-notifier.ts # Postinstall: renames app bundle, sets icon
    └── test-notification.ts # Manual testing script
```

## Key Files

### src/index.ts
- Creates `McpServer` with name "mcpal"
- Registers `send_notification` tool with Zod schema
- Gets client info via `server.server.getClientVersion()` for icon detection
- Returns friendly responses describing user's action

### src/notify.ts
- `notify()` - Main function that sends notifications
- `getContentImageForClient()` - Maps client names to icon files
- `getNotifierPath()` - Finds the renamed MCPal.app executable
- `getNotifier()` - Creates NotificationCenter with custom path
- Timeout constants: `TIMEOUT_SIMPLE`, `TIMEOUT_ACTIONS`, `TIMEOUT_REPLY`

### src/scripts/setup-notifier.ts
- Runs on `postinstall`
- Renames `terminal-notifier.app` → `MCPal.app`
- Updates `Info.plist`: icon, bundle ID, bundle name
- Required for macOS to show "MCPal" in System Preferences

## How Notifications Work

1. **MCP client calls** `send_notification` tool
2. **Server detects client** via `getClientVersion()` (e.g., "claude-code")
3. **Icon selected** based on client name → `claude.png`
4. **Timeout determined** based on options (reply > actions > simple)
5. **Notification sent** via `node-notifier` with `customPath` to MCPal.app
6. **User responds** (click, action, reply, timeout, dismiss)
7. **Response returned** to MCP client in friendly format

## Client Detection

The MCP protocol includes client identification in the initialization handshake:
```typescript
const clientInfo = server.server.getClientVersion();
// Returns: { name: "claude-code", version: "1.0.0", ... }
```

Client name mapping in `CLIENT_ICONS`:
- `claude`, `claude-desktop`, `claude-code` → `claude.png`
- `cursor` → `cursor.png`
- `vscode` → `vscode.png`
- `openai`, `chatgpt` → `openai.png`

**Note**: Actual client names are logged to stderr for discovery:
```
[MCPal] Client: claude-code v1.0.0
```

## App Bundle Customization

macOS caches app metadata by **bundle path**, not plist contents. To show "MCPal" in System Preferences:

1. `setup-notifier.ts` renames `terminal-notifier.app` → `MCPal.app`
2. Updates `Info.plist`:
   - `CFBundleIconFile` → `mcpal`
   - `CFBundleIdentifier` → `com.mcpal`
   - `CFBundleName` → `MCPal`
3. `notify.ts` uses `customPath` option to find renamed app

## Development Workflow

### Build
```bash
pnpm run build        # Compile TypeScript + copy assets
pnpm run typecheck    # Type check without emitting
```

### Test Notifications
```bash
pnpm run test:notification simple   # Basic notification
pnpm run test:notification actions  # With buttons
pnpm run test:notification reply    # With text input
pnpm run test:notification all      # Run all tests
```

### Reset App Bundle
If notifications stop working after npm/pnpm changes:
```bash
pnpm run build
node dist/scripts/setup-notifier.js
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Common Tasks

### Add a new client icon
1. Add PNG to `src/assets/clients/` (e.g., `windsurf.png`)
2. Add mapping in `src/notify.ts`:
   ```typescript
   export const CLIENT_ICONS: Record<string, string> = {
     // ... existing
     windsurf: "windsurf.png",
   };
   ```
3. Rebuild: `pnpm run build`

### Change timeout defaults
Edit constants in `src/notify.ts`:
```typescript
const TIMEOUT_SIMPLE = 10;  // seconds
const TIMEOUT_ACTIONS = 30;
const TIMEOUT_REPLY = 60;
```

### Update MCP tool schema
Edit `inputSchema` in `src/index.ts`. Uses Zod for validation.

### Debug notification issues
1. Check if MCPal.app exists:
   ```bash
   ls node_modules/.pnpm/node-notifier*/node_modules/node-notifier/vendor/mac.noindex/
   ```
2. Re-run setup: `node dist/scripts/setup-notifier.js`
3. Check System Preferences > Notifications for "MCPal" entry
4. If stuck on old entry, restart mac or delete notification DB

## npm Publishing

Package is configured for npm with:
- `"engines": {"node": ">=18.0.0"}`
- `postinstall` script for macOS app bundle setup (skipped on other platforms)

Publish workflow:
1. Update version in `package.json`
2. Create GitHub release → triggers `.github/workflows/publish.yml`
3. Auto-publishes to npm

## When to Use Each Notification Type

**IMPORTANT FOR AI ASSISTANTS**: Choose the right notification type based on what you need:

### Simple Notification (default)
```typescript
notify({ title: "Done!", message: "Build completed successfully" })
```
Use for: Status updates, completions, confirmations. User just needs to know something happened.

### Action Buttons
```typescript
notify({ title: "Deploy?", message: "Ready to deploy to production", actions: ["Yes", "No"] })
```
Use for: Binary choices, simple decisions. When you need the user to pick from predefined options.

### Reply Mode (PREFERRED for questions) ⭐
```typescript
notify({ title: "Question", message: "What should I name this function?", reply: true })
```
**USE THIS when you need free-form user input!** This is the fastest way to get user feedback:
- Asking clarifying questions
- Getting file names, variable names, or other text input
- Requesting feedback on your work
- Any time you'd otherwise ask in chat

The user can type their response directly in the notification without switching windows. Their reply is returned in `result.reply`.

## Important Notes

- **Cross-platform**: Works on all platforms, but macOS has the richest features (icons, reply, actions)
- **postinstall required**: `--ignore-scripts` will break macOS customizations
- **MCP server restart**: After code changes, MCP server must restart to pick up changes
- **Client names are guesses**: Actual names depend on what each MCP client sends
