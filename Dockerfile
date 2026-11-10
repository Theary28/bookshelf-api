# ---- Stage 1: build ----
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Stage 2: runtime (no source, no dev dependencies) ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]
