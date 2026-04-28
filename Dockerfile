FROM node:22-bookworm-slim AS base

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY prisma.config.ts ./

ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public

RUN ./node_modules/.bin/prisma generate
RUN npm run build:bot

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY docker/run-bot.sh ./docker/run-bot.sh

RUN chmod +x ./docker/run-bot.sh

USER node

CMD ["./docker/run-bot.sh"]
