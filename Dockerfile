# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage cache
COPY package.json ./
# If you have a lock file, copy it too. Since it wasn't explicitly seen, we use a wildcard or strict copy if present.
# We'll stick to just package.json and npm install for robustness if lockfile is missing.
# COPY package-lock.json ./ 

RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
