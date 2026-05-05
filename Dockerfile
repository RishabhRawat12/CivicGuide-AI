# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend & Final Image
FROM node:20-slim
WORKDIR /app

# Install production dependencies for backend
COPY new-backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY new-backend/ ./

# Copy built frontend from Stage 1 to backend public folder
COPY --from=frontend-builder /app/client/dist ./public

# Environment Variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the Cloud Run port
EXPOSE 8080

# Start the Supersystem
CMD ["node", "server.js"]
