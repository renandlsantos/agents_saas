#!/bin/bash

echo "🔧 Correção rápida do MinIO..."

# 1. Verificar credenciais do MinIO
echo "🔍 Verificando credenciais..."
if [[ -f /opt/agents_saas/.env ]]; then
    MINIO_USER=$(grep "MINIO_ROOT_USER" /opt/agents_saas/.env | cut -d'=' -f2)
    MINIO_PASS=$(grep "MINIO_ROOT_PASSWORD" /opt/agents_saas/.env | cut -d'=' -f2)
    echo "📄 Credenciais do .env: $MINIO_USER / $MINIO_PASS"
else
    MINIO_USER="minioadmin"
    MINIO_PASS="minioadmin"
    echo "⚠️ Usando credenciais padrão: $MINIO_USER / $MINIO_PASS"
fi

# 2. Configurar MinIO
echo "🔗 Configurando MinIO..."
docker exec agents-chat-minio mc alias remove myminio 2>/dev/null || true
docker exec agents-chat-minio mc alias set myminio http://localhost:9000 "$MINIO_USER" "$MINIO_PASS" --api S3v4

# 3. Tornar bucket público
echo "🔓 Tornando bucket público..."
docker exec agents-chat-minio mc anonymous set public myminio/lobe

# 4. Verificar se funcionou
echo "✅ Verificando configuração..."
docker exec agents-chat-minio mc ls myminio/lobe

echo "🎯 Pronto! Teste o upload agora."
