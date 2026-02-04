# MCPal

MCP server that sends native macOS notifications with support for action buttons, text replies, custom sounds, and LLM-aware icons.

## Installation

```bash
npm install mcpal
# or
pnpm add mcpal
```

## Usage

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "notifier": {
      "command": "npx",
      "args": ["mcpal"]
    }
  }
}
```

## Tool: `send_notification`

Send native notifications with optional features.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | The notification body text |
| `title` | string | No | The notification title (default: "Notification") |
| `actions` | string[] | No | Action buttons (e.g., `["Yes", "No", "Maybe"]`) |
| `dropdownLabel` | string | No | Label for actions dropdown (required for multiple actions) |
| `reply` | boolean | No | Enable text reply input |
| `sound` | boolean \| string | No | Play sound: `true` for default, or a sound name |

### Available Sounds

`Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`

### Examples

**Simple notification:**
```json
{
  "message": "Build complete!",
  "title": "CI/CD"
}
```

**With actions:**
```json
{
  "message": "Deploy to production?",
  "title": "Deployment",
  "actions": ["Deploy", "Cancel"],
  "dropdownLabel": "Choose"
}
```

**With reply:**
```json
{
  "message": "What should I name this file?",
  "title": "Question",
  "reply": true
}
```

**With sound:**
```json
{
  "message": "Task finished",
  "sound": "Ping"
}
```

## LLM-Aware Icons

MCPal automatically detects which LLM client is calling the tool and displays the appropriate icon in notifications:

| Client | Icon |
|--------|------|
| Claude Desktop / Claude Code | Claude logo |
| Cursor | Cursor logo |
| VS Code | VS Code logo |
| OpenAI / ChatGPT | OpenAI logo |
| Unknown | No icon |

This works via the MCP protocol's client identification - each client sends its name during initialization.

## Custom App Icon

The package includes a custom notification icon that replaces the default Terminal icon on macOS. This is automatically configured during installation via the `postinstall` script.

### Clearing Icon Cache

If you change the icon (`src/assets/mcpal.icns`) and macOS doesn't show the updated icon, you need to clear the icon cache:

```bash
pnpm run clear-icon-cache
```

This script:
1. Clears the Launch Services database
2. Restarts NotificationCenter

**Manual steps if the script doesn't work:**

```bash
# Clear Launch Services cache
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Restart NotificationCenter
killall NotificationCenter
```

If the icon still doesn't update:
- Wait a few seconds and try sending another notification
- Log out and log back in
- In extreme cases, restart your Mac

### Notification Permissions

After the first notification, macOS may prompt you to allow notifications from "MCPal". You can manage this in:

**System Settings > Notifications > MCPal**

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Type check
pnpm run typecheck

# Lint
pnpm run lint:fix

# Format
pnpm run format:fix
```

### Testing Notifications

Test the notification system directly without running the MCP server:

```bash
# Simple notification (default)
pnpm run test:notification

# With sound
pnpm run test:notification sound

# With action buttons
pnpm run test:notification actions

# With reply input
pnpm run test:notification reply

# Run all tests
pnpm run test:notification all
```

## License

MIT
