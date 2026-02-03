/* eslint-disable no-undef */
ObjC.import("stdlib");

const app = Application.currentApplication();
app.includeStandardAdditions = true;

const message = $.getenv("NOTIFY_MESSAGE") || "Default message";
const title = $.getenv("NOTIFY_TITLE") || "Notification";

app.displayNotification(message, {
  withTitle: title,
});
