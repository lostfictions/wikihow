/* eslint-disable node/no-process-env */
import * as Sentry from "@sentry/node";
import { parseEnv, z } from "znv";

const isDev = process.env["NODE_ENV"] !== "production";

if (isDev) {
  require("dotenv").config();
}

export const {
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  BSKY_USERNAME,
  BSKY_PASSWORD,
  BSKY_USERNAME_ORIG,
  BSKY_PASSWORD_ORIG,
  SENTRY_DSN,
} = parseEnv(process.env, {
  MASTODON_TOKEN: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  MASTODON_TOKEN_ORIG: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  BSKY_USERNAME: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  BSKY_PASSWORD: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  BSKY_USERNAME_ORIG: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  BSKY_PASSWORD_ORIG: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  SENTRY_DSN: {
    schema: z.string().min(1).optional(),
  },
});

/** account to which to toot images with a random caption from a different article. */
export const MASTODON_SERVER = "https://mastodon.social";

/** alternate account to which to toot images with their original caption. */
export const MASTODON_SERVER_ORIG = "https://mastodon.social";

if (!SENTRY_DSN && !isDev) {
  console.warn(
    `Sentry DSN is invalid! Error reporting to Sentry will be disabled.`,
  );
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? "dev" : "prod",
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ["warn", "error", "debug", "assert"],
      }),
    ],
  });
}
