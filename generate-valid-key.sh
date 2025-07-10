#!/bin/bash

# Gerar uma nova KEY_VAULTS_SECRET válida
echo "🔑 Gerando nova KEY_VAULTS_SECRET válida..."

# Gerar nova key de 32 bytes (64 hex chars)
NEW_KEY=$(openssl rand -hex 32)

echo "Nova KEY_VAULTS_SECRET: $NEW_KEY"
echo ""
echo "Para aplicar manualmente:"
echo "1. Edite o arquivo .env"
echo "2. Substitua a linha KEY_VAULTS_SECRET pela seguinte:"
echo "KEY_VAULTS_SECRET=$NEW_KEY"
echo "3. Reinicie: docker-compose restart app"