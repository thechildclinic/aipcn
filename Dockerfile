# Multi-stage build for AIPC Healthcare Platform
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY components/ ./components/
COPY types/ ./types/
COPY constants/ ./constants/
COPY data/ ./data/
COPY tests/ ./tests/

# Build frontend
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/src/ ./src/

# Build backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy built frontend
COPY --from=frontend-build /app/dist ./public

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aipc -u 1001

# Change ownership of the app directory
RUN chown -R aipc:nodejs /app
USER aipc

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node backend/dist/healthcheck.js || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/server.js"]
