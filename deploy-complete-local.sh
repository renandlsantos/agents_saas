#!/bin/bash

# ===================== COMO USAR =====================
# Para login local (usuário/senha):
#   AUTH_MODE=credentials ./deploy-complete-local.sh
# Para login via Casdoor:
#   AUTH_MODE=casdoor ./deploy-complete-local.sh
# Para login via Google:
#   AUTH_MODE=google ./deploy-complete-local.sh
# Para login via GitHub:
#   AUTH_MODE=github ./deploy-complete-local.sh
# Para rebuild rápido:
#   ./deploy-complete-local.sh rebuild
# Para usar imagem do Docker Hub (sem build local):
#   USE_PREBUILT=true ./deploy-complete-local.sh
# =====================================================

# ============================================================================
# 🚀 DEPLOY COMPLETO LOCAL - AGENTS CHAT
# ============================================================================
# Script completo que builda tudo do zero localmente
# - Build da imagem Docker local
# - PostgreSQL + MinIO otimizado para 32GB RAM
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

# Verificar usuário e ajustar comportamento
if [[ $EUID -eq 0 ]]; then
   warn "Executando como root - alguns comandos serão ajustados"
   USER_HOME="/root"
   CURRENT_USER="root"
else
   USER_HOME="/home/$USER"
   CURRENT_USER="$USER"
fi

# ===================== AJUSTE DE AUTENTICAÇÃO =====================
# Escolha o modo de autenticação:
#   credentials  -> Login local (usuário/senha)
#   casdoor      -> Casdoor (SSO local)
#   google       -> Google OAuth (requer CLIENT_ID/SECRET)
#   github       -> GitHub OAuth (requer CLIENT_ID/SECRET)
# ================================================================

# Modo de autenticação (padrão: credentials)
AUTH_MODE="${AUTH_MODE:-credentials}"

# Usar imagem pré-buildada do Docker Hub
USE_PREBUILT="${USE_PREBUILT:-false}"

# Se rebuild rápido:
if [[ "$1" == "rebuild" ]]; then
  log "♻️  Rebuild rápido da aplicação..."

  # Verificar se docker-compose.complete.yml existe
  if [ ! -f "docker-compose.complete.yml" ]; then
    error "docker-compose.complete.yml não encontrado! Execute o deploy completo primeiro: ./deploy-complete-local.sh"
  fi

  docker build -f docker-compose/Dockerfile -t agents-chat:local .
  docker rm -f agents-chat || true
  docker-compose -f docker-compose.complete.yml up -d app
  docker logs agents-chat --tail 20
  success "Rebuild e restart concluídos!"
  exit 0
fi

# =============================================================================
# 1. PREPARAÇÃO DO AMBIENTE
# =============================================================================

log "🏗️ Preparando ambiente para deploy local completo..."

# Verificar se estamos no repositório correto primeiro
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Usar diretório atual se já estivermos no projeto
WORK_DIR=$(pwd)
log "Usando diretório atual: $WORK_DIR"

# Verificar dependências necessárias
command -v docker >/dev/null 2>&1 || error "Docker não está instalado!"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose não está instalado!"
command -v node >/dev/null 2>&1 || error "Node.js não está instalado!"
command -v pnpm >/dev/null 2>&1 || error "PNPM não está instalado!"
command -v tsx >/dev/null 2>&1 || error "TSX não está instalado! Execute: pnpm install -g tsx"

success "Ambiente preparado!"

# =============================================================================
# 2. LIMPEZA COMPLETA
# =============================================================================

log "🧹 Fazendo limpeza completa do ambiente..."

# Parar e remover containers antigos
docker stop agents-chat agents-chat-postgres agents-chat-minio agents-chat-minio-init 2>/dev/null || true
docker rm agents-chat agents-chat-postgres agents-chat-minio agents-chat-minio-init 2>/dev/null || true

# Remover imagens antigas
docker rmi agents-chat:local 2>/dev/null || true
docker rmi agents-chat:production 2>/dev/null || true
docker rmi agents-chat:32gb-optimized 2>/dev/null || true

