FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Imagen de produccion — livianda y sin devDependencies
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S sismorisk && adduser -S sismorisk -u 1001
USER sismorisk

CMD ["node", "dist/server.cjs"]
