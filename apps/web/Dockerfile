FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy the web app
COPY apps/web ./apps/web

# Install all dependencies
RUN npm ci

# Build args for API URL (baked into Next.js at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the web app
WORKDIR /app/apps/web
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static/ ./apps/web/.next/static/
RUN mkdir -p ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