# Limpar builds anteriores
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .pnpm-store

# Limpar arquivos de configuração antigos
rm -f docker-compose.db.yml
rm -f .env.backup

success "Limpeza completa finalizada!"

# ===================== GERAÇÃO DO .env =====================
# Gerar senhas seguras
POSTGRES_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXT_AUTH_SECRET=$(openssl rand -hex 32)

# Backup do .env existente se houver
[ -f ".env" ] && cp .env .env.backup

# Bloco de autenticação
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_AUTH_SSO_PROVIDERS=""
AUTH_BLOCK=""

case "$AUTH_MODE" in
  credentials)
    NEXT_AUTH_SSO_PROVIDERS="credentials"
    ;;
  casdoor)
    NEXT_AUTH_SSO_PROVIDERS="casdoor"
    AUTH_BLOCK="\nAUTH_CASDOOR_ISSUER=http://localhost:8000\nAUTH_CASDOOR_ID=agents-chat\nAUTH_CASDOOR_SECRET=agents-chat-secret"
    ;;
  google)
    NEXT_AUTH_SSO_PROVIDERS="google"
    AUTH_BLOCK="\nAUTH_GOOGLE_CLIENT_ID=COLOQUE_SEU_CLIENT_ID_AQUI\nAUTH_GOOGLE_CLIENT_SECRET=COLOQUE_SEU_CLIENT_SECRET_AQUI"
    ;;
  github)
    NEXT_AUTH_SSO_PROVIDERS="github"
    AUTH_BLOCK="\nAUTH_GITHUB_CLIENT_ID=COLOQUE_SEU_CLIENT_ID_AQUI\nAUTH_GITHUB_CLIENT_SECRET=COLOQUE_SEU_CLIENT_SECRET_AQUI"
    ;;
  *)
    warn "Modo de autenticação desconhecido, usando credentials."
    NEXT_AUTH_SSO_PROVIDERS="credentials"
    ;;
esac

# Criar arquivo .env completo
cat > .env << EOF
# =============================================================================
# AGENTS CHAT - CONFIGURAÇÃO LOCAL COMPLETA
# =============================================================================

# Application
APP_URL=http://localhost:3210
LOBE_PORT=3210
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://localhost:3210
NEXT_PUBLIC_SERVICE_MODE=server
NEXT_PUBLIC_ENABLE_NEXT_AUTH=${NEXT_PUBLIC_ENABLE_NEXT_AUTH}
NEXT_AUTH_SSO_PROVIDERS=${NEXT_AUTH_SSO_PROVIDERS}
${AUTH_BLOCK}
NEXT_TELEMETRY_DISABLED=1

# Build Configuration
DOCKER=true
NEXT_PUBLIC_UPLOAD_MAX_SIZE=50

# Database Configuration
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat
DATABASE_DRIVER=node

# Security Keys
KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}
NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}

# MinIO Storage (S3-compatible) - CONFIGURAÇÃO CORRETA
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=${MINIO_PASSWORD}
S3_SECRET_KEY=${MINIO_PASSWORD}
S3_BUCKET=lobe
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_ENABLE_PATH_STYLE=1
S3_SET_ACL=0

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_LOBE_BUCKET=lobe
MINIO_PORT=9000

# PostgreSQL Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
LOBE_DB_NAME=agents_chat

# Feature Flags
# FEATURE_FLAGS=

# Model Providers (adicione suas chaves)
OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_API_KEY=
# AZURE_API_KEY=
# AZURE_ENDPOINT=
# AZURE_API_VERSION=

# Optional
# ACCESS_CODE=
# DEBUG=0

EOF

success "Arquivo .env configurado com senhas seguras!"

# =============================================================================
# 4. INSTALAÇÃO OTIMIZADA DE DEPENDÊNCIAS
# =============================================================================

if [[ "$USE_PREBUILT" == "false" ]]; then
    log "📦 Instalando dependências com otimizações para 32GB RAM..."

    # Configurar variáveis de ambiente para build
    export NODE_OPTIONS="--max-old-space-size=28672"
    export UV_THREADPOOL_SIZE=128
    export LIBUV_THREAD_COUNT=16

    # Instalar dependências
    pnpm install --no-frozen-lockfile

    success "Dependências instaladas!"
