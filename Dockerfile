FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

# Create uploads directory
RUN mkdir -p /app/uploads/covers /app/uploads/zips

EXPOSE 3000

CMD ["node", "dist/server.js"]