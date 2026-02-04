# Publishing MCPal to npm

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm CLI**: Comes with Node.js
3. **2FA enabled** (recommended): npm account settings → Two-Factor Authentication

## One-Time Setup

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

## Publishing Steps

### 1. Verify Package Contents

```bash
# See what will be published
npm pack --dry-run
```

Expected output should show:
- `dist/` - compiled JavaScript
- `dist/assets/` - icons
- `README.md`
- `package.json`

### 2. Build & Typecheck

```bash
pnpm run build
pnpm run typecheck
```

### 3. Publish

```bash
npm publish --access public
```

The `--access public` flag is required for unscoped packages on first publish.

### 4. Verify Publication

```bash
# Check npm listing
npm view mcpal

# Test installation
npm install -g mcpal
```

## Automated Publishing (GitHub Actions)

The repo includes `.github/workflows/publish.yml` which auto-publishes on GitHub releases.

### Setup NPM_TOKEN Secret

1. Go to https://www.npmjs.com/settings/~/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select **Automation** (bypasses 2FA for CI)
4. Copy the token
5. Go to GitHub repo → Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `NPM_TOKEN`, Value: (paste token)

### Create a Release

```bash
# Commit all changes
git add -A
git commit -m "Prepare v1.0.0 release"

# Create and push tag
git tag -a v1.0.0 -m "Initial release"
git push origin main --tags
```

Then on GitHub:
1. Go to repo → Releases → "Create a new release"
2. Choose tag: `v1.0.0`
3. Title: `MCPal v1.0.0`
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

This triggers the workflow → auto-publishes to npm.

## Version Bumping (Future Releases)

```bash
# Patch (1.0.0 → 1.0.1) - bug fixes
npm version patch

# Minor (1.0.0 → 1.1.0) - new features
npm version minor

# Major (1.0.0 → 2.0.0) - breaking changes
npm version major
```

Then push the tag and create a GitHub release.

## Troubleshooting

### "You must be logged in to publish"
```bash
npm login
```

### "Package name already exists"
Check https://www.npmjs.com/package/mcpal - if taken, choose a different name.

### "402 Payment Required"
You're trying to publish a scoped package (`@scope/name`) as private. Use `--access public`.

### Postinstall fails on user's machine
The setup script only runs on macOS. On other platforms, it exits gracefully. If users run `npm install --ignore-scripts`, the macOS customizations won't work - this is documented in README.