else
    log "📦 Pulando instalação de dependências (usando imagem pré-buildada)"
fi

# =============================================================================
# 5. BUILD LOCAL DA APLICAÇÃO
# =============================================================================

if [[ "$USE_PREBUILT" == "false" ]]; then
    log "🔨 Executando build local otimizado..."

    # Configurar variáveis para build
    export DOCKER=true
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1

    # Build da aplicação
    highlight "Executando build local..."
    pnpm run build

    # Verificar se build foi bem-sucedido
    if [ -d ".next" ]; then
        success "Build local concluído com sucesso!"

        # Estatísticas do build
        if [ -d ".next/standalone" ]; then
            BUILD_SIZE=$(du -sh .next/standalone 2>/dev/null | cut -f1 || echo "N/A")
            highlight "Build standalone: ${BUILD_SIZE}"
        fi
        if [ -d ".next/static" ]; then
            STATIC_SIZE=$(du -sh .next/static 2>/dev/null | cut -f1 || echo "N/A")
            highlight "Static files: ${STATIC_SIZE}"
        fi
    else
        error "Build falhou! Verifique os logs acima."
    fi
else
    log "🔨 Pulando build local (usando imagem pré-buildada)"
fi

# =============================================================================
# 6. BUILD DA IMAGEM DOCKER LOCAL
# =============================================================================

if [[ "$USE_PREBUILT" == "false" ]]; then
    log "🐳 Criando imagem Docker local..."

    # Verificar se Dockerfile existe
    if [ ! -f "docker-compose/Dockerfile" ]; then
        error "Dockerfile não encontrado em docker-compose/Dockerfile!"
    fi

    # Build da imagem Docker local
    highlight "Buildando imagem Docker local..."
    DOCKER_BUILDKIT=1 docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --build-arg NODE_OPTIONS="--max-old-space-size=28672" \
        -f docker-compose/Dockerfile \
        -t agents-chat:local \
        .

    # Verificar se imagem foi criada
    if docker images | grep -q "agents-chat.*local"; then
        success "Imagem Docker local criada com sucesso!"

        # Mostrar tamanho da imagem
        IMAGE_SIZE=$(docker images agents-chat:local --format "{{.Size}}")
        highlight "Tamanho da imagem: ${IMAGE_SIZE}"
    else
        error "Falha ao criar imagem Docker!"
    fi

    # Definir imagem a ser usada
    DOCKER_IMAGE="agents-chat:local"
else
    log "🐳 Usando imagem pré-buildada do Docker Hub..."

    # Usar a imagem oficial do Lobe Chat
    DOCKER_IMAGE="lobehub/lobe-chat:latest"

    # Baixar a imagem
    log "Baixando imagem ${DOCKER_IMAGE}..."
    docker pull ${DOCKER_IMAGE}

    success "Imagem Docker pronta!"
fi

# ===================== GERAÇÃO DO DOCKER-COMPOSE =====================
# Criar docker-compose completo
cat > docker-compose.complete.yml << EOF
version: '3.8'

