import assert from "node:assert/strict";
import test from "node:test";

import {
  SANITIZE_LIMITS,
  buildErrorPayload,
  buildSuccessPayload,
  formatLegacyText,
  sanitizeSendNotificationInput,
  sendNotificationOutputSchema,
} from "../src/tool-result";

test("legacy text escapes multiline payload values on single lines", () => {
  const payload = buildSuccessPayload(
    "Title",
    "first line\nsecond line",
    {
      response: "timeout",
      activationType: "replied",
      reply: "user\nresponse",
    },
    false,
  );

  const formatted = formatLegacyText(payload);
  const lines = formatted.split("\n");

  assert.equal(lines[0], 'status: "sent"');
  assert.equal(lines[1], 'title: "Title"');
  assert.equal(lines[2], 'message: "first line\\nsecond line"');
  assert.equal(lines[3], 'response: "timeout"');
  assert.equal(lines[4], 'activationType: "replied"');
  assert.equal(lines[5], 'reply: "user\\nresponse"');
  assert.equal(lines.length, 6);
});

test("legacy text keeps colons, quotes, and backslashes parse-safe", () => {
  const payload = buildSuccessPayload(
    "a:b",
    'path: "C:\\temp\\folder"',
    { response: "closed" },
    false,
  );
  const formatted = formatLegacyText(payload);

  assert.match(formatted, /^status: "sent"/);
  assert.match(formatted, /title: "a:b"/);
  assert.match(formatted, /message: "path: \\"C:\\\\temp\\\\folder\\""/);
});

test("sanitizer normalizes newlines and strips unsafe control characters", () => {
  const sanitized = sanitizeSendNotificationInput({
    title: "my\rtitle\u0000",
    message: "one\r\ntwo\rthree\u0007",
  });

  assert.equal(sanitized.options.title, "my\ntitle");
  assert.equal(sanitized.options.message, "one\ntwo\nthree");
  assert.equal(sanitized.sanitized, true);
});

test("sanitizer truncates long fields and caps action options", () => {
  const sanitized = sanitizeSendNotificationInput({
    title: "t".repeat(SANITIZE_LIMITS.title + 50),
    message: "m".repeat(SANITIZE_LIMITS.message + 50),
    actions: [
      "a".repeat(SANITIZE_LIMITS.action + 5),
      "b",
      "c",
      "d",
      "\u0000",
    ],
    dropdownLabel: "d".repeat(SANITIZE_LIMITS.dropdownLabel + 50),
  });

  assert.equal(Array.from(sanitized.options.title).length, SANITIZE_LIMITS.title);
  assert.equal(
    Array.from(sanitized.options.message).length,
    SANITIZE_LIMITS.message,
  );
  assert.equal(sanitized.options.actions?.length, SANITIZE_LIMITS.maxActions);
  assert.equal(
    Array.from((sanitized.options.actions ?? [])[0]).length,
    SANITIZE_LIMITS.action,
  );
  assert.equal(
    Array.from(sanitized.options.dropdownLabel ?? "").length,
    SANITIZE_LIMITS.dropdownLabel,
  );
  assert.equal(sanitized.sanitized, true);
});

test("error payload remains parse-safe with multiline error messages", () => {
  const payload = buildErrorPayload(new Error('bad\n"thing"'), {
    title: "MCPal",
    message: "attempted message",
    sanitized: false,
  });
  const formatted = formatLegacyText(payload);

  assert.equal(payload.status, "error");
  assert.equal(payload.error, 'bad\n"thing"');
  assert.match(formatted, /^status: "error"/);
  assert.match(formatted, /error: "bad\\n\\"thing\\""/);
});

test("structured payload validates against output schema", () => {
  const successPayload = buildSuccessPayload(
    "MCPal",
    "hello",
    { response: "timeout" },
    true,
  );
  const errorPayload = buildErrorPayload(new Error("boom"), {
    title: "MCPal",
    message: "hello",
    sanitized: true,
  });

  assert.equal(sendNotificationOutputSchema.safeParse(successPayload).success, true);
  assert.equal(sendNotificationOutputSchema.safeParse(errorPayload).success, true);
});
