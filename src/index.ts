#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getContentImageForClient, notify } from "./notify.js";

const server = new McpServer(
  {
    name: "mcpal",
    version: "1.0.0",
  },
  {
    instructions: `MCPal is your friendly notification buddy! Use me to send native desktop notifications to the user.

IMPORTANT: When you need user input (questions, clarifications, or feedback), use reply=true to let them type a response directly in the notification. This is the fastest way to continue a conversation without switching windows.

Use cases:
- Task complete → simple notification
- Need a decision → actions (Yes/No buttons)
- Need free-form input → reply=true (PREFERRED for questions)`,
  },
);

server.registerTool(
  "send_notification",
  {
    description: `Send a native desktop notification. Use reply=true when you need user input - they can type a response directly! Perfect for asking questions or getting feedback without interrupting their flow.`,
    title: "MCPal Notification",
    inputSchema: {
      message: z.string().describe("The notification body text"),
      title: z.string().optional().describe("The notification title"),
      actions: z
        .array(z.string())
        .optional()
        .describe(
          "Action buttons for choices (e.g., ['Yes', 'No']). Use for simple decisions.",
        ),
      dropdownLabel: z
        .string()
        .optional()
        .describe(
          "Label for actions dropdown (required when using multiple actions)",
        ),
      reply: z
        .boolean()
        .optional()
        .describe(
          "RECOMMENDED: Enable text reply input. Use this when you need free-form user input - they can respond without switching windows!",
        ),
      timeout: z
        .number()
        .optional()
        .describe(
          "Custom timeout in seconds. Defaults: 20s (simple), 30s (actions), 60s (reply)",
        ),
    },
  },
  async ({ message, title, actions, dropdownLabel, reply, timeout }) => {
    try {
      // Get client info to determine which icon to show
      const clientInfo = server.server.getClientVersion();
      const contentImage = getContentImageForClient(clientInfo?.name);

      const result = await notify({
        message,
        title: title ?? "MCPal",
        actions,
        dropdownLabel,
        reply,
        contentImage,
        timeout,
      });

      // Build a friendly response
      const parts: string[] = [];
      parts.push(`Hey! I delivered your message to the user.`);
      parts.push(`Title: "${title ?? "MCPal"}"`);
      parts.push(`Message: "${message}"`);

      // Describe user's response
      if (result.activationType === "contentsClicked") {
        parts.push(`The user clicked the notification.`);
      } else if (result.activationType === "actionClicked") {
        parts.push(`The user clicked: ${result.response}`);
      } else if (result.activationType === "replied") {
        parts.push(`The user replied: "${result.reply}"`);
      } else if (result.response === "timeout") {
        parts.push(`The notification timed out (no response).`);
      } else if (result.response === "closed") {
        parts.push(`The user dismissed the notification.`);
      } else {
        parts.push(`User response: ${result.response}`);
      }

      return {
        content: [{ type: "text", text: parts.join("\n") }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Oops! I couldn't deliver that notification. Error: ${error}`,
          },
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
