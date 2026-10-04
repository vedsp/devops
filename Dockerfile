# ---- Stage 1: install production dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime image ----
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_FILE=/app/data/todos.json
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Writable data directory for the non-root user
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
