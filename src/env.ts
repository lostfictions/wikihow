import * as envalid from "envalid";

const env = envalid.cleanEnv(
  process.env,
  {
    MASTODON_SERVER: envalid.url({ default: "https://mastodon.social" }),
    MASTODON_TOKEN: envalid.str()
  },
  { strict: true }
);

export const { MASTODON_SERVER, MASTODON_TOKEN } = env;
