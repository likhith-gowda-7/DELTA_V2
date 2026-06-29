# syntax=docker/dockerfile:1.6

# ---------- build stage ----------
FROM node:20-alpine AS build

ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL:-http://localhost:5000}

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime stage — nginx ----------
FROM nginx:1.27-alpine AS runtime

# Copy the built static assets
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config with SPA fallback to index.html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(?:js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
