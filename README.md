# mac-mcp-notifier

A Model Context Protocol (MCP) server that sends native macOS notifications. Perfect for getting notified when Claude finishes long-running tasks.

## Requirements

- macOS 11.0 (Big Sur) or later
- Node.js 18+
- Xcode Command Line Tools (for building from source)

## Installation

## Setup

### 1. Configure Claude Code

Add the MCP server to your Claude Code settings at `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "mac-mcp-notifier": {
      "command": "npx",
      "args": ["-y", "mac-mcp-notifier"]
    }
  }
}
```

### 2. Restart Claude Code

Restart Claude Code or run `/mcp` to reload MCP servers.

### 3. Grant Notification Permissions

On first use, macOS will prompt you to allow notifications. You can also manually enable them:

1. Open **System Settings** > **Notifications**
2. Find **MCP Notifier** in the list
3. Enable **Allow Notifications**

## Building from Source

```bash
git clone https://github.com/yourusername/mac-mcp-notifier.git
cd mac-mcp-notifier
npm install
npm run build
```

Then configure Claude Code to use the local build:

```json
{
  "mcpServers": {
    "mac-mcp-notifier": {
      "command": "node",
      "args": ["/path/to/mac-mcp-notifier/dist/index.js"]
    }
  }
}
```

## Usage

Once configured, Claude can send you notifications using the `send_notification` tool:

```
Claude, send me a notification when you're done with this task.
```

### Tool Parameters

| Parameter | Type   | Required | Description                |
|-----------|--------|----------|----------------------------|
| message   | string | Yes      | The notification body text |
| title     | string | No       | The notification title (defaults to "Notification") |

## Troubleshooting

### Notifications not appearing

1. **Check notification permissions**: Go to System Settings > Notifications > MCP Notifier and ensure notifications are enabled.

2. **Check Focus mode**: If you have Focus mode enabled, notifications may be silenced.

3. **Rebuild the binary**: If you updated the package, rebuild with `npm run build`.

### "Notifications are not allowed" error

The app needs notification permissions. Run the notifier binary directly once to trigger the permission prompt:

```bash
# If installed globally
mac-mcp-notifier-bin --title "Test" --message "Hello"

# If built from source
./bin/Notifier.app/Contents/MacOS/notifier --title "Test" --message "Hello"
```

Then grant permission in the system dialog or via System Settings.

### MCP server not connecting

1. Verify the path in your settings is correct
2. Ensure the package is built: `npm run build`
3. Check Claude Code logs for errors

## Development

```bash
# Install dependencies
npm install

# Build TypeScript and Swift
npm run build

# Build only Swift binary
npm run build:swift

# Lint
npm run lint
```

## How It Works

The package consists of two components:

1. **MCP Server** (TypeScript): Handles the MCP protocol and receives tool calls from Claude
2. **Notifier App** (Swift): A native macOS app bundle that displays notifications using the UserNotifications framework

When Claude calls the `send_notification` tool, the MCP server spawns the Swift notifier binary with the title and message as arguments.

## License

MIT
