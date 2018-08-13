FROM node:10.6

WORKDIR /code

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

COPY . ./

ENV NODE_ENV=production
ENV DEBUG=*
ENTRYPOINT yarn start
