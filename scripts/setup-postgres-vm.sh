#!/bin/bash

# Script para configurar PostgreSQL com pgvector na VM
# Este script deve ser executado NA VM, não localmente

set -e

echo "🐘 Configurando PostgreSQL com pgvector..."

# Variáveis de configuração (mesmas do .env.vm)
POSTGRES_PASSWORD="0435d1db9f8b752f63d2c71c9d70f5de"
POSTGRES_DB="agents_chat"
POSTGRES_USER="postgres"

# Parar e remover container existente se houver
echo "🛑 Parando containers PostgreSQL existentes..."
docker stop postgres-agents 2>/dev/null || true
docker rm postgres-agents 2>/dev/null || true

# Criar volume para persistência de dados
echo "💾 Criando volume para dados..."
docker volume create postgres-agents-data 2>/dev/null || true

# Iniciar container PostgreSQL com pgvector
echo "🚀 Iniciando PostgreSQL com pgvector..."
docker run -d \
  --name postgres-agents \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -p 5432:5432 \
  -v postgres-agents-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  pgvector/pgvector:pg16

# Aguardar PostgreSQL iniciar
echo "⏳ Aguardando PostgreSQL iniciar..."
sleep 10

# Verificar se está rodando
if docker ps | grep -q postgres-agents; then
    echo "✅ PostgreSQL iniciado com sucesso!"
    
    # Instalar extensão pgvector
    echo "🔧 Instalando extensão pgvector..."
    docker exec postgres-agents psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;"
    
    echo "✅ Extensão pgvector instalada!"
    echo ""
    echo "📋 Informações de conexão:"
    echo "   Host: localhost"
    echo "   Porta: 5432"
    echo "   Banco: agents_chat"
    echo "   Usuário: postgres"
    echo "   Senha: ${POSTGRES_PASSWORD}"
    echo ""
    echo "🔗 String de conexão:"
    echo "   postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat"
else
    echo "❌ Erro ao iniciar PostgreSQL!"
    docker logs postgres-agents
    exit 1
fi