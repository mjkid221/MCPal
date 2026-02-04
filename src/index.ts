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
    instructions:
      "MCPal is your friendly notification buddy! Use me to send native desktop notifications to the user. I'll let you know how they responded - whether they clicked, replied, or dismissed the notification.",
  },
);

server.registerTool(
  "send_notification",
  {
    description:
      "Send a native notification with a title and message. Supports action buttons and text reply.",
    title: "MCPal Notification",
    inputSchema: {
      message: z.string().describe("The notification body text"),
      title: z.string().optional().describe("The notification title"),
      actions: z
        .array(z.string())
        .optional()
        .describe("Action buttons to display (e.g., ['Yes', 'No', 'Maybe'])"),
      dropdownLabel: z
        .string()
        .optional()
        .describe(
          "Label for actions dropdown (required when using multiple actions)",
        ),
      reply: z
        .boolean()
        .optional()
        .describe("Enable text reply input in the notification"),
      sound: z
        .union([z.boolean(), z.string()])
        .optional()
        .describe(
          "Play sound: true for default, or one of: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink",
        ),
    },
  },
  async ({ message, title, actions, dropdownLabel, reply, sound }) => {
    try {
      // Get client info to determine which icon to show
      const clientInfo = server.server.getClientVersion();
      const contentImage = getContentImageForClient(clientInfo?.name);

      // Log client info for debugging (helps discover actual client names)
      if (clientInfo) {
        console.error(
          `[MCPal] Client: ${clientInfo.name} v${clientInfo.version}`,
        );
      }

      const result = await notify({
        message,
        title: title ?? "MCPal",
        actions,
        dropdownLabel,
        reply,
        sound,
        contentImage,
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
