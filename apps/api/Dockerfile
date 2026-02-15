FROM node:18-alpine AS builder

WORKDIR /app

# Copy root files
COPY package.json package-lock.json ./

# Copy packages
COPY packages/common ./packages/common

# Copy app
COPY apps/api ./apps/api

# Install dependencies (installing everything to build)
RUN npm ci

# Generate Prisma Client and Build Common
WORKDIR /app/packages/common
RUN npx prisma generate && npm run build

# Build API
WORKDIR /app/apps/api
RUN npm run build --if-present

# --- Runner Stage ---
FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

ENV NODE_ENV=production

CMD ["node", "apps/api/dist/server.js"]
