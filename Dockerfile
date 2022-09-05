FROM node:16-slim
WORKDIR /app
COPY yarn.lock .
COPY package.json .
COPY web/package.json web/package.json
COPY types/package.json types/package.json
COPY .yarnrc.yml .
COPY .yarn .yarn
RUN yarn
COPY web web
COPY types types
RUN yarn workspace @staywithme/web build
CMD ["yarn", "workspace", "@staywithme/web", "start"]
