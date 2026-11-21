FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* tsconfig.json ./
RUN npm i -g corepack@latest && corepack enable && pnpm install --frozen-lockfile
COPY src ./src
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++ tzdata
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN npm i -g corepack@latest && corepack enable && pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data
ENV NODE_ENV=production \
    DB_PATH=/app/data/warmup.db
CMD ["node", "dist/index.js"]
