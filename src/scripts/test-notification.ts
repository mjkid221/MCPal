#!/usr/bin/env node

/**
 * Test script for MCPal
 *
 * Usage:
 *   pnpm run test:notification [test-type]
 *
 * Test types:
 *   simple   - Basic notification (default)
 *   actions  - Notification with action buttons
 *   reply    - Notification with text reply input
 *   all      - Run all tests sequentially
 */

import { getClientsDir, getContentImageForClient, notify } from "../notify.js";

// For testing, simulate being a Claude client
const testClientName = "claude";
const contentImage = getContentImageForClient(testClientName);

console.log("Clients dir:", getClientsDir());
console.log("Test client:", testClientName);
console.log("Content image:", contentImage ?? "(none)");

const testType = process.argv[2] || "simple";

async function testSimple(): Promise<void> {
  console.log("\n--- Testing: Simple Notification ---");
  const result = await notify({
    title: "Test Notification",
    message: "This is a simple test notification.",
    contentImage,
  });
  console.log("Result:", result);
}

async function testActions(): Promise<void> {
  console.log("\n--- Testing: Notification with Actions ---");
  console.log('Click "Show" to see the dropdown menu.');
  const result = await notify({
    title: "Action Test",
    message: "Choose an option from the dropdown.",
    actions: ["Accept", "Reject", "Later"],
    dropdownLabel: "Choose Action",
    contentImage,
  });
  console.log("Result:", result);
}

async function testReply(): Promise<void> {
  console.log("\n--- Testing: Notification with Reply ---");
  console.log("Type a reply in the text field.");
  const result = await notify({
    title: "Reply Test",
    message: "What would you like to say?",
    reply: true,
    contentImage,
  });
  console.log("Result:", result);
}

async function runTests(): Promise<void> {
  try {
    switch (testType) {
      case "simple":
        await testSimple();
        break;
      case "actions":
        await testActions();
        break;
      case "reply":
        await testReply();
        break;
      case "all":
        await testSimple();
        await testActions();
        await testReply();
        console.log("\n--- All tests complete ---");
        break;
      default:
        console.error(`Unknown test type: ${testType}`);
        console.log("Available: simple, actions, reply, all");
        process.exit(1);
    }
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

console.log("MCPal Test Script");
console.log("============================");
console.log(`Running test: ${testType}`);

runTests();
