FROM node:20-slim

WORKDIR /app

# Copy package files first for layer caching
COPY server/package.json server/package-lock.json* ./

RUN npm install --production

# Copy server source
COPY server/src ./src

# Expose port
EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "node src/db/migrate.js && node src/index.js"]
