import type { NotifyOptions } from "./notify.types";

export interface SendNotificationOutput {
  [key: string]: unknown;
  status: "sent" | "error";
  title?: string;
  message?: string;
  response?: string;
  activationType?: string;
  reply?: string;
  error?: string;
  sanitized?: boolean;
}

export type SendNotificationInput = Omit<NotifyOptions, "title"> & {
  title?: string;
};

export type SanitizedSendNotificationOptions = Pick<
  NotifyOptions,
  "message" | "title" | "actions" | "dropdownLabel" | "reply" | "timeout"
>;

export interface SanitizedSendNotificationInput {
  options: SanitizedSendNotificationOptions;
  sanitized: boolean;
}

export interface SanitizeResult {
  value: string;
  changed: boolean;
}

export type ErrorPayloadContext = Pick<
  SanitizedSendNotificationOptions,
  "title" | "message"
> & {
  sanitized: boolean;
};
