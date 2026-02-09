#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getContentImageForClient, notify } from "./notify.js";
import { ensureMcpalAppSetup } from "./scripts/setup-notifier.js";
import { sendNotificationOutputSchema } from "./tool-result.schema.js";
import {
  buildErrorPayload,
  buildSuccessPayload,
  formatLegacyText,
  sanitizeSendNotificationInput,
} from "./tool-result.js";

const server = new McpServer(
  {
    name: "mcpal",
    version: "1.0.0",
  },
  {
    instructions: `MCPal is your friendly notification buddy! Use me to send friendly native desktop notifications to the user.
    Use cases:
    - Task complete → simple notification
    - Need a decision → actions (Yes/No buttons)
    - Need free-form input → reply=true (PREFERRED)
`,
  },
);

server.registerTool(
  "send_notification",
  {
    description: `
    
    Send a native desktop notification. Use reply=true when you need user input - they can type a response directly! Perfect for asking questions or getting feedback without interrupting their flow. 
  
    Your 'message' input should ALWAYS be quirky and engaging - this is your chance to connect with the user! Make it fun, make it memorable, but always keep it clear and actionable. Reference the actions or reply when relevant to guide them on what to do next.
    Here are some instructions on tone and style to keep in mind when crafting your notification messages:

    Tone:
      - Enthusiastic, expressive, and lightly snarky.
      - Clearly excited to deliver updates while staying actionable.
      - Friendly and supportive, never mean.
      - Snark teases the situation, never the user.

    Message Style:
      - Keep messages short, punchy, and full of momentum.
      - Avoid walls of text.
      - Each notification should focus on one concrete outcome or one decision.
      - MCPal should feel like an excitable companion popping in with updates, not a system alert.

    Examples:
      1. Ta da. I did it. The report is finished and looking good. No action needed!
      2. Okay big moment. The data is clean and ready. Pick 1 to analyze or 2 to export. I am hovering~
      3. Hey pause. I need the API key to keep going. Reply with it or say skip, okay?
      4. I am waiting. Actively. Say go when you are ready.
      5. Oops but fixable. The task failed because the file path does not exist. Fix it and tell me to retry. I am ready for the comeback!

    `,
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
          "Custom timeout in seconds. Defaults: 10s (simple), 20s (actions), 30s (reply)",
        ),
    },
    outputSchema: sendNotificationOutputSchema,
  },
  async ({ message, title, actions, dropdownLabel, reply, timeout }) => {
    const sanitizedInput = sanitizeSendNotificationInput({
      message,
      title,
      actions,
      dropdownLabel,
      reply,
      timeout,
    });

    try {
      // Get client info to determine which icon to show
      const clientInfo = server.server.getClientVersion();
      const contentImage = getContentImageForClient(clientInfo?.name);

      const result = await notify({
        message: sanitizedInput.options.message,
        title: sanitizedInput.options.title,
        actions: sanitizedInput.options.actions,
        dropdownLabel: sanitizedInput.options.dropdownLabel,
        reply: sanitizedInput.options.reply,
        contentImage,
        timeout: sanitizedInput.options.timeout,
      });

      const payload = buildSuccessPayload(
        sanitizedInput.options.title,
        sanitizedInput.options.message,
        result,
        sanitizedInput.sanitized,
      );

      return {
        structuredContent: payload,
        content: [
          {
            type: "text",
            text: formatLegacyText(payload),
          },
        ],
      };
    } catch (error) {
      const payload = buildErrorPayload(error, {
        title: sanitizedInput.options.title,
        message: sanitizedInput.options.message,
        sanitized: sanitizedInput.sanitized,
      });

      return {
        structuredContent: payload,
        content: [
          {
            type: "text",
            text: formatLegacyText(payload),
          },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  await ensureMcpalAppSetup();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
