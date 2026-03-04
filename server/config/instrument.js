import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://7bad8ce5caac82744f8bb8cf6600ecba@o4509366715613184.ingest.us.sentry.io/4509387007393792",
  integrations:[
    nodeProfilingIntegration(),
    Sentry.mongoIntegration()
  ],
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
