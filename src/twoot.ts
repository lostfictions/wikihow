import { createReadStream } from "fs";
import { readFile, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { setTimeout } from "timers/promises";

import { login } from "masto";
import { TwitterClient } from "twitter-api-client";
import retry from "async-retry";
import { nanoid } from "nanoid";

type Status =
  | string
  | {
      status: string;
      pathToMedia: string;
      caption?: string;
      focus?: string;
    }
  | {
      status: string;
      media: Buffer;
      caption?: string;
      focus?: string;
    };

interface MastoAPIConfig {
  type: "mastodon";
  server: string;
  token: string;
}

interface TwitterAPIConfig {
  type: "twitter";
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

type APIConfig = MastoAPIConfig | TwitterAPIConfig;

export async function doTwoot(statuses: Status[], apiConfigs: APIConfig[]) {
  const promises = apiConfigs.map((config) =>
    config.type === "mastodon"
      ? doToot(statuses, config)
      : doTweet(statuses, config)
  );

  const results = (await Promise.allSettled(promises)).map((r, i) => {
    const c = apiConfigs[i];
    return {
      ...r,
      index: i,
      type: c.type,
      server: c.type === "mastodon" ? c.server : undefined,
    };
  });

  if (results.every((r) => r.status === "rejected")) {
    throw new Error(
      `Failed to tweet/toot:\n${results
        .map((r) => {
          if (r.status === "rejected") {
            const { reason } = r as PromiseRejectedResult;
            const message =
              reason instanceof Error
                ? reason.toString()
                : JSON.stringify(reason);

            return `(config ${r.index}: ${r.type}${
              r.server ? ` (${r.server})` : ""
            })\n${message}`;
          }

          return `${r.type}${r.server ? ` (${r.server})` : ""}: ok`;
        })
        .join("\n\n")}`
    );
  }

  const errors = results.filter((r) => r.status === "rejected");
  if (errors.length > 0) {
    console.error(
      `Partially failed to tweet/toot:\n${JSON.stringify(errors, undefined, 2)}`
    );
  }

  return results;
}

export async function doToot(
  statuses: Status[],
  apiConfig: MastoAPIConfig
): Promise<void> {
  const masto = await retry(() =>
    login({
      url: apiConfig.server,
      accessToken: apiConfig.token,
      timeout: 30_000,
    })
  );

  let inReplyToId: string | null | undefined = null;

  let i = 0;

  for (const s of statuses) {
    const { status } = typeof s === "string" ? { status: s } : s;

    let mediaId: string | null = null;
    if (typeof s === "object") {
      // form-data really doesn't like undefined fields, so add them explicitly
      // one-by-one.
      const config: Record<string, any> = {};
      if ("caption" in s) {
        config.caption = s.caption;
      }
      if ("focus" in s) {
        config.focus = s.focus;
      }

      if ("media" in s) {
        // kludge: buffer uploads don't seem to work, so write them to a temp file first.
        const path = join(tmpdir(), `masto-upload-${nanoid()}.png`);
        await writeFile(path, s.media);

        const { id } = await masto.mediaAttachments.create({
          file: createReadStream(path),
          ...config,
        });

        await unlink(path);

        mediaId = id;
      } else {
        const { id } = await masto.mediaAttachments.create({
          file: createReadStream(s.pathToMedia),
          ...config,
        });

        mediaId = id;
      }
    }

    const idempotencyKey = nanoid();

    const publishedToot = await retry(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      () =>
        masto.statuses.create(
          {
            status,
            visibility: "public",
            inReplyToId,
            mediaIds: mediaId ? [mediaId] : undefined,
          },
          idempotencyKey
        ),
      { retries: 5 }
    );

    inReplyToId = publishedToot.id;

    console.log("======\n", status);
    console.log(`${publishedToot.createdAt} -> ${publishedToot.uri}\n======`);

    i++;
    if (i < statuses.length) {
      await setTimeout(3000);
    }
  }
}

export async function doTweet(
  statuses: Status[],
  apiConfig: TwitterAPIConfig
): Promise<void> {
  const twitterClient = new TwitterClient({
    apiKey: apiConfig.apiKey,
    apiSecret: apiConfig.apiSecret,
    accessToken: apiConfig.accessToken,
    accessTokenSecret: apiConfig.accessSecret,
  });

  let inReplyToId: string | undefined = undefined;

  let i = 0;

  for (const s of statuses) {
    const { status } = typeof s === "string" ? { status: s } : s;

    let mediaId: string | undefined = undefined;
    if (typeof s === "object") {
      if ("media" in s) {
        // typings don't seem to let us append the buffer directly
        const { media_id_string } = await twitterClient.media.mediaUpload({
          media_data: s.media.toString("base64"),
        });

        mediaId = media_id_string;
      } else {
        const buf = await readFile(s.pathToMedia);

        const { media_id_string } = await twitterClient.media.mediaUpload({
          media_data: buf.toString("base64"),
        });

        mediaId = media_id_string;
      }
    }

    const publishedTweet = await retry(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      () =>
        twitterClient.tweets.statusesUpdate({
          status,
          in_reply_to_status_id: inReplyToId,
          auto_populate_reply_metadata: true,
          media_ids: mediaId,
        }),
      { retries: 5 }
    );

    inReplyToId = publishedTweet.id_str;

    console.log("======\n", status);
    console.log(
      [
        `${publishedTweet.created_at} -> `,
        `https://twitter.com/${publishedTweet.user.screen_name}/status/${publishedTweet.id_str}\n======`,
      ].join("")
    );

    i++;
    if (i < statuses.length) {
      await setTimeout(3000);
    }
  }
}
