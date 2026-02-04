import fs from "fs";
import nodeNotifier from "node-notifier";
import path from "path";

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
  if (!clientName) {
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

export interface NotifyOptions {
  message: string;
  title: string;
  actions?: string[];
  dropdownLabel?: string;
  reply?: boolean;
  sound?: boolean | string;
  contentImage?: string;
}

export interface NotifyResult {
  response: string;
  reply?: string;
  activationType?: string;
}

// Create a notifier instance with customPath pointing to our renamed MCPal.app
function getNotifier(): nodeNotifier.NodeNotifier {
  const customPath = getNotifierPath();
  if (customPath) {
    // Create a NotificationCenter instance with customPath in constructor options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (nodeNotifier as any).NotificationCenter({ customPath });
  }
  return nodeNotifier;
}

export function notify(options: NotifyOptions): Promise<NotifyResult> {
  return new Promise((resolve, reject) => {
    const notificationOptions = {
      title: options.title,
      message: options.message,
      wait: true,
      timeout: 20,
      actions: options.actions,
      dropdownLabel: options.dropdownLabel,
      reply: options.reply,
      sound: options.sound,
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
