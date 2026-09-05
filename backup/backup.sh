#!/bin/sh
# TriFit Gym Manager — Respaldo automático de PostgreSQL
# Genera un dump diario comprimido en /backups y elimina los más antiguos.
# Configuración por variables de entorno:
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE (conexión, obligatorias)
#   BACKUP_RETENTION_DAYS (por defecto 14)
#   BACKUP_INTERVAL_SECONDS (por defecto 86400 = 24 h)
set -eu

: "${PGHOST:?Falta PGHOST}"
: "${PGUSER:?Falta PGUSER}"
: "${PGPASSWORD:?Falta PGPASSWORD}"
: "${PGDATABASE:?Falta PGDATABASE}"

BACKUP_DIR=/backups
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
INTERVAL_SECONDS=${BACKUP_INTERVAL_SECONDS:-86400}

mkdir -p "$BACKUP_DIR"
export PGPASSWORD

hacer_backup() {
  TS=$(date +%Y%m%d_%H%M%S)
  FILE="$BACKUP_DIR/trifit_${TS}.dump"
  if pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -F c -f "$FILE"; then
    gzip -f "$FILE"
    find "$BACKUP_DIR" -maxdepth 1 -name 'trifit_*.dump.gz' -mtime +"$RETENTION_DAYS" -delete
    echo "[backup] OK: ${FILE}.gz"
  else
    echo "[backup] ERROR: pg_dump falló, reintentando en el próximo ciclo" >&2
  fi
}

# Respaldo inmediato al arrancar + ciclo diario.
hacer_backup
while true; do
  sleep "$INTERVAL_SECONDS"
  hacer_backup
done
