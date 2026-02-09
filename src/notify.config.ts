import type { NotifyOptions } from "./notify.types";

/** Default title used when a notification title is not supplied. */
export const DEFAULT_NOTIFICATION_TITLE = "MCPal";

/** Policy defaults for timeout selection by interaction mode (seconds). */
export const DEFAULT_TIMEOUTS = {
  simple: 10,
  actions: 20,
  reply: 30,
} as const;

/** Mapping of normalized MCP client names to icon asset filenames. */
export const CLIENT_ICONS: Record<string, string> = {
  // Anthropic
  claude: "claude.png",
  "claude-desktop": "claude.png",
  "claude-code": "claude.png",
  opus: "claude.png",

  // OpenAI
  openai: "openai.png",
  chatgpt: "openai.png",
  codex: "openai.png",

  // Misc
  cursor: "cursor.png",
  vscode: "vscode.png",
};

type TimeoutSelectionInput = Pick<
  NotifyOptions,
  "timeout" | "reply" | "actions"
>;
type TimeoutKind = keyof typeof DEFAULT_TIMEOUTS;

function getTimeoutKind(options: TimeoutSelectionInput): TimeoutKind {
  if (options.reply) {
    return "reply";
  }
  if (options.actions && options.actions.length > 0) {
    return "actions";
  }
  return "simple";
}

/**
 * Resolve the timeout for a notification using explicit timeout first, then policy defaults.
 */
export function resolveNotificationTimeout(
  options: TimeoutSelectionInput,
): number {
  if (options.timeout !== undefined) {
    return options.timeout;
  }
  return DEFAULT_TIMEOUTS[getTimeoutKind(options)];
}
