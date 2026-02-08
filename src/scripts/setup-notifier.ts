#!/usr/bin/env node

import fs from "fs";
import path from "path";

import { findAllNotifierBaseDirs } from "../notifier-paths";

// Get the package root (where src/assets lives)
const packageRoot = path.resolve(__dirname, "..", "..");

/**
 * Find all potential locations where node-notifier's terminal-notifier.app might be located.
 * Uses shared discovery logic and appends terminal-notifier.app to each base directory.
 */
function findAllTerminalNotifierPaths(): string[] {
  return findAllNotifierBaseDirs(packageRoot).map((dir) =>
    path.join(dir, "terminal-notifier.app"),
  );
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
    // Development: src/assets/icons/mcpal.icns
    path.join(packageRoot, "src", "assets", "icons", "mcpal.icns"),
    // Built/installed: dist/assets/icons/mcpal.icns
    path.join(packageRoot, "dist", "assets", "icons", "mcpal.icns"),
    // Relative to this script in dist
    path.join(__dirname, "..", "assets", "icons", "mcpal.icns"),
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
