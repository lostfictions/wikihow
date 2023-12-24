/* eslint-disable node/no-process-env */
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import { parseEnv, z } from "znv";

const isDev = process.env["NODE_ENV"] !== "production";

if (isDev) {
  require("dotenv").config();
}

export const {
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
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
  TWITTER_API_KEY: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  TWITTER_API_SECRET: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  TWITTER_ACCESS_TOKEN: {
    schema: z.string().min(1),
    defaults: { development: "_" },
  },
  TWITTER_ACCESS_SECRET: {
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
export const MASTODON_SERVER_ORIG = "https://botsin.space";

if (!SENTRY_DSN && !isDev) {
  console.warn(
    `Sentry DSN is invalid! Error reporting to Sentry will be disabled.`,
  );
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? "dev" : "prod",
    integrations: [
      new CaptureConsole({ levels: ["warn", "error", "debug", "assert"] }),
    ],
  });
}
