# Change Log

<!-- All notable changes to the "factorio-locale-format-helper" extension will be documented in this file. -->

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## [Unreleased]

## [0.4.3] - 2025-04-11

### Added

- Compare 2 diff files, and the changed key-value pairs will be written to a editing file. [THIS IS A WORKING FEATURE, NOT FINAL VERSION]

## [0.4.2] - 2025-04-07

### Locale

- Added translation for the extension itself. Currently supports `en` and `zh-CN`.

## [0.4.1] - 2025-04-07

### Added

- A signature help will pop up when editing a locale file. By default, it will search all cfg files match the pattern `**/en/*.cfg` in the workspace. Configurable in the future.

## [0.3.0] - 2025-04-05

### Changed

- The structure of the original file will be preserved when updating the keys in the target file, i.e. the comments and empty lines.
- Added a button at the status bar, to choose a source file and update the current editing file.
- Allow to discard existing comments in the target file.

## [0.2.0] - 2025-04-05

### Changed

- Rewrote with TypeScript

## [0.1.0] - 2025-04-04

- Initial release
