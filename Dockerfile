# Dockerfile.admin - Admin Panel
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for admin panel
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy admin panel source
COPY . .

# Build the admin application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built admin files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for admin
COPY nginx-admin.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S admin -u 1001 && \
    chown -R admin:nodejs /usr/share/nginx/html && \
    chown -R admin:nodejs /var/cache/nginx && \
    chown -R admin:nodejs /var/log/nginx && \
    chown -R admin:nodejs /etc/nginx/conf.d

# Switch to non-root user
USER admin

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
