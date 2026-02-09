import { z } from "zod";

import type { NotifyResult } from "./notify.types";

export const SANITIZE_LIMITS = {
  title: 256,
  message: 4000,
  maxActions: 3,
  action: 64,
  dropdownLabel: 64,
} as const;

// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

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

export type SendNotificationOutput = z.infer<
  typeof sendNotificationOutputSchema
>;

export interface SendNotificationInput {
  message: string;
  title?: string;
  actions?: string[];
  dropdownLabel?: string;
  reply?: boolean;
  timeout?: number;
}

export interface SanitizedSendNotificationInput {
  options: {
    message: string;
    title: string;
    actions?: string[];
    dropdownLabel?: string;
    reply?: boolean;
    timeout?: number;
  };
  sanitized: boolean;
}

interface SanitizeResult {
  value: string;
  changed: boolean;
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function truncate(value: string, maxLength: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxLength) {
    return value;
  }
  return chars.slice(0, maxLength).join("");
}

function sanitizeText(value: string, maxLength: number): SanitizeResult {
  const normalized = normalizeNewlines(value);
  const withoutUnsafeControls = normalized.replace(UNSAFE_CONTROL_CHARS, "");
  const truncated = truncate(withoutUnsafeControls, maxLength);

  return {
    value: truncated,
    changed: truncated !== value,
  };
}

export function sanitizeSendNotificationInput(
  input: SendNotificationInput,
): SanitizedSendNotificationInput {
  const titleText = input.title ?? "MCPal";
  const sanitizedTitle = sanitizeText(titleText, SANITIZE_LIMITS.title);
  const sanitizedMessage = sanitizeText(input.message, SANITIZE_LIMITS.message);

  let sanitized = false;
  if (input.title !== undefined && sanitizedTitle.changed) {
    sanitized = true;
  }
  if (sanitizedMessage.changed) {
    sanitized = true;
  }

  let actions: string[] | undefined;
  if (input.actions) {
    const limitedActions = input.actions.slice(0, SANITIZE_LIMITS.maxActions);
    if (limitedActions.length !== input.actions.length) {
      sanitized = true;
    }

    const cleanedActions: string[] = [];
    for (const action of limitedActions) {
      const sanitizedAction = sanitizeText(action, SANITIZE_LIMITS.action);
      if (sanitizedAction.changed) {
        sanitized = true;
      }
      if (sanitizedAction.value.length === 0) {
        sanitized = true;
        continue;
      }
      cleanedActions.push(sanitizedAction.value);
    }

    if (cleanedActions.length > 0) {
      actions = cleanedActions;
    } else if (input.actions.length > 0) {
      sanitized = true;
    }
  }

  let dropdownLabel: string | undefined;
  if (input.dropdownLabel !== undefined) {
    const sanitizedDropdownLabel = sanitizeText(
      input.dropdownLabel,
      SANITIZE_LIMITS.dropdownLabel,
    );
    if (sanitizedDropdownLabel.changed) {
      sanitized = true;
    }
    dropdownLabel = sanitizedDropdownLabel.value;
  }

  return {
    options: {
      message: sanitizedMessage.value,
      title: sanitizedTitle.value,
      actions,
      dropdownLabel,
      reply: input.reply,
      timeout: input.timeout,
    },
    sanitized,
  };
}

function toErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return sanitizeText(rawMessage, SANITIZE_LIMITS.message).value;
}

export function buildSuccessPayload(
  title: string,
  message: string,
  result: NotifyResult,
  sanitized: boolean,
): SendNotificationOutput {
  return {
    status: "sent",
    title,
    message,
    response: result.response,
    activationType: result.activationType,
    reply: result.reply,
    sanitized: sanitized || undefined,
  };
}

export function buildErrorPayload(
  error: unknown,
  context: {
    title: string;
    message: string;
    sanitized: boolean;
  },
): SendNotificationOutput {
  return {
    status: "error",
    title: context.title,
    message: context.message,
    error: toErrorMessage(error),
    sanitized: context.sanitized || undefined,
  };
}

function encodeLegacyValue(value: string | boolean): string {
  return JSON.stringify(value);
}

export function formatLegacyText(payload: SendNotificationOutput): string {
  const orderedEntries: Array<[keyof SendNotificationOutput, unknown]> = [
    ["status", payload.status],
    ["title", payload.title],
    ["message", payload.message],
    ["response", payload.response],
    ["activationType", payload.activationType],
    ["reply", payload.reply],
    ["error", payload.error],
    ["sanitized", payload.sanitized],
  ];

  return orderedEntries
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${key}: ${encodeLegacyValue(value as string | boolean)}`,
    )
    .join("\n");
}
