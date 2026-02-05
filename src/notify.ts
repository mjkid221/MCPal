import fs from "fs";
import nodeNotifier from "node-notifier";
import os from "os";
import path from "path";

const isMacOS = os.platform() === "darwin";

// Get the package root directory
const packageRoot = path.resolve(__dirname, "..");

/**
 * Find all potential mac.noindex directories containing terminal-notifier.app or MCPal.app.
 * Searches local node_modules and npx cache directories.
 */
function findAllNotifierDirs(): string[] {
  const dirs: string[] = [];

  // 1. Local node_modules (npm/yarn)
  dirs.push(
    path.join(
      packageRoot,
      "node_modules",
      "node-notifier",
      "vendor",
      "mac.noindex",
    ),
  );

  // 2. Local node_modules (pnpm)
  const localPnpmDir = path.join(packageRoot, "node_modules", ".pnpm");
  if (fs.existsSync(localPnpmDir)) {
    try {
      const entries = fs.readdirSync(localPnpmDir);
      const nodeNotifierDir = entries.find((e) =>
        e.startsWith("node-notifier@"),
      );
      if (nodeNotifierDir) {
        dirs.push(
          path.join(
            localPnpmDir,
            nodeNotifierDir,
            "node_modules",
            "node-notifier",
            "vendor",
            "mac.noindex",
          ),
        );
      }
    } catch {
      // Ignore errors
    }
  }

  // 3. npx cache locations
  const npxCacheDirs = [
    path.join(os.homedir(), ".npm", "_npx"),
    path.join(os.homedir(), "Library", "Caches", "pnpm", "dlx"),
  ];

  for (const cacheDir of npxCacheDirs) {
    if (!fs.existsSync(cacheDir)) {
      continue;
    }

    try {
      const cacheEntries = fs.readdirSync(cacheDir);
      for (const entry of cacheEntries) {
        const entryPath = path.join(cacheDir, entry);

        // npm structure: node_modules/node-notifier/vendor/mac.noindex
        const npmPath = path.join(
          entryPath,
          "node_modules",
          "node-notifier",
          "vendor",
          "mac.noindex",
        );
        if (fs.existsSync(npmPath)) {
          dirs.push(npmPath);
        }

        // mcpal's node_modules in npx cache
        const mcpalPath = path.join(
          entryPath,
          "node_modules",
          "mcpal",
          "node_modules",
          "node-notifier",
          "vendor",
          "mac.noindex",
        );
        if (fs.existsSync(mcpalPath)) {
          dirs.push(mcpalPath);
        }

        // pnpm structure in cache
        const pnpmDir = path.join(entryPath, "node_modules", ".pnpm");
        if (fs.existsSync(pnpmDir)) {
          try {
            const pnpmEntries = fs.readdirSync(pnpmDir);
            const nodeNotifierDir = pnpmEntries.find((e) =>
              e.startsWith("node-notifier@"),
            );
            if (nodeNotifierDir) {
              dirs.push(
                path.join(
                  pnpmDir,
                  nodeNotifierDir,
                  "node_modules",
                  "node-notifier",
                  "vendor",
                  "mac.noindex",
                ),
              );
            }
          } catch {
            // Ignore errors
          }
        }
      }
    } catch {
      // Ignore errors reading cache directories
    }
  }

  return dirs;
}

// Get the path to the renamed MCPal.app notifier executable
export function getNotifierPath(): string | undefined {
  const notifierDirs = findAllNotifierDirs();
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
