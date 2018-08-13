a nice bot 4 u.

dockerized. will ~~~tweet and~~~ toot very good cats regularly.

_(twitter support probably won't be added )_


- `MASTODON_TOKEN`: a Mastodon user API token
- `MASTODON_SERVER`: the instance to which API calls should be made (usually
  where the bot user lives.) (default: https://mastodon.social)
~~~- `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_KEY`, and
  `TWITTER_ACCESS_SECRET`: you need all of these guys to make a tweet.~~~
- `INTERVAL_MINUTES`: the interval between each post. (default: 240 minutes)

catbot uses the [envalid](https://github.com/af/envalid) package which in turn
wraps [dotenv](https://github.com/motdotla/dotenv), so you can alternately stick
any of the above environment variables in a file named `.env` in the project
root. (it's gitignored, so there's no risk of accidentally committing private
API tokens you put in there.)

catbot is written in typescript, and the dockerfile will compile to js as part
of its setup. run `yarn watch` if you're hacking on things and want to
automatically recompile on changes.
