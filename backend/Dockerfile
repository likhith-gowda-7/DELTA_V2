# syntax=docker/dockerfile:1.6

# ---------- build stage ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Create a non-root user
RUN addgroup -S delta && adduser -S delta -G delta

# Copy built node_modules and source
COPY --from=deps --chown=delta:delta /app/node_modules ./node_modules
COPY --chown=delta:delta package.json ./
COPY --chown=delta:delta src ./src

# Create logs dir
RUN mkdir -p /app/logs && chown -R delta:delta /app/logs

USER delta

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

# Health check (use wget, available in alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
