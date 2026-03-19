FROM node:18-alpine

# Set working directory
WORKDIR /app

# Required by the Docker HEALTHCHECK command below
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c 'curl -f "http://localhost:${PORT:-10000}/health" || exit 1'

# Start the application
CMD ["node", "server.js"]
