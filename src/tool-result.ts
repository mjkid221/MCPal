import { DEFAULT_NOTIFICATION_TITLE } from "./notify.config";
import type { NotifyResult } from "./notify.types";
import { LEGACY_TEXT_FIELDS, SANITIZE_LIMITS } from "./tool-result.config";
import type {
  ErrorPayloadContext,
  SanitizeResult,
  SanitizedSendNotificationInput,
  SendNotificationInput,
  SendNotificationOutput,
} from "./tool-result.types";

// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

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

/**
 * Sanitize tool input values and report whether any field was modified.
 */
export function sanitizeSendNotificationInput(
  input: SendNotificationInput,
): SanitizedSendNotificationInput {
  const titleText = input.title ?? DEFAULT_NOTIFICATION_TITLE;
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

function addSanitizedFlag(
  payload: SendNotificationOutput,
  sanitized: boolean,
): SendNotificationOutput {
  if (!sanitized) {
    return payload;
  }
  return {
    ...payload,
    sanitized: true,
  };
}

/**
 * Build the canonical success payload for `send_notification`.
 */
export function buildSuccessPayload(
  title: string,
  message: string,
  result: NotifyResult,
  sanitized: boolean,
): SendNotificationOutput {
  return addSanitizedFlag(
    {
      status: "sent",
      title,
      message,
      response: result.response,
      activationType: result.activationType,
      reply: result.reply,
    },
    sanitized,
  );
}

/**
 * Build the canonical error payload for `send_notification`.
 */
export function buildErrorPayload(
  error: unknown,
  context: ErrorPayloadContext,
): SendNotificationOutput {
  return addSanitizedFlag(
    {
      status: "error",
      title: context.title,
      message: context.message,
      error: toErrorMessage(error),
    },
    context.sanitized,
  );
}

function encodeLegacyValue(value: string | boolean): string {
  return JSON.stringify(value);
}

/**
 * Format payload as parser-safe legacy line-based text (`key: JSON-string`).
 */
export function formatLegacyText(payload: SendNotificationOutput): string {
  return LEGACY_TEXT_FIELDS.map((key) => [key, payload[key]] as const)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${key}: ${encodeLegacyValue(value as string | boolean)}`,
    )
    .join("\n");
}
