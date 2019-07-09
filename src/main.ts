require("source-map-support").install();

import { join } from "path";
import { tmpdir } from "os";
import { createWriteStream } from "fs";

import axios from "axios";
import cheerio from "cheerio";
import { createCanvas, Image, PNGStream } from "canvas";
import Masto from "masto";

import { randomInArray } from "./util";

import { MASTODON_SERVER, MASTODON_TOKEN } from "./env";

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
let tmpFileCounter = 0;
async function getImage(url: string): Promise<PNGStream> {
  const resp = await axios.get(url, {
    responseType: "arraybuffer"
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

  return canvas.createPNGStream();
}

async function makeStatus() {
  const { title } = await getWikihow();
  const { image } = await getWikihow();
  const pngStream = await getImage(image);
  return { title, pngStream };
}

// ////////////

async function doToot(): Promise<void> {
  const { title, pngStream } = await makeStatus();

  const masto = await Masto.login({
    uri: MASTODON_SERVER,
    accessToken: MASTODON_TOKEN
  });

  const { id } = await masto.uploadMediaAttachment({
    file: pngStream,
    description: title
  });

  const { created_at: time, uri: tootUri } = await masto.createStatus({
    status: title,
    visibility: "public",
    media_ids: [id]
  });

  console.log(`${time} -> ${tootUri}`);
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  const loopToot = async () => {
    const { title, pngStream } = await makeStatus();

    const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);
    const ws = createWriteStream(filename);
    pngStream.pipe(ws);
    await new Promise<string>((res, rej) => {
      ws.on("finish", res);
      ws.on("error", rej);
    });

    console.log(title, `file://${filename}`);
    setTimeout(loopToot, 1000);
  };
  loopToot();
} else {
  doToot().then(() => process.exit(0));
}
