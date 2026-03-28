import * as Sentry from "@sentry/nextjs";

export function captureException(error: unknown) {
  Sentry.captureException(error);
}
