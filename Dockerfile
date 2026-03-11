# ── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run lint 2>/dev/null || true

# ── Production stage ─────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S sapconnect && \
    adduser -S sapconnect -u 1001 -G sapconnect

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/srv ./srv
COPY --from=builder /app/db ./db
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/migration ./migration
COPY --from=builder /app/discovery ./discovery
COPY --from=builder /app/agent ./agent
COPY --from=builder /app/extraction ./extraction
COPY --from=builder /app/scripts ./scripts

USER sapconnect

ENV NODE_ENV=production
ENV PORT=4004
ENV API_PORT=4005
ENV AUDIT_LOG_PATH=/tmp/sapconnect/audit.jsonl
EXPOSE 4004
EXPOSE 4005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4005/health || exit 1

CMD ["node", "scripts/start-services.js"]
