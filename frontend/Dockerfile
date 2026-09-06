# Etapa 1: build de Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: servir con nginx
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Limpiar el contenido por defecto
RUN rm -rf ./*

# Copiar el build de Angular
COPY --from=build /app/dist/trifit-frontend/browser ./

# Plantilla nginx: /docker-entrypoint.sh sustituye ${HTTPS_PORT} al arrancar
# y genera /etc/nginx/conf.d/default.conf (reemplaza la de stock).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Certificado TLS autofirmado para desarrollo (CN=localhost).
# En producción se reemplaza montando certificados reales en
# /etc/nginx/certs/trifit.crt y /etc/nginx/certs/trifit.key.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -newkey rsa:2048 -nodes \
      -keyout /etc/nginx/certs/trifit.key \
      -out /etc/nginx/certs/trifit.crt \
      -days 825 -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --no-check-certificate --tries=1 --spider https://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
