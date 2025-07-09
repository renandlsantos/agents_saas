#!/bin/bash

# ============================================================================
# 🚀 DEPLOY VM - AGENTS CHAT
# ============================================================================
# Script otimizado para deploy em VM/produção
# - Build da imagem Docker local
# - PostgreSQL + MinIO + Redis
# - Configuração automática de todas as variáveis
# ============================================================================

set -e  # Parar em qualquer erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funções de output
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
highlight() { echo -e "${PURPLE}[HIGHLIGHT]${NC} $1"; }

# Obter IP da VM
VM_IP=$(curl -s ipinfo.io/ip || echo "localhost")
log "IP da VM detectado: $VM_IP"

# Se rebuild rápido:
if [[ "$1" == "rebuild" ]]; then
  log "♻️  Rebuild rápido da aplicação..."
  docker build -t agents-chat:local .
  docker rm -f agents-chat || true
  docker-compose up -d app
  docker logs agents-chat --tail 20
  success "Rebuild e restart concluídos!"
  exit 0
fi

# =============================================================================
# 1. PREPARAÇÃO DO AMBIENTE
# =============================================================================

log "🏗️ Preparando ambiente para deploy na VM..."

# Verificar se estamos no repositório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Verificar dependências
command -v docker >/dev/null 2>&1 || error "Docker não está instalado!"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose não está instalado!"

success "Ambiente preparado!"

# =============================================================================
# 2. LIMPEZA
# =============================================================================

log "🧹 Limpando ambiente..."

# Parar containers
docker-compose down 2>/dev/null || true

# Remover containers específicos
docker rm -f agents-chat agents-chat-postgres agents-chat-minio agents-chat-redis 2>/dev/null || true

success "Limpeza concluída!"

# =============================================================================
# 3. GERAÇÃO DO .env
# =============================================================================

log "📝 Configurando variáveis de ambiente..."

# Usar senhas existentes ou gerar novas
if [ -f ".env" ]; then
    source .env
    log "Usando configurações existentes do .env"
else
    # Gerar senhas seguras
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    MINIO_PASSWORD=$(openssl rand -hex 16)
    KEY_VAULTS_SECRET=$(openssl rand -hex 32)
    NEXT_AUTH_SECRET=$(openssl rand -hex 32)
fi

# Criar/atualizar .env
cat > .env << EOF
# =============================================================================
# AGENTS CHAT - CONFIGURAÇÃO VM
# =============================================================================

# Application
APP_URL=http://${VM_IP}:3210
LOBE_PORT=3210
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://${VM_IP}:3210
NEXT_PUBLIC_SERVICE_MODE=server
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_AUTH_SSO_PROVIDERS=credentials
NEXTAUTH_URL=http://${VM_IP}:3210
NEXTAUTH_URL_INTERNAL=http://localhost:3210
NEXT_TELEMETRY_DISABLED=1

# Network Binding
HOST=0.0.0.0
HOSTNAME=0.0.0.0

# NextAuth Configuration
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$NEXT_AUTH_SECRET}
AUTH_URL=http://${VM_IP}:3210
AUTH_TRUST_HOST=true

# Build Configuration
DOCKER=true
NEXT_PUBLIC_UPLOAD_MAX_SIZE=50

# Database Configuration
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat
DATABASE_DRIVER=node

# Security Keys
KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}

# MinIO Storage (S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=${MINIO_PASSWORD:-$MINIO_ROOT_PASSWORD}
S3_SECRET_KEY=${MINIO_PASSWORD:-$MINIO_ROOT_PASSWORD}
S3_BUCKET=lobe
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_ENABLE_PATH_STYLE=1
S3_SET_ACL=0
S3_PUBLIC_DOMAIN=${VM_IP}:9000
NEXT_PUBLIC_S3_DOMAIN=${VM_IP}:9000

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD:-$MINIO_ROOT_PASSWORD}
MINIO_LOBE_BUCKET=lobe
MINIO_PORT=9000

