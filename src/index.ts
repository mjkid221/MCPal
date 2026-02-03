#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFile } from "child_process";
import path from "path";
import { z } from "zod";

const jxaPath = path.join(__dirname, "notify.jxa.js");

function notify(message: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "osascript",
      ["-l", "JavaScript", jxaPath],
      { env: { ...process.env, NOTIFY_MESSAGE: message, NOTIFY_TITLE: title } },
      (error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      },
    );
  });
}

const server = new McpServer({
  name: "mac-mcp-notifier",
  version: "1.0.0",
});

server.registerTool(
  "send_notification",
  {
    description: "Send a native macOS notification with a title and message",
    inputSchema: {
      message: z.string().describe("The notification body text"),
      title: z.string().optional().describe("The notification title"),
    },
  },
  async ({ message, title }) => {
    try {
      await notify(message, title ?? "Notification");
      return {
        content: [
          {
            type: "text",
            text: `Notification sent: ${title ?? "Notification"} — ${message}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Failed to send notification: ${error}` },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
