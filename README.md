# wikihow bot

your source for top hints on how to accomplish anything. a bot that posts to mastodon and bsky.

**https://mastodon.social/@wikihow**

**https://bsky.app/profile/wikihowtips.bsky.social**

~~https://twitter.com/wikihow_tips~~ no longer operational due to twitter's api changes in 2023

> [!TIP]
> see also the alternate versions that post the "proper" captions:
>
> **https://mastodon.social/@wikihow_real**
>
> **https://bsky.app/profile/wikireal.bsky.social**

![how to do anything!](https://i.imgur.com/mGGEvYm.png)

![ANYTHING](https://i.imgur.com/BAtR7zP.png)

this is a bot that generates images and posts them to mastodon ~~and twitter~~ and bsky. it's written in [typescript](https://www.typescriptlang.org/) and runs on [node.js](http://nodejs.org/).

you can run it on your computer and even remix it into something new! you'll need node and git installed. if you install node manually, you should match the node version listed in [the `.node-version`](.node-version) file — but instead of installing node directly i recommend using [fnm](https://github.com/Schniz/fnm), which can automatically handle installing and switching node versions by detecting `.node-version` files.

once you're set, run:

```sh
git clone https://github.com/lostfictions/wikihow
cd wikihow
corepack enable # enables use of the pnpm package manager
pnpm install
pnpm dev
```

running `pnpm dev` will generate an image and save it to a file on your computer. when posting to the internet, this bot runs using github actions' [scheduled events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#scheduled-events). check out the [workflow file](.github/workflows/twoot.yml) for more details.

if you clone the repository you can run your own remixed version that posts to mastodon using github actions too! no need to edit the workflow file — you'll just need to set some environment variables in the github repository settings:

- `MASTODON_TOKEN`: a Mastodon user API token
- `MASTODON_TOKEN_ORIG`: a Mastodon user API token to post to the alternate "original captions" account
- `BSKY_USERNAME`: the bot's username on Bluesky
- `BSKY_PASSWORD`: the app password for the bot's account on Bluesky
- `BSKY_USERNAME`: the username for the alternate "original captions" account on Bluesky
- `BSKY_PASSWORD`: the app password for alternate "original captions" account on Bluesky

additionally, `MASTODON_SERVER` and `MASTODON_SERVER_ORIG` (hardcoded in [src/env.ts](src/env.ts)) control the mastodon instance to which API calls should be made (usually where the bot
user lives.)

this bot uses [dotenv](https://github.com/motdotla/dotenv), so if you're testing things locally, you can stick any of the above environment variables in a file named `.env` in the project root. (it's gitignored, so there's no risk of accidentally committing private API tokens you put in there.)

###### [more bots?](https://github.com/lostfictions?tab=repositories&q=botally)
