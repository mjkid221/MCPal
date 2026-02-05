# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0](https://github.com/mjkid221/MCPal/compare/v1.2.16...v1.3.0) (2026-02-05)


### Features

* add release-please automation ([d8216e9](https://github.com/mjkid221/MCPal/commit/d8216e91a16162d218358ce51180d61d62ff5a12))

## [1.0.0] - 2025-02-04

### Added

- Initial release of MCPal - your friendly notification buddy for MCP
- Native desktop notifications via MCP protocol
- Cross-platform support:
  - macOS: NotificationCenter with custom app branding (MCPal.app)
  - Linux: notify-send
  - Windows: Windows Toast notifications
- LLM-aware client icons (Claude, Cursor, VS Code, OpenAI) on macOS
- Action buttons support for user decisions
- Text reply input for free-form user responses
- Custom notification sounds
- Smart timeout system:
  - 10 seconds for simple notifications
  - 30 seconds for notifications with action buttons
  - 60 seconds for notifications with text reply
- Automatic postinstall setup for macOS app bundle customization