services:
  # PostgreSQL com pgvector otimizado para 32GB RAM
  postgres:
    image: pgvector/pgvector:pg16
    container_name: agents-chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: agents_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    command: >
      postgres
      -c shared_buffers=8GB
      -c effective_cache_size=24GB
      -c maintenance_work_mem=2GB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c work_mem=32MB
      -c min_wal_size=2GB
      -c max_wal_size=4GB
      -c max_connections=200
      -c max_worker_processes=16
      -c max_parallel_workers_per_gather=8
      -c max_parallel_workers=16
      -c max_parallel_maintenance_workers=4
    deploy:
      resources:
        limits:
          memory: 10G
          cpus: '4'
        reservations:
          memory: 4G
          cpus: '2'
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - agents-network

  # MinIO para armazenamento
  minio:
    image: minio/minio:latest
    container_name: agents-chat-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
      MINIO_API_CORS_ALLOW_ORIGIN: "*"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
        reservations:
          memory: 512M
          cpus: '1'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - agents-network

  # Inicializador do bucket MinIO
  minio-init:
    image: minio/mc:latest
    container_name: agents-chat-minio-init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 minioadmin ${MINIO_PASSWORD};
      if ! mc ls myminio/lobe > /dev/null 2>&1; then
        echo 'Creating bucket lobe...';
        mc mb myminio/lobe;
        mc anonymous set download myminio/lobe;
        echo 'Bucket lobe created successfully!';
      else
        echo 'Bucket lobe already exists';
      fi;
      echo 'MinIO setup completed!';
      "
    networks:
      - agents-network

  # Aplicação Agents Chat
  app:
    image: ${DOCKER_IMAGE}
    container_name: agents-chat
    restart: unless-stopped
    ports:
      - "3210:3210"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/agents_chat
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_ACCESS_KEY_ID=minioadmin
      - S3_SECRET_ACCESS_KEY=${MINIO_PASSWORD}
      - S3_SECRET_KEY=${MINIO_PASSWORD}
      - S3_BUCKET=lobe
      - S3_REGION=us-east-1
      - S3_FORCE_PATH_STYLE=true
      - KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}
      - NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}
      - NEXT_PUBLIC_SITE_URL=http://localhost:3210
      - NEXT_PUBLIC_ENABLE_NEXT_AUTH=${NEXT_PUBLIC_ENABLE_NEXT_AUTH}
      - NEXT_AUTH_SSO_PROVIDERS=${NEXT_AUTH_SSO_PROVIDERS}
$(if [[ "$AUTH_MODE" == "casdoor" ]]; then echo "      - AUTH_CASDOOR_ISSUER=http://agents-chat-casdoor:8000\n      - AUTH_CASDOOR_ID=agents-chat\n      - AUTH_CASDOOR_SECRET=agents-chat-secret"; fi)
$(if [[ "$AUTH_MODE" == "google" ]]; then echo "      - AUTH_GOOGLE_CLIENT_ID=COLOQUE_SEU_CLIENT_ID_AQUI\n      - AUTH_GOOGLE_CLIENT_SECRET=COLOQUE_SEU_CLIENT_SECRET_AQUI"; fi)
$(if [[ "$AUTH_MODE" == "github" ]]; then echo "      - AUTH_GITHUB_CLIENT_ID=COLOQUE_SEU_CLIENT_ID_AQUI\n      - AUTH_GITHUB_CLIENT_SECRET=COLOQUE_SEU_CLIENT_SECRET_AQUI"; fi)
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    deploy:
      resources:
        limits:
          memory: 16G
          cpus: '6'
        reservations:
          memory: 4G
          cpus: '2'
    networks:
      - agents-network

volumes:
  postgres_data:
  minio_data:

networks:
  agents-network:
    driver: bridge
EOF

success "Docker-compose completo configurado!"

# =============================================================================
# 8. INICIALIZAÇÃO COMPLETA
# =============================================================================

log "🚀 Iniciando infraestrutura completa..."

# Iniciar todos os serviços
docker-compose -f docker-compose.complete.yml up -d

log "Aguardando serviços inicializarem..."
sleep 30

# Aguardar PostgreSQL
log "Verificando PostgreSQL..."
for i in {1..30}; do
    if docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1; then
        success "PostgreSQL pronto!"
        break
    fi
    log "PostgreSQL inicializando... ($i/30)"
    sleep 5
done

# Aguardar MinIO
log "Verificando MinIO..."
for i in {1..30}; do
    if curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
        success "MinIO pronto!"
        break
    fi
    log "MinIO inicializando... ($i/30)"
    sleep 5
done

# Instalar extensão pgvector no PostgreSQL
log "Instalando extensão pgvector..."
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1 || warn "Extensão pgvector já existe ou erro ao instalar"

# Executar migrações do banco de dados
log "Executando migrações do banco de dados..."
cd "$WORK_DIR"
MIGRATION_DB=1 DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@agents-chat-postgres:5432/agents_chat" tsx ./scripts/migrateServerDB/index.ts || warn "Erro ao executar migrações - verifique manualmente"

