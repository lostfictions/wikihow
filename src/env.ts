import envalid from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";

export const {
  MASTODON_SERVER,
  MASTODON_SERVER_ORIG,
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  SENTRY_DSN,
  isDev,
} = envalid.cleanEnv(
  process.env,
  {
    MASTODON_SERVER: envalid.url({ default: "https://mastodon.social" }),
    MASTODON_TOKEN: envalid.str(),
    MASTODON_SERVER_ORIG: envalid.url({ default: "https://botsin.space" }),
    MASTODON_TOKEN_ORIG: envalid.str(),
    SENTRY_DSN: envalid.str({ default: "" }),
  },
  { strict: true }
);

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
