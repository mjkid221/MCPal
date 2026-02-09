import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_ICONS,
  DEFAULT_TIMEOUTS,
  resolveNotificationTimeout,
} from "../src/notify.config";
import { LEGACY_TEXT_FIELDS } from "../src/tool-result.config";

test("timeout resolution maps to configured defaults", () => {
  assert.equal(resolveNotificationTimeout({}), DEFAULT_TIMEOUTS.simple);
  assert.equal(
    resolveNotificationTimeout({ actions: ["Approve"] }),
    DEFAULT_TIMEOUTS.actions,
  );
  assert.equal(resolveNotificationTimeout({ reply: true }), DEFAULT_TIMEOUTS.reply);
  assert.equal(
    resolveNotificationTimeout({ actions: ["Approve"], reply: true }),
    DEFAULT_TIMEOUTS.reply,
  );
  assert.equal(resolveNotificationTimeout({ timeout: 99 }), 99);
});

test("legacy output field order remains stable", () => {
  assert.deepEqual([...LEGACY_TEXT_FIELDS], [
    "status",
    "title",
    "message",
    "response",
    "activationType",
    "reply",
    "error",
    "sanitized",
  ]);
});

test("client icon mapping preserves expected aliases", () => {
  assert.equal(CLIENT_ICONS.claude, "claude.png");
  assert.equal(CLIENT_ICONS["claude-code"], "claude.png");
  assert.equal(CLIENT_ICONS.cursor, "cursor.png");
  assert.equal(CLIENT_ICONS.vscode, "vscode.png");
  assert.equal(CLIENT_ICONS.openai, "openai.png");
  assert.equal(CLIENT_ICONS.chatgpt, "openai.png");
  assert.equal(CLIENT_ICONS.codex, "openai.png");
});
