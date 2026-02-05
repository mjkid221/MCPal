# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.5](https://github.com/mjkid221/MCPal/compare/v1.3.4...v1.3.5) (2026-02-05)


### Bug Fixes

* fix broken readme images ([11d852e](https://github.com/mjkid221/MCPal/commit/11d852edc9ab9d54e4d0e8c2d8236972e03d30de))

## [1.3.4](https://github.com/mjkid221/MCPal/compare/v1.3.3...v1.3.4) (2026-02-05)


### Bug Fixes

* updated readme ([c3f8930](https://github.com/mjkid221/MCPal/commit/c3f8930ffe4e301b44cb9069957738c72f531345))
* updated readme ([f2f8ad8](https://github.com/mjkid221/MCPal/commit/f2f8ad8d5cbb24bb5f10c2f7f18600e6dfe5fce2))

## [1.3.3](https://github.com/mjkid221/MCPal/compare/v1.3.2...v1.3.3) (2026-02-05)


### Bug Fixes

* fix app setup ([4af3caa](https://github.com/mjkid221/MCPal/commit/4af3caabcf002bea6120fbf123113c98edc36513))

## [1.3.2](https://github.com/mjkid221/MCPal/compare/v1.3.1...v1.3.2) (2026-02-05)


### Bug Fixes

* fix app setup ([7752692](https://github.com/mjkid221/MCPal/commit/7752692b9f7cbfd326df9f1468a7515a53de43d6))

## [1.3.1](https://github.com/mjkid221/MCPal/compare/v1.3.0...v1.3.1) (2026-02-05)


### Bug Fixes

* Update to use PAT token for NPM publish ([#20](https://github.com/mjkid221/MCPal/issues/20)) ([b0bb582](https://github.com/mjkid221/MCPal/commit/b0bb582c93b117fb97ea7e4c4a7e530cfa1c1eaf))

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
