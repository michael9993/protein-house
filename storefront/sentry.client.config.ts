import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Only send errors in production
	enabled: process.env.NODE_ENV === "production",

	// Performance: sample 10% of transactions in production
	tracesSampleRate: 0.1,

	// Session Replay: capture 5% of sessions, 100% on error
	replaysSessionSampleRate: 0.05,
	replaysOnErrorSampleRate: 1.0,

	integrations: [Sentry.replayIntegration()],

	// Environment tag
	environment: process.env.NODE_ENV,
});
