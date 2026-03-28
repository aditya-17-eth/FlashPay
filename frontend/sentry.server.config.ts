import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  // Strip wallet addresses from server-side error payloads
  beforeSend(event) {
    if (event.user?.id) delete event.user.id;
    return event;
  },

  enabled: process.env.NODE_ENV === "production",
});
