# Use a small, stable Node 18 image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (helps caching)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy app sources
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV PORT=8000
EXPOSE 8000

# Start the app with node (production)
CMD ["node", "index.js"]
