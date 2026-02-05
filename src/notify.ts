import fs from "fs";
import nodeNotifier from "node-notifier";
import os from "os";
import path from "path";

import { findAllNotifierBaseDirs } from "./notifier-paths";

const isMacOS = os.platform() === "darwin";

const packageRoot = path.resolve(__dirname, "..");

/**
 * Get the path to the MCPal.app (or terminal-notifier.app) executable.
 *
 * Searches multiple locations to handle different installation methods:
 * - Local node_modules (npm/yarn/pnpm)
 * - npx cache (~/.npm/_npx)
 * - pnpm dlx cache (~/Library/Caches/pnpm/dlx)
 *
 * @returns The path to the notifier executable, or undefined if not found
 */
export function getNotifierPath(): string | undefined {
  const notifierDirs = findAllNotifierBaseDirs(packageRoot);
  const possiblePaths: string[] = [];

  // For each directory, check MCPal.app first, then terminal-notifier.app as fallback
  for (const dir of notifierDirs) {
    possiblePaths.push(path.join(dir, "MCPal.app"));
  }
  for (const dir of notifierDirs) {
    possiblePaths.push(path.join(dir, "terminal-notifier.app"));
  }

  for (const p of possiblePaths) {
    const execPath = path.join(p, "Contents", "MacOS", "terminal-notifier");
    if (fs.existsSync(execPath)) {
      return execPath;
    }
  }
  return undefined;
}

/**
 * Mapping of MCP client names to their icon filenames.
 * Keys are normalized client names (lowercase, hyphens instead of spaces).
 */
export const CLIENT_ICONS: Record<string, string> = {
  claude: "claude.png",
  "claude-desktop": "claude.png",
  "claude-code": "claude.png",
  cursor: "cursor.png",
  vscode: "vscode.png",
  openai: "openai.png",
  chatgpt: "openai.png",
};

/**
 * Get the directory containing client icon assets.
 * @returns Absolute path to the clients icon directory
 */
export function getClientsDir(): string {
  return path.resolve(__dirname, "assets", "clients");
}

/**
 * Get the content image path for a given MCP client.
 *
 * The content image appears on the right side of macOS notifications,
 * showing the logo of the LLM client that triggered the notification.
 *
 * @param clientName - The MCP client name (e.g., "claude-code", "cursor")
 * @returns Absolute path to the client's icon, or undefined if not found or not on macOS
 *
 * @example
 * ```ts
 * const icon = getContentImageForClient("claude-code");
 * // Returns: "/path/to/assets/clients/claude.png"
 * ```
 */
export function getContentImageForClient(
  clientName?: string,
): string | undefined {
  // contentImage is a macOS-specific feature (terminal-notifier)
  if (!isMacOS || !clientName) {
    return undefined;
  }

  const normalized = clientName.toLowerCase().replace(/\s+/g, "-");

  // Check for exact match or partial match
  const iconFile =
    CLIENT_ICONS[normalized] ??
    Object.entries(CLIENT_ICONS).find(([key]) => normalized.includes(key))?.[1];

  if (!iconFile) {
    return undefined;
  }

  const iconPath = path.join(getClientsDir(), iconFile);
  return fs.existsSync(iconPath) ? iconPath : undefined;
}

/** Default timeout for simple notifications (seconds) */
const TIMEOUT_SIMPLE = 10;
/** Default timeout for notifications with action buttons (seconds) */
const TIMEOUT_ACTIONS = 30;
/** Default timeout for notifications with text reply input (seconds) */
const TIMEOUT_REPLY = 60;

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

/**
 * Create a notifier instance configured for the current platform.
 *
 * On macOS, uses the custom MCPal.app bundle for branded notifications.
 * On other platforms, uses the default node-notifier backend.
 *
 * @returns A configured NodeNotifier instance
 */
function getNotifier(): nodeNotifier.NodeNotifier {
  if (isMacOS) {
    const customPath = getNotifierPath();
    if (customPath) {
      // Create a NotificationCenter instance with customPath in constructor options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (nodeNotifier as any).NotificationCenter({ customPath });
    }
  }
  // On non-macOS or if customPath not found, use default notifier
  return nodeNotifier;
}

/**
 * Determine the appropriate timeout based on notification type.
 *
 * Reply notifications get the longest timeout (user needs time to type),
 * action notifications get moderate timeout, simple notifications are quick.
 *
 * @param options - The notification options
 * @returns Timeout in seconds
 */
function getTimeout(options: NotifyOptions): number {
  if (options.timeout !== undefined) {
    return options.timeout;
  }
  if (options.reply) {
    return TIMEOUT_REPLY;
  }
  if (options.actions && options.actions.length > 0) {
    return TIMEOUT_ACTIONS;
  }
  return TIMEOUT_SIMPLE;
}

/**
 * Send a native desktop notification and wait for user interaction.
 *
 * @param options - Notification configuration
 * @returns Promise that resolves with the user's response
 * @throws Error if the notification fails to send
 *
 * @example
 * ```ts
 * // Simple notification
 * const result = await notify({
 *   title: "Build Complete",
 *   message: "Your project compiled successfully!"
 * });
 *
 * // With reply input
 * const result = await notify({
 *   title: "Question",
 *   message: "What should we name this file?",
 *   reply: true
 * });
 * console.log(result.reply); // User's typed response
 *
 * // With action buttons
 * const result = await notify({
 *   title: "Deploy",
 *   message: "Ready to deploy to production?",
 *   actions: ["Deploy", "Cancel"],
 *   dropdownLabel: "Choose"
 * });
 * console.log(result.response); // "Deploy" or "Cancel"
 * ```
 */
export function notify(options: NotifyOptions): Promise<NotifyResult> {
  return new Promise((resolve, reject) => {
    const notificationOptions = {
      title: options.title,
      message: options.message,
      wait: true,
      timeout: getTimeout(options),
      actions: options.actions,
      dropdownLabel: options.dropdownLabel,
      reply: options.reply,
      ...(options.contentImage && { contentImage: options.contentImage }),
    };

    getNotifier().notify(notificationOptions, (err, response, metadata) => {
      if (err) {
        return reject(err);
      }
      resolve({
        response: String(response),
        reply: metadata?.activationValue,
        activationType: metadata?.activationType,
      });
    });
  });
}
