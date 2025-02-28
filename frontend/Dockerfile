FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .

# Ensure backend is running before building
RUN apk add --no-cache curl && \
    sh -c "until curl -s http://backend:3000/healthcheck; do sleep 5; done"

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]