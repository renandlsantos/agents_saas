#!/bin/bash
echo "🚀 Iniciando ambiente de desenvolvimento com Admin Panel..."
echo ""
echo "Admin Panel: http://localhost:3010/admin"
echo "MinIO Console: http://localhost:9001"
echo ""

# Garantir que os serviços estão rodando
docker-compose up -d postgres redis minio

# Iniciar em modo desenvolvimento
pnpm dev
