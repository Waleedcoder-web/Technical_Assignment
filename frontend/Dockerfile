# =====================================================================
# HavenKey Frontend Dockerfile (Next.js 16 + Tailwind CSS)
# =====================================================================

FROM public.ecr.aws/docker/library/node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy full frontend source code
COPY . .

# Build-time environment configuration
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=https://zhaxrezorucqfdxwxvme.supabase.co
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EieSlOPQetQvRD6igkpppA_DasiapBf

# Build optimized production bundle
RUN npm run build

# Stage 2: Production Runner
FROM public.ecr.aws/docker/library/node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy compiled Next.js build and assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/models ./models
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start", "--", "-p", "3000"]
