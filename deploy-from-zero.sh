#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY COMPLETO DO ZERO - AGENTS CHAT
# Para VM DigitalOcean (8vcpu-32gb-amd-sfo3-01)
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções utilitárias
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

# =============================================================================
# 1. CONFIGURAÇÃO INICIAL DO SISTEMA
# =============================================================================

log "🔧 Configurando sistema base..."

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar utilitários essenciais
log "Instalando utilitários essenciais..."
apt install -y curl wget git htop unzip build-essential software-properties-common

# Configurar fuso horário
log "Configurando fuso horário..."
timedatectl set-timezone America/Sao_Paulo

# Configurar firewall básico
log "Configurando firewall..."
ufw allow OpenSSH
ufw allow 3210/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

success "Sistema base configurado!"

# =============================================================================
# 2. INSTALAÇÃO DO DOCKER
# =============================================================================

log "🐳 Instalando Docker..."

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
log "Instalando Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configurar Docker para usar mais recursos
log "Configurando Docker para alta performance..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-runtime": "runc",
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "0.0.0.0:9323",
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10
}
EOF

systemctl restart docker
systemctl enable docker

# Verificar instalação
docker --version
docker-compose --version

success "Docker instalado e configurado!"

# =============================================================================
# 3. INSTALAÇÃO DO NODE.JS
# =============================================================================

log "🟢 Instalando Node.js 22..."

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Instalar PNPM
log "Instalando PNPM..."
npm install -g pnpm@latest

# Verificar versões
node --version
npm --version
pnpm --version

success "Node.js e PNPM instalados!"

# =============================================================================
# 4. CLONAGEM DO REPOSITÓRIO
# =============================================================================

log "📁 Clonando repositório..."

# Criar diretório de trabalho
mkdir -p /opt/agents-chat
cd /opt/agents-chat

# Clonar repositório
log "Clonando repositório agents_saas..."
git clone https://github.com/lobehub/lobe-chat.git .

# Configurar permissões
chown -R $SUDO_USER:$SUDO_USER /opt/agents-chat 2>/dev/null || true

success "Repositório clonado!"

# =============================================================================
# 5. CONFIGURAÇÃO DO AMBIENTE
# =============================================================================

log "⚙️  Configurando ambiente..."

# Criar arquivo .env
log "Criando arquivo .env..."
cat > .env << 'EOF'
# =============================================================================
# CONFIGURAÇÃO DE PRODUÇÃO - AGENTS CHAT
# =============================================================================

NODE_ENV=production
PORT=3210

# Database Configuration
DATABASE_URL=postgresql://postgres:agents123@localhost:5432/agents_chat
DATABASE_DRIVER=node
KEY_VAULTS_SECRET=change-this-secret-key-in-production

# Authentication
NEXT_AUTH_SECRET=change-this-nextauth-secret-in-production
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3210
NEXT_PUBLIC_SERVICE_MODE=server

# Feature Flags
FEATURE_FLAGS=

# Model Providers (Configure as needed)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# S3 Storage (Optional)
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

# Performance (32GB RAM optimization)
NODE_OPTIONS=--max-old-space-size=28672
NEXT_TELEMETRY_DISABLED=1

# Security
ACCESS_CODE=

EOF

# Gerar secrets automaticamente
log "Gerando secrets de segurança..."
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXT_AUTH_SECRET=$(openssl rand -hex 32)

# Atualizar .env com secrets gerados
sed -i "s/KEY_VAULTS_SECRET=change-this-secret-key-in-production/KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}/" .env
sed -i "s/NEXT_AUTH_SECRET=change-this-nextauth-secret-in-production/NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}/" .env

success "Ambiente configurado!"

# =============================================================================
# 6. INSTALAÇÃO DE DEPENDÊNCIAS
# =============================================================================

log "📦 Instalando dependências..."

# Instalar dependências com configurações otimizadas para 32GB RAM
export NODE_OPTIONS="--max-old-space-size=28672"
pnpm install --no-frozen-lockfile

