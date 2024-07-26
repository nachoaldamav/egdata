import * as Sentry from "@sentry/remix";

Sentry.init({
    dsn: "https://6ca5796e7f66a21fc7c0299e5b273c8a@o4506558481498112.ingest.us.sentry.io/4507667527565312",
    tracesSampleRate: 1,
    autoInstrumentRemix: true
})