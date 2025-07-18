#!/bin/bash
echo "🚀 Iniciando ambiente de produção com Admin Panel..."

# Garantir que os serviços estão rodando
docker-compose up -d

# Iniciar servidor de produção
echo "Admin Panel disponível em: http://localhost:3210/admin"
pnpm start
