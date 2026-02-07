/**
 * Options for sending a native notification.
 */
export interface NotifyOptions {
  /** The notification body text */
  message: string;
  /** The notification title */
  title: string;
  /** Action buttons (e.g., ["Yes", "No"]). macOS only. */
  actions?: string[];
  /** Label for the actions dropdown. Required when using multiple actions on macOS. */
  dropdownLabel?: string;
  /** Enable text reply input. macOS only. */
  reply?: boolean;
  /** Path to an image to display on the right side of the notification. macOS only. */
  contentImage?: string;
  /** Custom timeout in seconds. Defaults: 10s (simple), 30s (actions), 60s (reply). */
  timeout?: number;
}

/**
 * Result returned after a notification is dismissed or interacted with.
 */
export interface NotifyResult {
  /** The response type or action clicked (e.g., "timeout", "closed", action label) */
  response: string;
  /** The user's text reply, if `reply: true` was set and user responded */
  reply?: string;
  /** How the user interacted: "contentsClicked", "actionClicked", "replied", etc. */
  activationType?: string;
}
