#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

BUNDLE_DIR="$PROJECT_DIR/bin/Notifier.app/Contents"
SWIFT_SRC="$PROJECT_DIR/swift/notifier.swift"
PLIST_SRC="$PROJECT_DIR/swift/Info.plist"
ICON_SRC="$PROJECT_DIR/swift/AppIcon.icns"

# Check for Swift compiler
if ! command -v swiftc &> /dev/null; then
    echo "Error: swiftc not found. Install Xcode or Xcode Command Line Tools." >&2
    exit 1
fi

echo "Creating bundle structure..."
mkdir -p "$BUNDLE_DIR/MacOS"
mkdir -p "$BUNDLE_DIR/Resources"

# Remove stale code signature if it exists
if [ -d "$BUNDLE_DIR/_CodeSignature" ]; then
    echo "Removing stale code signature..."
    rm -rf "$BUNDLE_DIR/_CodeSignature"
fi

echo "Compiling Swift binary..."
swiftc -O "$SWIFT_SRC" -o "$BUNDLE_DIR/MacOS/notifier"
chmod +x "$BUNDLE_DIR/MacOS/notifier"

echo "Copying Info.plist..."
cp "$PLIST_SRC" "$BUNDLE_DIR/Info.plist"

if [ -f "$ICON_SRC" ]; then
    echo "Copying custom icon..."
    cp "$ICON_SRC" "$BUNDLE_DIR/Resources/AppIcon.icns"
fi

echo "Signing app bundle..."
codesign --force --deep --sign - "$PROJECT_DIR/bin/Notifier.app"

echo "Build complete: bin/Notifier.app"
