import Cocoa
import UserNotifications

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let parsed = Self.parseArgs() else {
            fputs("Usage: notifier --title <title> --message <message>\n", stderr)
            exit(1)
        }

        let center = UNUserNotificationCenter.current()

        // Request permission and send notification
        center.requestAuthorization(options: [.alert, .sound]) { granted, error in
            if let error = error {
                fputs("Authorization error: \(error.localizedDescription)\n", stderr)
                exit(1)
            }

            if !granted {
                fputs("Notification permission denied\n", stderr)
                exit(1)
            }

            // Create notification content
            let content = UNMutableNotificationContent()
            content.title = parsed.title
            content.body = parsed.message
            content.sound = .default

            // Create request with immediate trigger
            let request = UNNotificationRequest(
                identifier: UUID().uuidString,
                content: content,
                trigger: nil  // nil = deliver immediately
            )

            center.add(request) { error in
                if let error = error {
                    fputs("Failed to deliver notification: \(error.localizedDescription)\n", stderr)
                    exit(1)
                }

                // Brief delay to ensure delivery, then exit
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    exit(0)
                }
            }
        }
    }

    static func parseArgs() -> (title: String, message: String)? {
        let args = CommandLine.arguments
        var title: String?
        var message: String?

        var i = 1
        while i < args.count {
            switch args[i] {
            case "--title" where i + 1 < args.count:
                title = args[i + 1]
                i += 2
            case "--message" where i + 1 < args.count:
                message = args[i + 1]
                i += 2
            default:
                i += 1
            }
        }

        guard let t = title, let m = message else {
            return nil
        }
        return (t, m)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
