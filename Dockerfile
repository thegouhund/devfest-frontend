# Stage 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

# Enable and prepare pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build argument for backend API URL (defaults to production backend)
ARG VITE_API_BASE_URL=https://devfest-backend.gouhund.my.id
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle
RUN pnpm build

# Stage 2: Production web server
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
