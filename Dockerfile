# Dockerfile for LifeWay USA Storage Service
FROM nginx:alpine

# Create directories for different types of content
RUN mkdir -p /usr/share/nginx/html/images \
    /usr/share/nginx/html/uploads \
    /usr/share/nginx/html/generated \
    /usr/share/nginx/html/assets

# Copy static files
COPY images/ /usr/share/nginx/html/images/
COPY uploads/ /usr/share/nginx/html/uploads/
COPY generated/ /usr/share/nginx/html/generated/
COPY assets/ /usr/share/nginx/html/assets/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx-storage && \
    adduser -S nginx-storage -u 1001 && \
    chown -R nginx-storage:nginx-storage /usr/share/nginx/html && \
    chown -R nginx-storage:nginx-storage /var/cache/nginx && \
    chown -R nginx-storage:nginx-storage /var/log/nginx && \
    chown -R nginx-storage:nginx-storage /etc/nginx/conf.d

# Switch to non-root user
USER nginx-storage

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
