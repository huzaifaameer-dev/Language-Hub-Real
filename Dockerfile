# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Copy native-binary-required postcss/lightningcss handled by npm ci
RUN npm ci --omit=dev

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# The app REQUIRES webpack (Turbopack cannot load the lightningcss native
# binary on some hosts), so force the webpack bundler explicitly.
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy static assets the runtime needs.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
# Copy static chunks + traced output are inside .next/standalone/.next
COPY --from=build /app/.next/static ./.next/static

# Ensure writable runtime dirs for uploads / payment proofs (may not be mounted).
RUN mkdir -p /app/public/uploads/blog /app/private/uploads/proof && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
