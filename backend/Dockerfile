FROM node:25-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY backend/package.json backend/
COPY packages/shared/package.json packages/shared/
COPY apps/admin/package.json apps/admin/
COPY apps/rider/package.json apps/rider/
COPY apps/driver/package.json apps/driver/
RUN npm install --no-audit --no-fund
COPY packages/shared packages/shared
COPY backend backend
RUN npm run build -w @ride/shared && npx prisma generate --schema backend/prisma/schema.prisma && npm run build -w @ride/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema backend/prisma/schema.prisma && node backend/dist/server.js"]
