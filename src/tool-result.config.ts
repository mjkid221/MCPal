import type { SendNotificationOutput } from "./tool-result.types";

/** Input sanitization limits used before sending notifications or reporting errors. */
export const SANITIZE_LIMITS = {
  title: 256,
  message: 4000,
  maxActions: 3,
  action: 64,
  dropdownLabel: 64,
} as const;

/** Stable field ordering for backward-compatible line-based legacy text output. */
export const LEGACY_TEXT_FIELDS = [
  "status",
  "title",
  "message",
  "response",
  "activationType",
  "reply",
  "error",
  "sanitized",
] as const satisfies ReadonlyArray<keyof SendNotificationOutput>;
