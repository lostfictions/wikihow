require("source-map-support").install();

import { join, extname } from "path";
import { tmpdir } from "os";
import { createWriteStream } from "fs";

import { scheduleJob } from "node-schedule";
import { twoot } from "twoot";
import axios from "axios";
import * as cheerio from "cheerio";

import { randomInArray } from "./util";
import { MASTODON_SERVER, MASTODON_TOKEN, CRON_RULE } from "./env";

const twootConfigs = [
  {
    token: MASTODON_TOKEN,
    server: MASTODON_SERVER
  }
];

async function getWikihow() {
  let retries = 10;
  let title!: string;
  let imgs!: string[];
  async function requestAndParse() {
    const res = await axios.get("https://www.wikihow.com/Special:Randomizer");

    const $ = cheerio.load(res.data);

    const headerList = $("h1");
    if (headerList.length > 1) {
      console.warn(
        `List of <h1> tags has more than one item! Title format might have changed.`
      );
    }

    title = headerList.first().text();

    imgs = $("img.whcdn")
      .toArray()
      .map(img => img.attribs["data-src"])
      .filter(url => url); // only images with this attribute!
  }
  await requestAndParse();

  while ((!title || imgs.length === 0) && retries > 0) {
    console.log(
      `Can't retrieve valid random wikihow page, retrying... (${retries} tries remaining)`
    );
    retries--;
    await requestAndParse();
  }

  if (!title || imgs.length === 0) {
    throw new Error(
      `Unable to retrieve or parse a valid Wikihow page! Last result:\nTitle: "${title}"\nImages: [${imgs
        .map(i => `"${i}"`)
        .join(", ")}]`
    );
  }

  return {
    title,
    image: randomInArray(imgs)
  };
}

const tmp = tmpdir();
let fnCount = 0;
async function saveImage(url: string): Promise<string> {
  const resp = await axios.get(url, { responseType: "stream" });

  const filename = join(tmp, `wikibot_${fnCount++}${extname(url)}`);
  const ws = createWriteStream(filename);
  resp.data.pipe(ws);

  return new Promise<string>((res, rej) => {
    ws.on("finish", () => res(filename));
    ws.on("error", rej);
  });
}

async function makeStatus() {
  const { title } = await getWikihow();
  const { image } = await getWikihow();
  const filename = await saveImage(image);
  return { title, filename };
}

async function doTwoot(): Promise<void> {
  try {
    const { title, filename } = await makeStatus();

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
    makeStatus().then(({ title, filename }) => {
      console.log(`${title}: file://${filename}`);
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
