#!/bin/sh
# TriFit Gym Manager — Arranque del backend.
# 1. Si JWT_SECRET no está definido o trae un valor de ejemplo (público en el
#    repo), genera uno aleatorio y lo persiste en el volumen backend_data.
#    Cada despliegue queda así con un secreto único y estable entre reinicios.
# 2. Aplica el schema a la BD, siembra la base si está vacía y arranca el server.
set -eu

SECRET_FILE=/app/data/.jwt_secret
SECRETOS_EJEMPLO="secreto_desarrollo cambia_este_secreto_en_produccion"

es_ejemplo() {
  for p in $SECRETOS_EJEMPLO; do
    if [ "$1" = "$p" ]; then return 0; fi
  done
  return 1
}

if [ -z "${JWT_SECRET:-}" ] || es_ejemplo "$JWT_SECRET"; then
  mkdir -p /app/data
  if [ -s "$SECRET_FILE" ]; then
    JWT_SECRET="$(cat "$SECRET_FILE")"
    export JWT_SECRET
    echo "[seguridad] JWT_SECRET reutilizado desde volumen persistente"
  else
    JWT_SECRET="$(openssl rand -base64 48)"
    export JWT_SECRET
    printf '%s' "$JWT_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    echo "[seguridad] JWT_SECRET generado automáticamente y persistido en volumen"
  fi
fi

npx prisma db push --skip-generate --accept-data-loss

# Seed base solo si la BD está vacía (primer arranque en limpio).
# seed.js es idempotente. El dataset de prueba NUNCA se siembra solo
# porque reescribe membresías y pagos.
VACIA="$(node -e 'const {PrismaClient}=require("@prisma/client");(async()=>{const p=new PrismaClient();try{const n=await p.usuario.count();console.log(n===0?"SI":"NO")}catch(e){console.log("ERROR")}finally{await p.$disconnect()}})();')"
if [ "$VACIA" = "SI" ]; then
  echo "[seed] BD vacía: sembrando datos base (roles, admin, gimnasio, planes, ejercicios)..."
  npm run seed
else
  echo "[seed] BD con datos, se omite el seed base"
fi

exec node src/server.js
