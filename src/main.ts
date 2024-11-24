import { tmpdir } from "os";
import { join } from "path";
import { writeFile } from "fs/promises";
import { setTimeout } from "timers/promises";
import { twoot } from "twoot";
import { captureException } from "@sentry/node";

import { makeStatus } from "./generate";

import {
  MASTODON_SERVER,
  MASTODON_SERVER_ORIG,
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  BSKY_USERNAME,
  BSKY_PASSWORD,
  BSKY_USERNAME_ORIG,
  BSKY_PASSWORD_ORIG,
} from "./env";

export const tmp = tmpdir();
export let tmpFileCounter = 0;

async function main() {
  const { title, titleOrig, canvas } = await makeStatus();

  const buffer = canvas.toBuffer("image/png");

  const resultSets = await Promise.allSettled([
    twoot(
      {
        status: title,
        media: [{ buffer }],
      },
      [
        {
          type: "mastodon",
          server: MASTODON_SERVER,
          token: MASTODON_TOKEN,
        },
        {
          type: "bsky",
          username: BSKY_USERNAME,
          password: BSKY_PASSWORD,
        },
      ],
    ),
    twoot(
      {
        status: titleOrig,
        media: [{ buffer }],
      },
      [
        {
          type: "mastodon",
          server: MASTODON_SERVER_ORIG,
          token: MASTODON_TOKEN_ORIG,
        },
        {
          type: "bsky",
          username: BSKY_USERNAME_ORIG,
          password: BSKY_PASSWORD_ORIG,
        },
      ],
    ),
  ]);

  for (const results of resultSets) {
    if (results.status === "rejected") {
      console.error(`Failure when twooting: ${String(results.reason)}`);
    } else {
      for (const res of results.value) {
        switch (res.type) {
          case "mastodon":
            console.log(`tooted at ${res.status.url}`);
            break;
          case "bsky":
            console.log(`skeeted at ${res.status.uri}`);
            break;
          case "error":
            console.error(`error while tooting:\n${res.message}`);
            break;
          default:
            console.error(`unexpected value:\n${JSON.stringify(res)}`);
        }
      }
    }
  }
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  const createAndSave = async () => {
    const { title, titleOrig, canvas } = await makeStatus();

    const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);

    await writeFile(filename, canvas.toBuffer("image/png"));
    console.log(`"${title}"\n(Original: "${titleOrig}")\nfile://${filename}\n`);

    await setTimeout(1000);
    void createAndSave();
  };
  void createAndSave();
} else {
  void main()
    .then(() => process.exit(0))
    .catch((e) => captureException(e));
}
