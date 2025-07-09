#!/bin/bash

# DEPLOY RÁPIDO - AGENTS CHAT
# Execute como root: sudo bash quick-deploy.sh

set -e

echo "🚀 INICIANDO DEPLOY RÁPIDO DO AGENTS CHAT"
echo "=========================================="

# 1. Atualizar sistema e instalar dependências
echo "📦 Instalando dependências..."
apt update && apt upgrade -y
apt install -y curl wget git htop unzip build-essential

# 2. Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 3. Instalar Node.js 22
echo "🟢 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# 4. Clonar repositório
echo "📁 Clonando repositório..."
mkdir -p /opt/agents-chat
cd /opt/agents-chat
git clone https://github.com/lobehub/lobe-chat.git .

# 5. Configurar ambiente
echo "⚙️ Configurando ambiente..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3210
DATABASE_URL=postgresql://postgres:agents123@localhost:5432/agents_chat
DATABASE_DRIVER=node
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXT_AUTH_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_PUBLIC_SITE_URL=http://localhost:3210
NEXT_PUBLIC_SERVICE_MODE=server
NODE_OPTIONS=--max-old-space-size=28672
NEXT_TELEMETRY_DISABLED=1
EOF

# 6. Instalar dependências
echo "📦 Instalando dependências do projeto..."
export NODE_OPTIONS="--max-old-space-size=28672"
pnpm install --no-frozen-lockfile

# 7. Build da aplicação
echo "🔨 Fazendo build..."
export DOCKER=true
export NODE_ENV=production
pnpm run build:docker

# 8. Build da imagem Docker
echo "🐳 Criando imagem Docker..."
docker build -f docker-compose/Dockerfile.prebuilt -t agents-chat:production .

# 9. Configurar banco de dados
echo "🗄️ Configurando banco..."
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
volumes:
  postgres_data:
EOF

docker-compose -f docker-compose.db.yml up -d

# 10. Aguardar banco estar pronto
echo "⏳ Aguardando banco..."
sleep 30

# 11. Executar aplicação
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

# 12. Verificar status
echo "🔍 Verificando status..."
sleep 15
docker ps
docker logs agents-chat --tail 10

# 13. Configurar firewall
echo "🔒 Configurando firewall..."
ufw allow 3210/tcp
ufw --force enable

echo ""
echo "✅ DEPLOY CONCLUÍDO!"
echo "📱 Acesse: http://$(curl -s ipinfo.io/ip):3210"
echo "📊 Monitorar: docker logs -f agents-chat"
echo "🔧 Reiniciar: docker restart agents-chat"