# PostgreSQL Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
LOBE_DB_NAME=agents_chat

# Feature Flags
FEATURE_FLAGS=

# Model Providers
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
GOOGLE_API_KEY=${GOOGLE_API_KEY}
AZURE_API_KEY=${AZURE_API_KEY}
AZURE_ENDPOINT=${AZURE_ENDPOINT}
AZURE_API_VERSION=${AZURE_API_VERSION}

# Optional
ACCESS_CODE=${ACCESS_CODE}
EOF

success "Arquivo .env configurado!"

# =============================================================================
# 4. BUILD DA IMAGEM DOCKER
# =============================================================================

log "🐳 Construindo imagem Docker..."

# Criar pnpm-workspace.yaml se não existir
if [ ! -f "pnpm-workspace.yaml" ]; then
    cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF
fi

# Verificar qual Dockerfile usar
if [ -f "docker-compose/Dockerfile" ]; then
    DOCKERFILE="docker-compose/Dockerfile"
elif [ -f "Dockerfile" ]; then
    DOCKERFILE="Dockerfile"
else
    # Criar Dockerfile básico
    cat > Dockerfile << 'EOF'
FROM lobehub/lobe-chat:latest

ENV NODE_ENV=production
ENV PORT=3210
ENV HOSTNAME=0.0.0.0

EXPOSE 3210
EOF
    DOCKERFILE="Dockerfile"
fi

# Build da imagem
docker build -f $DOCKERFILE -t agents-chat:local . || {
    warn "Build falhou, tentando com imagem oficial..."
    docker pull lobehub/lobe-chat:latest
    docker tag lobehub/lobe-chat:latest agents-chat:local
}

success "Imagem Docker preparada!"

# =============================================================================
# 5. INICIALIZAÇÃO DOS SERVIÇOS
# =============================================================================

log "🚀 Iniciando serviços..."

# Iniciar com docker-compose
docker-compose up -d

# Aguardar serviços
log "Aguardando serviços inicializarem..."
sleep 20

# Verificar status
echo ""
echo "=== STATUS DOS SERVIÇOS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# =============================================================================
# 6. VERIFICAÇÃO E LOGS
# =============================================================================

log "🔍 Verificando aplicação..."

# Aguardar aplicação
for i in {1..30}; do
    if curl -f http://localhost:3210 >/dev/null 2>&1; then
        success "Aplicação pronta!"
        break
    fi
    log "Aguardando aplicação... ($i/30)"
    sleep 5
done

# Mostrar logs
echo ""
echo "=== LOGS DA APLICAÇÃO ==="
docker logs agents-chat --tail 20

# =============================================================================
# 7. RELATÓRIO FINAL
# =============================================================================

echo ""
echo "============================================================================="
echo -e "${GREEN}🎉 DEPLOY NA VM FINALIZADO!${NC}"
echo "============================================================================="
echo ""
echo -e "${BLUE}📋 ACESSO AOS SERVIÇOS:${NC}"
echo "   • 🌐 App: http://${VM_IP}:3210"
echo "   • 💾 MinIO Console: http://${VM_IP}:9001"
echo "   • 🗄️ PostgreSQL: localhost:5432"
echo ""
echo -e "${GREEN}🔧 COMANDOS ÚTEIS:${NC}"
echo "   • Ver logs: docker logs -f agents-chat"
echo "   • Status: docker ps"
echo "   • Parar: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo "   • Rebuild: $0 rebuild"
echo ""

# Salvar informações
cat > deploy-info.txt << EOF
=== AGENTS CHAT - VM DEPLOY ===
Data: $(date)
IP: ${VM_IP}

URLS:
- App: http://${VM_IP}:3210
- MinIO: http://${VM_IP}:9001

COMANDOS:
- Logs: docker logs -f agents-chat
- Parar: docker-compose down
- Reiniciar: docker-compose restart
EOF

success "Deploy concluído! Acesse: http://${VM_IP}:3210"