# 🐳 Dockerfile for Frontend

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build -- --configuration production

# Production stage
FROM nginx:alpine

# Copy built application to nginx
COPY --from=builder /app/dist/terrasens /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
