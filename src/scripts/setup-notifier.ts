#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";

// Get the package root (where src/assets lives)
const packageRoot = path.resolve(__dirname, "..", "..");

/**
 * Find all potential locations where node-notifier's terminal-notifier.app might be located.
 * Searches both local node_modules and npx cache directories.
 */
function findAllTerminalNotifierPaths(): string[] {
  const paths: string[] = [];

  // 1. Local node_modules (npm/yarn)
  paths.push(
    path.join(
      packageRoot,
      "node_modules",
      "node-notifier",
      "vendor",
      "mac.noindex",
      "terminal-notifier.app",
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
        paths.push(
          path.join(
            localPnpmDir,
            nodeNotifierDir,
            "node_modules",
            "node-notifier",
            "vendor",
            "mac.noindex",
            "terminal-notifier.app",
          ),
        );
      }
    } catch {
      // Ignore errors
    }
  }

  // 3. npx cache locations
  const npxCacheDirs = [
    // npm npx cache
    path.join(os.homedir(), ".npm", "_npx"),
    // pnpm dlx cache
    path.join(os.homedir(), "Library", "Caches", "pnpm", "dlx"),
  ];

  for (const cacheDir of npxCacheDirs) {
    if (!fs.existsSync(cacheDir)) {
      continue;
    }

    try {
      // Search recursively for node-notifier in cache
      const cacheEntries = fs.readdirSync(cacheDir);
      for (const entry of cacheEntries) {
        const entryPath = path.join(cacheDir, entry);

        // Check for node-notifier in standard npm structure
        const npmPath = path.join(
          entryPath,
          "node_modules",
          "node-notifier",
          "vendor",
          "mac.noindex",
          "terminal-notifier.app",
        );
        if (fs.existsSync(npmPath)) {
          paths.push(npmPath);
        }

        // Check for node-notifier in mcpal's node_modules (npx installs mcpal which has node-notifier as dep)
        const mcpalPath = path.join(
          entryPath,
          "node_modules",
          "mcpal",
          "node_modules",
          "node-notifier",
          "vendor",
          "mac.noindex",
          "terminal-notifier.app",
        );
        if (fs.existsSync(mcpalPath)) {
          paths.push(mcpalPath);
        }

        // Check pnpm structure in cache
        const pnpmDir = path.join(entryPath, "node_modules", ".pnpm");
        if (fs.existsSync(pnpmDir)) {
          try {
            const pnpmEntries = fs.readdirSync(pnpmDir);
            const nodeNotifierDir = pnpmEntries.find((e) =>
              e.startsWith("node-notifier@"),
            );
            if (nodeNotifierDir) {
              paths.push(
                path.join(
                  pnpmDir,
                  nodeNotifierDir,
                  "node_modules",
                  "node-notifier",
                  "vendor",
                  "mac.noindex",
                  "terminal-notifier.app",
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

  return paths;
}

/**
 * Find the first existing terminal-notifier.app or MCPal.app
 */
function findNotifierApp(): { path: string; isRenamed: boolean } | null {
  const searchPaths = findAllTerminalNotifierPaths();

  for (const appPath of searchPaths) {
    // Check if already renamed to MCPal.app
    const mcpalPath = path.join(path.dirname(appPath), "MCPal.app");
    if (fs.existsSync(mcpalPath)) {
      return { path: mcpalPath, isRenamed: true };
    }

    // Check if terminal-notifier.app exists
    if (fs.existsSync(appPath)) {
      return { path: appPath, isRenamed: false };
    }
  }

  return null;
}

/**
 * Find the icon source file. Checks multiple locations since the package
 * structure differs between development and installed contexts.
 */
function findIconSource(): string | null {
  const possiblePaths = [
    // Development: src/assets/mcpal.icns
    path.join(packageRoot, "src", "assets", "mcpal.icns"),
    // Built/installed: dist/assets/mcpal.icns
    path.join(packageRoot, "dist", "assets", "mcpal.icns"),
    // Relative to this script in dist
    path.join(__dirname, "..", "assets", "mcpal.icns"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Ensure MCPal.app is set up correctly for macOS notifications.
 * This function can be called at runtime (not just postinstall).
 */
export async function ensureMcpalAppSetup(): Promise<void> {
  // Only run on macOS
  if (process.platform !== "darwin") {
    return;
  }

  const notifierApp = findNotifierApp();

  if (!notifierApp) {
    console.error("[MCPal] terminal-notifier.app not found, skipping setup");
    return;
  }

  // If already renamed and configured, we're done
  if (notifierApp.isRenamed) {
    return;
  }

  const icnsSource = findIconSource();
  if (!icnsSource) {
    console.error("[MCPal] Icon file not found, skipping setup");
    return;
  }

  try {
    const terminalNotifierApp = notifierApp.path;
    const parentDir = path.dirname(terminalNotifierApp);
    const mcpalApp = path.join(parentDir, "MCPal.app");

    // Rename to MCPal.app
    fs.renameSync(terminalNotifierApp, mcpalApp);
    console.error("[MCPal] Renamed app bundle to MCPal.app");

    const resourcesDir = path.join(mcpalApp, "Contents", "Resources");
    const infoPlist = path.join(mcpalApp, "Contents", "Info.plist");

    // Copy the new icon
    const icnsDest = path.join(resourcesDir, "mcpal.icns");
    fs.copyFileSync(icnsSource, icnsDest);

    // Update Info.plist
    let plistContent = fs.readFileSync(infoPlist, "utf8");

    // Replace icon reference
    plistContent = plistContent.replace(
      /<key>CFBundleIconFile<\/key>\s*<string>[^<]+<\/string>/,
      "<key>CFBundleIconFile</key>\n\t<string>mcpal</string>",
    );

    // Update bundle identifier
    plistContent = plistContent.replace(
      /<key>CFBundleIdentifier<\/key>\s*<string>[^<]+<\/string>/,
      "<key>CFBundleIdentifier</key>\n\t<string>com.mcpal</string>",
    );

    // Update bundle name (shown in System Preferences > Notifications)
    plistContent = plistContent.replace(
      /<key>CFBundleName<\/key>\s*<string>[^<]+<\/string>/,
      "<key>CFBundleName</key>\n\t<string>MCPal</string>",
    );

    fs.writeFileSync(infoPlist, plistContent);
    console.error("[MCPal] macOS notification setup complete!");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCPal] Failed to setup notification icon:", message);
    // Don't throw - notification will still work, just with default branding
  }
}

// Run directly if called as a script (postinstall)
if (require.main === module) {
  ensureMcpalAppSetup()
    .then(() => process.exit(0))
    .catch(() => process.exit(0)); // Don't fail install
}
