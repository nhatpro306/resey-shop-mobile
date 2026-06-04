import * as Sentry from "@sentry/react-native";
import { env } from "@/config/env";

// Crash + error reporting. No-ops until EXPO_PUBLIC_SENTRY_DSN is set, so this is
// safe in dev and in builds without a DSN.
export function initSentry(): void {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: 0.2,
    // Scrub PII before sending — never ship user emails/IPs to telemetry.
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export function captureException(error: unknown): void {
  if (!env.sentryDsn) return;
  Sentry.captureException(error);
}
