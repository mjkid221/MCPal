import fs from "fs";
import os from "os";
import path from "path";

/**
 * Find all potential mac.noindex directories containing terminal-notifier.app or MCPal.app.
 *
 * Searches multiple locations to handle different installation methods:
 * - Local node_modules (npm/yarn/pnpm)
 * - npx cache (~/.npm/_npx)
 * - pnpm dlx cache (~/Library/Caches/pnpm/dlx)
 *
 * @param packageRoot - The root directory of the package (where node_modules lives)
 * @returns Array of directory paths ending at `mac.noindex/`
 */
export function findAllNotifierBaseDirs(packageRoot: string): string[] {
  const dirs: string[] = [];

  // 0. Use Node's module resolution (handles hoisting, pnpm symlinks, etc.)
  try {
    const nodeNotifierPkg = require.resolve("node-notifier/package.json");
    const nodeNotifierRoot = path.dirname(nodeNotifierPkg);
    dirs.push(path.join(nodeNotifierRoot, "vendor", "mac.noindex"));
  } catch {
    // node-notifier not resolvable from this context
  }

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
        );
        if (fs.existsSync(npmPath)) {
          dirs.push(npmPath);
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
        );
        if (fs.existsSync(mcpalPath)) {
          dirs.push(mcpalPath);
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