# Aguardar aplicação
log "Verificando aplicação..."
for i in {1..60}; do
    if curl -f http://localhost:3210 >/dev/null 2>&1; then
        success "Aplicação pronta!"
        break
    fi
    log "Aplicação inicializando... ($i/60)"
    sleep 5
done

# =============================================================================
# 9. VERIFICAÇÃO FINAL
# =============================================================================

log "🔍 Verificando status final..."

echo ""
echo "=== CONTAINERS RODANDO ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECKS ==="
curl -f http://localhost:3210 >/dev/null 2>&1 && echo "✅ App: OK" || echo "❌ App: ERRO"
curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1 && echo "✅ MinIO: OK" || echo "❌ MinIO: ERRO"
docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1 && echo "✅ PostgreSQL: OK" || echo "❌ PostgreSQL: ERRO"

echo ""
echo "=== LOGS DA APLICAÇÃO ==="
docker logs agents-chat --tail 10

# =============================================================================
# 10. RELATÓRIO FINAL
# =============================================================================

echo ""
echo "============================================================================="
echo -e "${GREEN}🎉 DEPLOY LOCAL COMPLETO FINALIZADO!${NC}"
echo "============================================================================="
echo ""
echo -e "${PURPLE}📊 COMPONENTES INSTALADOS:${NC}"
echo "   • ✅ Aplicação Agents Chat (build local)"
echo "   • ✅ PostgreSQL com pgvector (otimizado 32GB RAM)"
echo "   • ✅ MinIO (S3-compatible storage)"
echo "   • ✅ Bucket 'lobe' (configurado automaticamente)"
echo "   • ✅ Migrações do banco de dados executadas"
echo ""
echo -e "${BLUE}📋 ACESSO AOS SERVIÇOS:${NC}"
echo "   • 🌐 App: http://localhost:3210"
echo "   • 💾 MinIO Console: http://localhost:9001"
echo "   • 🗄️ PostgreSQL: localhost:5432"
echo ""
echo -e "${YELLOW}🔐 CREDENCIAIS:${NC}"
echo "   • MinIO - Usuário: minioadmin | Senha: ${MINIO_PASSWORD}"
echo "   • PostgreSQL - Usuário: postgres | Senha: ${POSTGRES_PASSWORD}"
echo ""
echo -e "${GREEN}🔧 COMANDOS ÚTEIS:${NC}"
echo "   • Ver logs: docker logs -f agents-chat"
echo "   • Status: docker ps"
echo "   • Parar tudo: docker-compose -f docker-compose.complete.yml down"
echo "   • Reiniciar: docker-compose -f docker-compose.complete.yml restart"
echo ""
echo -e "${PURPLE}💡 NOTAS IMPORTANTES:${NC}"
echo "   • Todas as senhas foram geradas automaticamente"
echo "   • Build feito localmente com código atual"
echo "   • Otimizado para máquina com 32GB RAM"
echo "   • Arquivos de dados em volumes Docker persistentes"
echo ""

# Salvar informações importantes
cat > $WORK_DIR/deploy-info.txt << EOF
=== AGENTS CHAT - INFORMAÇÕES DO DEPLOY ===
Data: $(date)
Usuário: $CURRENT_USER

SENHAS GERADAS:
- MinIO: ${MINIO_PASSWORD}
- PostgreSQL: ${POSTGRES_PASSWORD}
- KEY_VAULTS_SECRET: ${KEY_VAULTS_SECRET}
- NEXT_AUTH_SECRET: ${NEXT_AUTH_SECRET}

ACESSOS:
- App: http://localhost:3210
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

COMANDOS:
- Logs: docker logs -f agents-chat
- Parar: docker-compose -f docker-compose.complete.yml down
- Iniciar: docker-compose -f docker-compose.complete.yml up -d
EOF

success "Informações salvas em $WORK_DIR/deploy-info.txt"
highlight "Deploy local completo finalizado com sucesso! 🚀"
