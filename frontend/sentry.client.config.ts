import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  // Strip wallet addresses from error payloads for privacy
  beforeSend(event) {
    if (event.user?.id) delete event.user.id;

    // Strip any G... Stellar addresses from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(
            /G[A-Z2-7]{55}/g,
            "G***REDACTED***"
          );
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Only report errors in production
  enabled: process.env.NODE_ENV === "production",
});
