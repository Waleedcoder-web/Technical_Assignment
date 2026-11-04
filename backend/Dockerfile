# =====================================================================
# HavenKey Backend Dockerfile (Express + TypeScript)
# =====================================================================

# Stage 1: Build TypeScript source code
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions and typescript configuration
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies needed for tsc)
RUN npm install

# Copy source code
COPY src ./src

# Compile TypeScript into JavaScript (dist/ folder)
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Expose backend API port
EXPOSE 5000

# Start Express server
CMD ["node", "dist/server.js"]