success "Dependências instaladas!"

# =============================================================================
# 7. BUILD DA APLICAÇÃO
# =============================================================================

log "🔨 Fazendo build da aplicação..."

# Limpar builds anteriores
rm -rf .next out

# Build da aplicação
log "Executando build de produção..."
export DOCKER=true
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=28672"

pnpm run build:docker

# Verificar se build foi bem-sucedido
if [ -d ".next/standalone" ]; then
    success "Build da aplicação concluído!"
else
    error "Build da aplicação falhou!"
fi

# =============================================================================
# 8. BUILD DA IMAGEM DOCKER
# =============================================================================

log "🐳 Fazendo build da imagem Docker..."

# Build da imagem usando artefatos pré-construídos
docker build -f docker-compose/Dockerfile.prebuilt -t agents-chat:production .

# Verificar se imagem foi criada
if docker images | grep -q "agents-chat.*production"; then
    success "Imagem Docker criada com sucesso!"
else
    error "Falha ao criar imagem Docker!"
fi

# =============================================================================
# 9. CONFIGURAÇÃO DO BANCO DE DADOS
# =============================================================================

log "🗄️  Configurando banco de dados..."

# Criar docker-compose para banco de dados
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

# Iniciar banco de dados
docker-compose -f docker-compose.db.yml up -d

# Aguardar banco estar pronto
log "Aguardando banco de dados estar pronto..."
sleep 30

success "Banco de dados configurado!"

# =============================================================================
# 10. EXECUTAR APLICAÇÃO
# =============================================================================

log "🚀 Iniciando aplicação..."

# Parar container anterior se existir
docker stop agents-chat 2>/dev/null || true
docker rm agents-chat 2>/dev/null || true

# Executar aplicação
docker run -d \
  --name agents-chat \
  --restart unless-stopped \
  -p 3210:3210 \
  --env-file .env \
  --network host \
  agents-chat:production

# Aguardar aplicação iniciar
log "Aguardando aplicação iniciar..."
sleep 15

success "Aplicação iniciada!"

# =============================================================================
# 11. VERIFICAÇÃO E MONITORAMENTO
# =============================================================================

log "🔍 Verificando status da aplicação..."

# Verificar containers
log "Containers rodando:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar logs
log "Últimos logs da aplicação:"
docker logs agents-chat --tail 20

# Testar aplicação
log "Testando aplicação..."
sleep 5
if curl -f http://localhost:3210 >/dev/null 2>&1; then
    success "Aplicação está respondendo!"
else
    warn "Aplicação pode estar ainda inicializando..."
fi

# =============================================================================
# 12. INFORMAÇÕES FINAIS
# =============================================================================

echo ""
echo "============================================================================="
echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "============================================================================="
echo ""
echo "📋 INFORMAÇÕES DA APLICAÇÃO:"
echo "   • URL: http://$(curl -s ipinfo.io/ip):3210"
echo "   • Container: agents-chat"
echo "   • Banco: agents-chat-postgres"
echo "   • Logs: docker logs agents-chat"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "   • Ver logs: docker logs -f agents-chat"
echo "   • Reiniciar: docker restart agents-chat"
echo "   • Parar: docker stop agents-chat"
echo "   • Status: docker ps"
echo ""
echo "📁 DIRETÓRIO: /opt/agents-chat"
echo "🔒 SECRETS GERADOS EM: .env"
echo ""
echo "============================================================================="

# Criar script de monitoramento
cat > /opt/agents-chat/monitor.sh << 'EOF'
#!/bin/bash
echo "=== STATUS DOS CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== LOGS DA APLICAÇÃO (últimas 20 linhas) ==="
docker logs agents-chat --tail 20
echo ""
echo "=== USO DE RECURSOS ==="
docker stats --no-stream
EOF

chmod +x /opt/agents-chat/monitor.sh

success "Script de monitoramento criado em /opt/agents-chat/monitor.sh"

log "Deploy finalizado! 🚀"
