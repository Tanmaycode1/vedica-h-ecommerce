FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create uploads directory and ensure it has correct permissions
RUN mkdir -p uploads && chmod -R 777 uploads

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 3002

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/health || exit 1

# Start the application
CMD ["npm", "run", "start"] 