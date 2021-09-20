require("source-map-support").install();

import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream } from "fs";
import { setTimeout } from "timers/promises";

import { makeStatus } from "./generate";
import { doTwoot } from "./twoot";

import {
  MASTODON_SERVER,
  MASTODON_SERVER_ORIG,
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} from "./env";

export const tmp = tmpdir();
export let tmpFileCounter = 0;

async function main() {
  const { title, titleOrig, canvas } = await makeStatus();

  const buffer = canvas.toBuffer();

  const results = await Promise.allSettled([
    doTwoot(
      [
        {
          status: title,
          media: buffer,
        },
      ],
      [
        { type: "mastodon", server: MASTODON_SERVER, token: MASTODON_TOKEN },
        {
          type: "twitter",
          apiKey: TWITTER_API_KEY,
          apiSecret: TWITTER_API_SECRET,
          accessToken: TWITTER_ACCESS_TOKEN,
          accessSecret: TWITTER_ACCESS_SECRET,
        },
      ]
    ),
    doTwoot(
      [
        {
          status: titleOrig,
          media: buffer,
        },
      ],
      [
        {
          type: "mastodon",
          server: MASTODON_SERVER_ORIG,
          token: MASTODON_TOKEN_ORIG,
        },
      ]
    ),
  ]);

  if (results.some((r) => r.status === "rejected")) {
    throw new Error(
      `Failed to twoot: ${JSON.stringify(results, undefined, 2)}`
    );
  }
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  const createAndSave = async () => {
    const { title, titleOrig, canvas } = await makeStatus();

    const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);
    const ws = createWriteStream(filename);
    canvas.createPNGStream().pipe(ws);
    await new Promise<string>((res, rej) => {
      ws.on("finish", res);
      ws.on("error", rej);
    });

    console.log(`${title}\n${titleOrig}\nfile://${filename}`);
    await setTimeout(1000);
    void createAndSave();
  };
  void createAndSave();
} else {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    });
}
