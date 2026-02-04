import fs from "fs";
import nodeNotifier from "node-notifier";
import os from "os";
import path from "path";

const isMacOS = os.platform() === "darwin";

// Find pnpm paths for node-notifier
function findPnpmPaths(): string[] {
  const projectRoot = path.resolve(__dirname, "..");
  const pnpmDir = path.join(projectRoot, "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(pnpmDir);
    const nodeNotifierDir = entries.find((e) => e.startsWith("node-notifier@"));
    if (nodeNotifierDir) {
      return [
        path.join(
          pnpmDir,
          nodeNotifierDir,
          "node_modules",
          "node-notifier",
          "vendor",
          "mac.noindex",
        ),
      ];
    }
  } catch {
    // Ignore errors
  }
  return [];
}

// Get the path to the renamed MCPal.app notifier executable
export function getNotifierPath(): string | undefined {
  const projectRoot = path.resolve(__dirname, "..");
  const possiblePaths = [
    // pnpm - check for MCPal.app first
    ...findPnpmPaths().map((p) => path.join(p, "MCPal.app")),
    // npm/yarn - check for MCPal.app first
    path.join(
      projectRoot,
      "node_modules",
      "node-notifier",
      "vendor",
      "mac.noindex",
      "MCPal.app",
    ),
    // Fallback to terminal-notifier.app (before rename)
    ...findPnpmPaths().map((p) => path.join(p, "terminal-notifier.app")),
    path.join(
      projectRoot,
      "node_modules",
      "node-notifier",
      "vendor",
      "mac.noindex",
      "terminal-notifier.app",
    ),
  ];

  for (const p of possiblePaths) {
    const execPath = path.join(p, "Contents", "MacOS", "terminal-notifier");
    if (fs.existsSync(execPath)) {
      return execPath;
    }
  }
  return undefined;
}

// Map client names to icon filenames
export const CLIENT_ICONS: Record<string, string> = {
  claude: "claude.png",
  "claude-desktop": "claude.png",
  "claude-code": "claude.png",
  cursor: "cursor.png",
  vscode: "vscode.png",
  openai: "openai.png",
  chatgpt: "openai.png",
};

export function getClientsDir(): string {
  return path.resolve(__dirname, "assets", "clients");
}

export function getContentImageForClient(
  clientName?: string,
): string | undefined {
  // contentImage is a macOS-specific feature (terminal-notifier)
  if (!isMacOS || !clientName) {
    return undefined;
  }

  // Normalize client name (lowercase, no spaces)
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

// Default timeouts (in seconds)
const TIMEOUT_SIMPLE = 20; // Simple notification
const TIMEOUT_ACTIONS = 30; // Notification with action buttons
const TIMEOUT_REPLY = 60; // Notification with text reply input

export interface NotifyOptions {
  message: string;
  title: string;
  actions?: string[];
  dropdownLabel?: string;
  reply?: boolean;
  contentImage?: string;
  timeout?: number; // Custom timeout in seconds (overrides defaults)
}

export interface NotifyResult {
  response: string;
  reply?: string;
  activationType?: string;
}

// Create a notifier instance
// On macOS: uses customPath pointing to our renamed MCPal.app
// On other platforms: uses default node-notifier (Linux: notify-send, Windows: toast)
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

// Determine appropriate timeout based on notification type
function getTimeout(options: NotifyOptions): number {
  if (options.timeout !== undefined) {
    return options.timeout; // User-specified timeout takes precedence
  }
  if (options.reply) {
    return TIMEOUT_REPLY; // Reply needs most time (typing)
  }
  if (options.actions && options.actions.length > 0) {
    return TIMEOUT_ACTIONS; // Actions need moderate time
  }
  return TIMEOUT_SIMPLE; // Simple notifications are quick
}

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
