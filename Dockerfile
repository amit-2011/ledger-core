# syntax=docker/dockerfile:1

# --- Build stage: install everything and compile to dist/ ---
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Production stage: prod deps + compiled output only ---
FROM node:22-alpine AS production
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

USER node

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "node dist/database/run-migrations.js && node dist/main.js"]
