require("source-map-support").install();

import { join, extname } from "path";
import { tmpdir } from "os";
import { promises as fs } from "fs";

import { scheduleJob } from "node-schedule";
import { twoot } from "twoot";
import * as got from "got";
import * as cheerio from "cheerio";

import { randomInArray } from "./util";
import { MASTODON_SERVER, MASTODON_TOKEN, CRON_RULE } from "./env";

const twootConfigs = [
  {
    token: MASTODON_TOKEN,
    server: MASTODON_SERVER
  }
];

function getWikihowImage() {
  return got("https://www.wikihow.com/Special:Randomizer").then(res => {
    const $ = cheerio.load(res.body);

    const title = $("h1.firstHeading a").text();

    const imgs = $("img.whcdn")
      .toArray()
      .map(img => img.attribs["data-src"])
      .filter(url => url); // only images with this attribute!

    return {
      title,
      image: randomInArray(imgs)
    };
  });
}

const tmp = tmpdir();
let fnCount = 0;
async function saveLocally(url: string): Promise<string> {
  const img = await got(url, { encoding: null });

  const filename = join(tmp, `wikibot_${fnCount++}${extname(url)}`);
  await fs.writeFile(filename, img.body);

  return filename;
}

async function doTwoot(): Promise<void> {
  try {
    const { title, image } = await getWikihowImage();

    const filename = await saveLocally(image);

    const urls = await twoot(twootConfigs, title, [filename]);
    console.log(
      `[${new Date().toUTCString()}] twooted:\n${urls
        .map(u => "\t -> " + u)
        .join("\n")}`
    );
  } catch (e) {
    console.error(e);
  }
}

if (process.argv.slice(2).includes("local")) {
  const localJob = () =>
    getWikihowImage().then(async ({ title, image }) => {
      console.log(title);
      console.log(image);
      setTimeout(localJob, 5000);
    });

  localJob();
  console.log("Running locally!");
} else {
  // we're running in production mode!
  const job = scheduleJob(CRON_RULE, doTwoot);
  const now = new Date(Date.now()).toUTCString();
  const next = (job.nextInvocation() as any).toDate().toUTCString(); // bad typings
  console.log(`[${now}] Bot is running! Next job scheduled for [${next}]`);
}
