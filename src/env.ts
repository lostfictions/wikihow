import envalid from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";

export const {
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
  SENTRY_DSN,
  isDev,
} = envalid.cleanEnv(
  process.env,
  {
    MASTODON_TOKEN: envalid.str(),
    MASTODON_TOKEN_ORIG: envalid.str(),
    TWITTER_API_KEY: envalid.str(),
    TWITTER_API_SECRET: envalid.str(),
    TWITTER_ACCESS_TOKEN: envalid.str(),
    TWITTER_ACCESS_SECRET: envalid.str(),
    SENTRY_DSN: envalid.str({ default: "" }),
  },
  { strict: true }
);

/** account to which to toot images with a random caption from a different article. */
export const MASTODON_SERVER = "https://mastodon.social";

/** alternate account to which to toot images with their original caption. */
export const MASTODON_SERVER_ORIG = "https://botsin.space";

if (SENTRY_DSN.length === 0) {
  console.warn(
    `Sentry DSN is invalid! Error reporting to Sentry will be disabled.`
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
