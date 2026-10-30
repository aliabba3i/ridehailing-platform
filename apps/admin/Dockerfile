FROM node:25-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/
COPY packages/shared/package.json packages/shared/
COPY apps/admin/package.json apps/admin/
COPY apps/rider/package.json apps/rider/
COPY apps/driver/package.json apps/driver/
RUN npm install --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/admin apps/admin
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w @ride/shared && npm run build -w @ride/admin
FROM node:25-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/admin/.next/standalone ./
COPY --from=build /app/apps/admin/.next/static ./apps/admin/.next/static
EXPOSE 3000
CMD ["node","apps/admin/server.js"]
