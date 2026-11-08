FROM oven/bun:1.4.4
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/prayer-engine/package.json ./packages/prayer-engine/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile

COPY packages ./packages
COPY apps/api ./apps/api
COPY data ./data

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
