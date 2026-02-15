FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

COPY packages/common ./packages/common
COPY apps/worker ./apps/worker

RUN npm ci

WORKDIR /app/packages/common
RUN npx prisma generate && npm run build

WORKDIR /app/apps/worker
RUN npm run build --if-present

# --- Runner Stage ---
FROM node:18-alpine

# Install Docker CLI so the worker can spawn docker commands
RUN apk add --no-cache docker-cli openssl


WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/worker.js"]
