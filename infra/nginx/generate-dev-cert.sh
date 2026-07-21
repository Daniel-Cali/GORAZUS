#!/bin/sh
# GORAZUS ERP — genera un certificado autofirmado para HTTPS en desarrollo
# local. Nunca se commitea (infra/nginx/certs/ está en .gitignore) — cada
# desarrollador lo genera una vez. En staging/production reales, TLS lo
# termina cert-manager (Kubernetes) o un certificado real, nunca este script.
set -e
cd "$(dirname "$0")"
mkdir -p certs
# MSYS_NO_PATHCONV: en Git Bash (Windows), rutas que empiezan con "/" se
# reescriben como rutas de Windows — rompe "/CN=..." sin esto.
MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout certs/dev.key -out certs/dev.crt \
  -subj "/CN=gorazus.local" \
  -addext "subjectAltName=DNS:localhost,DNS:gorazus.local,IP:127.0.0.1"
echo "Certificado generado en infra/nginx/certs/ (dev.crt, dev.key)."
