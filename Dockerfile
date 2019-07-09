FROM node:12.1

WORKDIR /code

# https://stackoverflow.com/questions/37458287/how-to-run-a-cron-job-inside-a-docker-container
RUN apt-get update && apt-get -qq --no-install-recommends install cron && apt-get clean

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn build

ENV NODE_ENV=production
ENTRYPOINT ["bash", "run.sh"]
CMD ["yarn", "start"]
