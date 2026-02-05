<p align="center">
  <img src="https://amethyst-available-jellyfish-543.mypinata.cloud/ipfs/bafkreibiatja4osqbwa2slfga4m2lungn5d46ylum6tnatb5hvgtgqznmi" alt="MCPal" width="128" />
</p>

<h1 align="center">MCPal</h1>

<p align="center">
  MCP server for native macOS notifications with action buttons, text replies, and LLM-aware icons.<br/>
  Built for <strong>Claude Code</strong> and <strong>Claude Desktop</strong>. Compatible with any MCP client.
</p>

<p align="center">
  <img src="https://amethyst-available-jellyfish-543.mypinata.cloud/ipfs/bafkreiedp2ie4xzwj4fxcmpj2sgk4t6z7r5b74k3m5ap7eqt2tiek2faju" alt="MCPal Notification" width="400" />
</p>

## Usage

Add to your MCP Config:

```json
{
  "mcpServers": {
    "mcpal": {
      "command": "npx",
      "args": ["mcpal"]
    }
  }
}
```

### Claude Code

Add MCPal directly via the CLI:

```bash
# Project scope (current project only)
claude mcp add mcpal -- npx -y mcpal

# User scope (available in all projects)
claude mcp add mcpal --scope user -- npx -y mcpal
```

### Configuring Proactive Notifications (Claude)

MCPal includes built-in MCP instructions that tell Claude *how* to use notifications. To configure *when* Claude should proactively notify you, add this to your `CLAUDE.md`:

```markdown
## Post Task Completion Hook

ALWAYS use MCPal MCP tool to notify me when you finish any tasks (this includes reading files, investigating, coding). You should use this tool before you terminate any conversations. Also notify when:
- A long-running task completes (builds, tests, deployments)
- You need my input or decision on something
- You encounter an error that blocks progress

Use `reply: true` when you need free-form input from me.
```

Customize this based on your preferences - some users want frequent updates, others only want notifications for important decisions.

### Other MCP Clients

MCPal works with any MCP-compatible client (Cursor, VS Code with MCP extensions, etc.). The setup varies by client - refer to your client's documentation for adding MCP servers.

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

## LLM-Aware Icons

MCPal detects which MCP client is calling the tool and displays the appropriate icon in notifications. Currently tested with Claude Code and Claude Desktop:

| Client | Icon |
|--------|------|
| Claude Desktop / Claude Code | Claude logo |
| Cursor | Cursor logo |
| VS Code | VS Code logo |
| OpenAI / ChatGPT | OpenAI logo |
| Unknown | No icon |

This works via the MCP protocol's client identification - each client sends its name during initialization.

### Adding New Client Icons

To add support for a new LLM client, add a PNG to `src/assets/clients/` and update the mapping in `src/notify.ts`.

**Icon Specifications:**

| Property | Requirement |
|----------|-------------|
| Format | PNG with transparency (RGBA) |
| Dimensions | 128×128 pixels |
| File size | <10KB (use pngquant for compression) |

```bash
# Optimize a new icon
convert input.png -resize 128x128 -background none -gravity center -extent 128x128 temp.png
pngquant --quality=65-80 --output src/assets/clients/newclient.png temp.png
rm temp.png
```

## Custom App Icon

The package includes a custom notification icon that replaces the default Terminal icon on macOS. This is automatically configured during installation via the `postinstall` script.

### Notification Permissions

After the first notification, macOS may prompt you to allow notifications from "MCPal". You can manage this in:

**System Settings > Notifications > MCPal**

## Development

```bash
# Install dependencies
pnpm install

# Build (required after clone - sets up macOS notification app)
pnpm run build

# Type check
pnpm run typecheck

# Lint
pnpm run lint:fix

# Format
pnpm run format:fix
```

### MCP Inspector

Test the MCP server interactively using the official inspector:

```bash
pnpx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web UI where you can:
- View available tools and their schemas
- Send test notifications with different parameters
- See raw MCP protocol messages

### Testing Notifications

Test the notification system directly without running the MCP server:

```bash
# Simple notification (default)
pnpm run test:notification

# With action buttons
pnpm run test:notification actions

# With reply input
pnpm run test:notification reply

# Run all tests
pnpm run test:notification all
```

## License

**Code:** MIT License

**MCPal Icon & Branding:** © 2025 All Rights Reserved. The MCPal logo and icon designs may not be used without permission.
