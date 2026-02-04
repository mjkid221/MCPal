#!/usr/bin/env node

import fs from "fs";
import path from "path";

// Only run on macOS
if (process.platform !== "darwin") {
  console.log("Skipping macOS-specific notification icon setup");
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, "..", "..");
const icnsSource = path.join(projectRoot, "src", "assets", "mcpal.icns");

function findPnpmPaths(): string[] {
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
          "terminal-notifier.app",
        ),
      ];
    }
  } catch {
    // Ignore errors
  }
  return [];
}

function findTerminalNotifier(): string | null {
  const possiblePaths = [
    // npm/yarn
    path.join(
      projectRoot,
      "node_modules",
      "node-notifier",
      "vendor",
      "mac.noindex",
      "terminal-notifier.app",
    ),
    // pnpm (search in .pnpm)
    ...findPnpmPaths(),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const terminalNotifierApp = findTerminalNotifier();

if (!terminalNotifierApp) {
  console.log("terminal-notifier.app not found, skipping icon setup");
  process.exit(0);
}

// Rename to MCPal.app for proper macOS registration
const parentDir = path.dirname(terminalNotifierApp);
const mcpalApp = path.join(parentDir, "MCPal.app");

if (!fs.existsSync(mcpalApp)) {
  fs.renameSync(terminalNotifierApp, mcpalApp);
  console.log("Renamed app bundle to MCPal.app");
}

const resourcesDir = path.join(mcpalApp, "Contents", "Resources");
const infoPlist = path.join(mcpalApp, "Contents", "Info.plist");

// Check if source icon exists
if (!fs.existsSync(icnsSource)) {
  console.log("Icon file not found:", icnsSource);
  process.exit(0);
}

try {
  // Copy the new icon
  const icnsDest = path.join(resourcesDir, "mcpal.icns");
  fs.copyFileSync(icnsSource, icnsDest);
  console.log("Copied icon to:", icnsDest);

  // Update Info.plist to use the new icon
  let plistContent = fs.readFileSync(infoPlist, "utf8");

  // Replace icon reference (Terminal.icns -> mcpal.icns)
  plistContent = plistContent.replace(
    /<key>CFBundleIconFile<\/key>\s*<string>[^<]+<\/string>/,
    "<key>CFBundleIconFile</key>\n\t<string>mcpal</string>",
  );

  // Optionally update bundle identifier to avoid conflicts
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
  console.log("Updated Info.plist");

  console.log("macOS notification icon setup complete!");
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Failed to setup notification icon:", message);
  // Don't fail the install
  process.exit(0);
}
