import { z } from "zod";

import type { SendNotificationOutput } from "./tool-result.types";

/** Runtime validation schema for the `send_notification` structured tool result. */
export const sendNotificationOutputSchema = z.object({
  status: z.enum(["sent", "error"]),
  title: z.string().optional(),
  message: z.string().optional(),
  response: z.string().optional(),
  activationType: z.string().optional(),
  reply: z.string().optional(),
  error: z.string().optional(),
  sanitized: z.boolean().optional(),
});

/**
 * Compile-time guard: runtime schema output must remain assignable to TS output contract.
 */
export type SendNotificationOutputFromSchema = z.infer<
  typeof sendNotificationOutputSchema
>;

export type SendNotificationOutputSchemaCompatible =
  SendNotificationOutputFromSchema extends SendNotificationOutput
    ? true
    : never;
