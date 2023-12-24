import axios from "axios";
import { load } from "cheerio";
import { createCanvas, Image, Canvas } from "@napi-rs/canvas";
import { randomInArray } from "./util";
import { getBlacklist } from "./util/blacklist";

const blacklist = getBlacklist();

async function getWikihow(): Promise<{ title: string; image: string }> {
  let retries = 10;
  let title: string | undefined = undefined;
  let imgs!: string[];

  async function requestAndParse() {
    const res = await axios.get("https://www.wikihow.com/Special:Randomizer", {
      responseType: "text",
    });

    const $ = load(res.data);

    const headerList = $("h1");
    if (headerList.length > 1) {
      console.warn(
        `List of <h1> tags has more than one item! Title format might have changed.`,
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

  while (!(hasTitleAndImages() && isNotBlacklistedTitle()) && retries > 0) {
    if (!hasTitleAndImages()) {
      console.log(
        `Can't retrieve valid random wikihow page, retrying... (${retries} tries remaining)`,
      );
      retries--;
      await requestAndParse();
    }

    if (!isNotBlacklistedTitle()) {
      console.log(
        `Title matches blacklist: '${title}' (${retries} tries remaining)`,
      );
      retries--;
      await requestAndParse();
    }
  }

  if (!title || imgs.length === 0) {
    throw new Error(
      `Unable to retrieve or parse a valid Wikihow page! Last result:\nTitle: "${title}"\nImages: [${imgs
        .map((i) => `"${i}"`)
        .join(", ")}]`,
    );
  } else if (title && blacklist.test(title)) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- false positive, i think
      `Title matches blacklist: '${title}' (and retries expended.)`,
    );
  }

  return {
    title,
    image: randomInArray(imgs),
  };
}

async function getImage(url: string): Promise<Canvas> {
  const resp = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const image = new Image();
  const imageLoad = new Promise<void>((res, rej) => {
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

export async function makeStatus() {
  const { title } = await getWikihow();
  const { title: titleOrig, image } = await getWikihow();
  const canvas = await getImage(image);
  return { title, titleOrig, canvas };
}
