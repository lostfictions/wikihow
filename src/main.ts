require("source-map-support").install();

import { join } from "path";
import { tmpdir } from "os";
import { createWriteStream, createReadStream } from "fs";

import axios from "axios";
import cheerio from "cheerio";
import { createCanvas, Image, Canvas } from "canvas";
import Masto from "masto";

import { randomInArray } from "./util";
import { getBlacklist } from "./util/blacklist";

import { MASTODON_SERVER, MASTODON_TOKEN } from "./env";

const blacklist = getBlacklist();

async function getWikihow() {
  let retries = 10;
  let title: string | undefined = undefined;
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
      .map((img) => img.attribs["data-src"])
      .filter((url) => url); // only images with this attribute!
  }
  await requestAndParse();

  const hasTitleAndImages = () => title && imgs.length > 0;
  const isNotBlacklistedTitle = () => title && !blacklist.test(title);

  /* eslint-disable no-await-in-loop */
  while (!(hasTitleAndImages() && isNotBlacklistedTitle()) && retries > 0) {
    if (!hasTitleAndImages()) {
      console.warn(
        `Can't retrieve valid random wikihow page, retrying... (${retries} tries remaining)`
      );
      retries--;
      await requestAndParse();
    }

    if (!isNotBlacklistedTitle()) {
      console.warn(
        `Title matches blacklist: '${title}' (${retries} tries remaining)`
      );
      retries--;
      await requestAndParse();
    }
  }
  /* eslint-enable no-await-in-loop */

  if (!title || imgs.length === 0) {
    throw new Error(
      `Unable to retrieve or parse a valid Wikihow page! Last result:\nTitle: "${title}"\nImages: [${imgs
        .map((i) => `"${i}"`)
        .join(", ")}]`
    );
  } else if (title && blacklist.test(title)) {
    throw new Error(
      `Title matches blacklist: '${title}' (and retries expended.)`
    );
  }

  return {
    title,
    image: randomInArray(imgs),
  };
}

const tmp = tmpdir();
let tmpFileCounter = 0;
async function getImage(url: string): Promise<Canvas> {
  const resp = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const image = new Image();
  const imageLoad = new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
  });
  image.src = resp.data;
  await imageLoad;

  // crop the image. 93% height is a rough estimate for getting rid of the
  // watermark.
  const canvas = createCanvas(image.width, image.height * 0.93);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);

  return canvas;
}

async function makeStatus() {
  const { title } = await getWikihow();
  const { image } = await getWikihow();
  const canvas = await getImage(image);
  return { title, canvas };
}

// ////////////

async function doToot(): Promise<void> {
  const { title, canvas } = await makeStatus();

  const masto = await Masto.login({
    uri: MASTODON_SERVER,
    accessToken: MASTODON_TOKEN,
    defaultOptions: {
      timeout: 3 * 60 * 1000,
    },
  });

  // we should be able to use canvas.toBuffer directly, but it seems to not work...
  const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);
  const ws = createWriteStream(filename);
  canvas.createPNGStream().pipe(ws);
  await new Promise<string>((res, rej) => {
    ws.on("finish", res);
    ws.on("error", rej);
  });

  const { id } = await masto.createMediaAttachment({
    file: createReadStream(filename),
    description: title,
  });

  await masto.waitForMediaAttachment(id);

  const { createdAt: time, uri: tootUri } = await masto.createStatus({
    status: title,
    visibility: "public",
    mediaIds: [id],
  });

  console.log(`${time} -> ${tootUri}`);
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  const loopToot = async () => {
    const { title, canvas } = await makeStatus();

    const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);
    const ws = createWriteStream(filename);
    canvas.createPNGStream().pipe(ws);
    await new Promise<string>((res, rej) => {
      ws.on("finish", res);
      ws.on("error", rej);
    });

    console.log(title, `file://${filename}`);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(loopToot, 1000);
  };
  loopToot().catch((e) => {
    throw e;
  });
} else {
  doToot()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    });
}
