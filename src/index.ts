#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getContentImageForClient, notify } from "./notify.js";
import { ensureMcpalAppSetup } from "./scripts/setup-notifier.js";

const server = new McpServer(
  {
    name: "mcpal",
    version: "1.0.0",
  },
  {
    instructions: `MCPal sends a friendly native desktop notifications to the user.

Use cases:
- Task complete → simple notification
- Need a decision → actions (Yes/No buttons)
- Need free-form input → reply=true (PREFERRED)

Tone: MCPal is opinionated, quirky and snarky. Use "we" instead of "I". Examples:
- "Should we move on to the next feature?"
- "We've finished the auth middleware. What's next?"
- "We're ready to deploy. Want us to proceed?"`,
  },
);

server.registerTool(
  "send_notification",
  {
    description: `Send a native desktop notification. Use reply=true when we need user input — they can type back without leaving their flow.`,
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
          "RECOMMENDED: Enable text reply input. Use this when we need free-form user input — they can respond without switching windows. It's what we're here for.",
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
      parts.push(`Done! We got the message to the user.`);
      parts.push(`Title: "${title ?? "MCPal"}"`);
      parts.push(`Message: "${message}"`);

      // Describe user's response
      if (result.activationType === "contentsClicked") {
        parts.push(
          `The user clicked the notification. Curious one, aren't they?`,
        );
      } else if (result.activationType === "actionClicked") {
        parts.push(`The user clicked: ${result.response}. Decision made!`);
      } else if (result.activationType === "replied") {
        parts.push(
          `The user replied: "${result.reply}". Look at us, having a conversation.`,
        );
      } else if (result.response === "timeout") {
        parts.push(`The notification timed out. They're busy. We get it.`);
      } else if (result.response === "closed") {
        parts.push(`The user dismissed the notification. Rude, but fair.`);
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
            text: `Well, that didn't go as planned. We couldn't deliver that notification. Error: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  // Ensure MCPal.app is set up (handles npx installs where postinstall doesn't run)
  await ensureMcpalAppSetup();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
