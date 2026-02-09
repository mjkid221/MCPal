<p align="center">
  <img src="https://amethyst-available-jellyfish-543.mypinata.cloud/ipfs/bafkreibiatja4osqbwa2slfga4m2lungn5d46ylum6tnatb5hvgtgqznmi" alt="MCPal" width="128" />
</p>

<h1 align="center">MCPal</h1>

<p align="center">
  Lightweight MCP server for native desktop notifications with action buttons, text replies, and LLM-aware icons.<br/>
  Compatible with any MCP client.
</p>

<p align="center">
  <img src="https://amethyst-available-jellyfish-543.mypinata.cloud/ipfs/bafkreiedp2ie4xzwj4fxcmpj2sgk4t6z7r5b74k3m5ap7eqt2tiek2faju" alt="MCPal Notification" width="400" />
</p>

## Usage

Add to your MCP Config manually:
```json
// JSON
{
  "mcpServers": {
    "mcpal": {
      "command": "npx",
      "args": ["mcpal@latest"]
    }
  }
}
```
Or TOML (Codex):
```toml
// TOML
[mcp_servers.mcpal]
command = "npx"
args = ["-y", "mcpal@latest"]
```
### Codex CLI

Add MCPal directly via the CLI:

```bash
codex mcp add mcpal -- npx -y mcpal@latest
```

### Claude Code

Add MCPal directly via the CLI:

```bash
# Project scope (current project only)
claude mcp add mcpal -- npx -y mcpal@latest

# User scope (available in all projects)
claude mcp add mcpal --scope user -- npx -y mcpal@latest
```

### Configuring Proactive Notifications

MCPal includes built-in MCP instructions that tell clients *how* to use notifications. To configure *when* your assistant should proactively notify you, add this to your client instruction file. This should either be `AGENTS.md` or `CLAUDE.md` based on your model:

```markdown
## Post Task Completion Hook

ALWAYS use MCPal MCP tool (if available) to notify me when you finish any tasks (this includes reading files, investigating, coding). You should use this tool before you terminate conversations. Refer to tool instructions precisely to craft your response.
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
| `title` | string | No | The notification title (default: "MCPal") |
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

### Tool Result Contract

`send_notification` now returns a dual contract:

- Canonical machine output via `structuredContent` (recommended for parsing)
- Backward-compatible text output in `content[0].text`

Structured fields:

- `status`: `"sent"` or `"error"`
- `title?`: Notification title
- `message?`: Message actually sent after sanitization
- `response?`: Notification response (`"timeout"`, clicked action, etc.)
- `activationType?`: Activation source (`"replied"`, `"actionClicked"`, etc.)
- `reply?`: User free-form reply
- `error?`: Error message when `status` is `"error"`
- `sanitized?`: `true` when MCPal had to sanitize or truncate inputs

Legacy text is still line-based, but each value is JSON-encoded on a single line for parser safety, for example:

```text
status: "sent"
title: "MCPal"
message: "Line 1\nLine 2"
response: "timeout"
```

### Input Sanitization

Before delivery, MCPal applies best-effort sanitization to reduce notifier/parser failures:

- Normalize line endings: `\r\n` / `\r` -> `\n`
- Remove unsafe control chars (keeps `\n` and `\t`)
- Truncate limits:
  - `title`: 256 chars
  - `message`: 4000 chars
  - `actions`: max 3 items, each 64 chars
  - `dropdownLabel`: 64 chars

## LLM-Aware Icons

MCPal detects which MCP client is calling the tool and displays the appropriate icon in notifications.

| Client | Icon |
|--------|------|
| Claude Desktop / Claude Code / Opus | Claude logo |
| Codex / OpenAI / ChatGPT | OpenAI logo |
| Cursor | Cursor logo |
| VS Code | VS Code logo |
| Unknown | No icon |

This works via the MCP protocol's client identification - each client sends its name during initialization.

### Adding New Client Icons

To add support for a new LLM client, add a PNG to `src/assets/clients/` and update the mapping in `src/notify.config.ts`.

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

The package includes a custom notification icon that replaces the default Terminal icon on desktop. This is automatically configured during installation via the `postinstall` script.

### Notification Permissions

After the first notification, your system may prompt you to allow notifications from "MCPal". You can manage this in:

**System Settings > Notifications > MCPal**

## Development

```bash
# Install dependencies
pnpm install

# Build (required after clone - sets up desktop notification app)
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

### Local Dev Troubleshooting

If you run a local build directly from `dist/index.js` and notifications are not working, make sure the entrypoint is executable:

```bash
chmod +x dist/index.js
```

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
