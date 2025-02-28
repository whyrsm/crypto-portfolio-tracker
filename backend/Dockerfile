# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy application files and build the app
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

CMD ["npm", "run", "start:prod"]
