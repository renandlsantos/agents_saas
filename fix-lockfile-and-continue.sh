#!/bin/bash

# SCRIPT PARA CORRIGIR LOCKFILE E CONTINUAR DEPLOY
# Execute este script quando o deploy parar no erro de lockfile

set -e

echo "🔧 CORRIGINDO ERRO DE LOCKFILE E CONTINUANDO DEPLOY"
echo "================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Não encontrado package.json. Navegando para /opt/agents-chat..."
    cd /opt/agents-chat
fi

# Configurar variáveis de ambiente para 32GB RAM
export NODE_OPTIONS="--max-old-space-size=28672"
export DOCKER=true
export NODE_ENV=production

echo "🧹 Limpando cache e lockfile..."
rm -rf node_modules
rm -rf .pnpm-store
rm -rf pnpm-lock.yaml

echo "📦 Reinstalando dependências..."
pnpm install --no-frozen-lockfile

echo "🔨 Fazendo build da aplicação..."
rm -rf .next out
pnpm run build:docker

# Verificar se build foi bem-sucedido
if [ -d ".next/standalone" ]; then
    echo "✅ Build da aplicação concluído!"
else
    echo "❌ Build da aplicação falhou!"
    exit 1
fi

echo "🐳 Fazendo build da imagem Docker..."
docker build -f docker-compose/Dockerfile.prebuilt -t agents-chat:production .

# Verificar se imagem foi criada
if docker images | grep -q "agents-chat.*production"; then
    echo "✅ Imagem Docker criada com sucesso!"
else
    echo "❌ Falha ao criar imagem Docker!"
    exit 1
fi

echo "🗄️ Configurando banco de dados..."
cat > docker-compose.db.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: agents-chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: agents_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: agents123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5
volumes:
  postgres_data:
EOF

# Verificar se banco já está rodando
if docker ps | grep -q "agents-chat-postgres"; then
    echo "📊 Banco de dados já está rodando"
else
    echo "🚀 Iniciando banco de dados..."
    docker-compose -f docker-compose.db.yml up -d
    echo "⏳ Aguardando banco estar pronto..."
    sleep 30
fi

echo "🚀 Iniciando aplicação..."
docker stop agents-chat 2>/dev/null || true
docker rm agents-chat 2>/dev/null || true

docker run -d \
  --name agents-chat \
  --restart unless-stopped \
  -p 3210:3210 \
  --env-file .env \
  --network host \
  agents-chat:production

echo "⏳ Aguardando aplicação iniciar..."
sleep 15

echo "🔍 Verificando status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📋 Últimos logs:"
docker logs agents-chat --tail 10

echo ""
echo "✅ DEPLOY CORRIGIDO E CONCLUÍDO!"
echo "📱 Acesse: http://$(curl -s ipinfo.io/ip):3210"
echo "📊 Monitorar: docker logs -f agents-chat"
echo "🔧 Reiniciar: docker restart agents-chat"
