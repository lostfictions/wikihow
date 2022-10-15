ARG NODE_VERSION

FROM node:${NODE_VERSION} AS build
WORKDIR /code
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY src ./src
COPY tsconfig.json ./
# we re-run `yarn install --production` to strip the unneeded devDeps from
# node_modules after the build is done.
RUN yarn build && yarn install --frozen-lockfile --production --offline

FROM node:${NODE_VERSION}
WORKDIR /code
# https://stackoverflow.com/questions/37458287/how-to-run-a-cron-job-inside-a-docker-container
# hadolint ignore=DL3008
RUN apt-get update \
  && apt-get -qq --no-install-recommends install cron \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
COPY run.sh ./run.sh
COPY --from=build /code/node_modules ./node_modules
COPY --from=build /code/dist ./dist
ENV NODE_ENV=production
ENTRYPOINT ["bash", "run.sh"]
CMD ["node", "dist/main.js"]