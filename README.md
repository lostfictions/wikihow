# wikihow bot

your source for top hints on how to accomplish anything.

![how to do anything!](https://i.imgur.com/mGGEvYm.png)

![ANYTHING](https://i.imgur.com/BAtR7zP.png)

dockerized. will regularly ~~~tweet and~~~ toot advice on how to do things.

_(twitter support probably won't be added due to twitter's changes in process
for acquiring developer/api access.)_


- `MASTODON_TOKEN`: a Mastodon user API token
- `MASTODON_SERVER`: the instance to which API calls should be made (usually
  where the bot user lives.) (default: https://mastodon.social)
- `CRON_RULE`: a crontab-format string defining the frequency or intervals at
  which the bot should post. (default: every four hours)

the wikihow bot uses the [envalid](https://github.com/af/envalid) package which
in turn wraps [dotenv](https://github.com/motdotla/dotenv), so you can
alternately stick any of the above environment variables in a file named `.env`
in the project root. (it's gitignored, so there's no risk of accidentally
committing private API tokens you put in there.)

this bot is written in typescript, and the dockerfile will compile to js as part
of its setup. run `yarn dev` if you're hacking on things and want to re-run
local generation in the console on updates.

###### [more bots?](https://github.com/lostfictions?tab=repositories&q=botally)
