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

# Configuración de nginx (proxy para /api y /uploads al backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
