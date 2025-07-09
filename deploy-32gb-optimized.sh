#!/bin/bash

# ============================================================================
# DEPLOY OTIMIZADO PARA 32GB RAM - AGENTS CHAT
# Performance máxima para servidores com 32GB de RAM
# ============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

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

highlight() {
    echo -e "${PURPLE}[32GB OPTIMIZED] $1${NC}"
}

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

# Verificar memória disponível
TOTAL_RAM=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$TOTAL_RAM" -lt 30000 ]; then
    warn "Memória disponível: ${TOTAL_RAM}MB. Recomendado: 32GB+"
fi

highlight "Iniciando deploy otimizado para 32GB RAM..."

echo "============================================================================="
echo -e "${GREEN}🚀 DEPLOY AGENTS CHAT - OTIMIZADO PARA 32GB RAM${NC}"
echo "============================================================================="

# =============================================================================
# 1. CONFIGURAÇÃO INICIAL DO SISTEMA
# =============================================================================

log "🔧 Configurando sistema para alta performance..."

# Otimizar kernel para alta performance
echo "# Otimizações para 32GB RAM" >> /etc/sysctl.conf
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.dirty_ratio=15" >> /etc/sysctl.conf
echo "vm.dirty_background_ratio=5" >> /etc/sysctl.conf
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
echo "net.core.rmem_max=16777216" >> /etc/sysctl.conf
echo "net.core.wmem_max=16777216" >> /etc/sysctl.conf
sysctl -p

# Atualizar sistema
apt update && apt upgrade -y
apt install -y curl wget git htop unzip build-essential software-properties-common

# Configurar timezone
timedatectl set-timezone America/Sao_Paulo

# Configurar firewall
ufw allow OpenSSH
ufw allow 3210/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

success "Sistema otimizado para alta performance!"

# =============================================================================
# 2. INSTALAÇÃO DO DOCKER COM OTIMIZAÇÕES
# =============================================================================

log "🐳 Instalando Docker com otimizações para 32GB RAM..."

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configurar Docker para usar máximo de recursos
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
  "max-concurrent-downloads": 20,
  "max-concurrent-uploads": 20,
  "default-ulimits": {
    "nofile": {
      "hard": 65536,
      "soft": 65536
    }
  },
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF

systemctl restart docker
systemctl enable docker

success "Docker instalado com otimizações para 32GB RAM!"

# =============================================================================
# 3. INSTALAÇÃO DO NODE.JS OTIMIZADO
# =============================================================================

log "🟢 Instalando Node.js otimizado para 32GB RAM..."

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Configurar Node.js para usar máximo de memória
echo 'export NODE_OPTIONS="--max-old-space-size=28672 --optimize-for-size --gc-interval=100"' >> /etc/environment
export NODE_OPTIONS="--max-old-space-size=28672 --optimize-for-size --gc-interval=100"

# Instalar PNPM com configurações otimizadas
npm install -g pnpm@latest

# Configurar PNPM para usar mais recursos
pnpm config set store-dir /tmp/pnpm-store
pnpm config set cache-dir /tmp/pnpm-cache
pnpm config set verify-store-integrity false
pnpm config set package-import-method copy
pnpm config set network-concurrency 20

success "Node.js otimizado para 32GB RAM!"

# =============================================================================
# 4. CLONAGEM E CONFIGURAÇÃO DO PROJETO
# =============================================================================

log "📁 Clonando projeto com otimizações..."

mkdir -p /opt/agents-chat
cd /opt/agents-chat

# Clonar com configurações otimizadas
git clone --depth 1 --single-branch https://github.com/lobehub/lobe-chat.git .

success "Projeto clonado!"

# =============================================================================
# 5. CONFIGURAÇÃO DO AMBIENTE OTIMIZADO
# =============================================================================

log "⚙️ Configurando ambiente para máxima performance..."

# Criar .env otimizado para 32GB RAM
cat > .env << 'EOF'
# =============================================================================
# CONFIGURAÇÃO OTIMIZADA PARA 32GB RAM - AGENTS CHAT
# =============================================================================

NODE_ENV=production
PORT=3210

# Performance Optimization (32GB RAM)
NODE_OPTIONS=--max-old-space-size=28672 --optimize-for-size --gc-interval=100
NEXT_TELEMETRY_DISABLED=1
UV_THREADPOOL_SIZE=128
LIBUV_THREAD_COUNT=16

# Build Optimizations
NEXT_STANDALONE=true
NEXT_SHARP_PATH=/tmp
BODY_SIZE_LIMIT=50mb
NEXT_PUBLIC_UPLOAD_MAX_SIZE=50

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

# Model Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# MinIO Storage (S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minio-super-secret-password-123
S3_SECRET_KEY=minio-super-secret-password-123
S3_BUCKET=lobe
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minio-super-secret-password-123
MINIO_LOBE_BUCKET=lobe
MINIO_PORT=9000

# Security
ACCESS_CODE=

EOF

# Gerar secrets seguros
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXT_AUTH_SECRET=$(openssl rand -hex 32)
MINIO_PASSWORD=$(openssl rand -hex 16)

sed -i "s/KEY_VAULTS_SECRET=change-this-secret-key-in-production/KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}/" .env
sed -i "s/NEXT_AUTH_SECRET=change-this-nextauth-secret-in-production/NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}/" .env
sed -i "s/minio-super-secret-password-123/${MINIO_PASSWORD}/g" .env

success "Ambiente configurado para máxima performance!"

# =============================================================================
# 6. INSTALAÇÃO OTIMIZADA DE DEPENDÊNCIAS
# =============================================================================

log "📦 Instalando dependências com otimizações para 32GB RAM..."

# Configurar variáveis de ambiente para build
export NODE_OPTIONS="--max-old-space-size=28672 --optimize-for-size --gc-interval=100"
export UV_THREADPOOL_SIZE=128
export LIBUV_THREAD_COUNT=16

# Limpar cache existente
rm -rf node_modules
rm -rf .pnpm-store
rm -rf pnpm-lock.yaml

# Instalar dependências com configurações otimizadas
pnpm install --no-frozen-lockfile --prefer-offline

success "Dependências instaladas com otimizações!"

# =============================================================================
# 7. BUILD OTIMIZADO DA APLICAÇÃO
# =============================================================================

log "🔨 Executando build otimizado para 32GB RAM..."

# Configurar variáveis para build de alta performance
export DOCKER=true
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=28672 --optimize-for-size --gc-interval=100"
export NEXT_TELEMETRY_DISABLED=1
export UV_THREADPOOL_SIZE=128
export LIBUV_THREAD_COUNT=16

# Limpar builds anteriores
rm -rf .next out

# Build otimizado
highlight "Executando build com todas as otimizações..."
pnpm run build:docker

# Verificar build
if [ -d ".next/standalone" ]; then
    success "Build otimizado concluído!"

    # Estatísticas do build
    BUILD_SIZE=$(du -sh .next/standalone | cut -f1)
    STATIC_SIZE=$(du -sh .next/static | cut -f1)
    highlight "Build Size: ${BUILD_SIZE}, Static Size: ${STATIC_SIZE}"
else
    error "Build falhou!"
fi

# =============================================================================
# 8. BUILD OTIMIZADO DA IMAGEM DOCKER
# =============================================================================

log "🐳 Criando imagem Docker otimizada..."

# Build da imagem com otimizações
DOCKER_BUILDKIT=1 docker build \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --build-arg NODE_OPTIONS="--max-old-space-size=28672" \
    -f docker-compose/Dockerfile.prebuilt \
    -t agents-chat:32gb-optimized .

if docker images | grep -q "agents-chat.*32gb-optimized"; then
    success "Imagem Docker otimizada criada!"

    # Mostrar tamanho da imagem
    IMAGE_SIZE=$(docker images agents-chat:32gb-optimized --format "{{.Size}}")
    highlight "Tamanho da imagem: ${IMAGE_SIZE}"
else
    error "Falha ao criar imagem Docker!"
fi

# =============================================================================
# 9. CONFIGURAÇÃO DO BANCO DE DADOS OTIMIZADO
# =============================================================================

log "🗄️ Configurando PostgreSQL otimizado para 32GB RAM..."

# Criar docker-compose otimizado para 32GB RAM
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

  minio:
    image: minio/minio:latest
    container_name: agents-chat-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minio-super-secret-password-123
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
      mc alias set myminio http://minio:9000 minioadmin minio-super-secret-password-123;
      if ! mc ls myminio/lobe > /dev/null 2>&1; then
        echo 'Creating bucket lobe...';
        mc mb myminio/lobe;
        mc anonymous set download myminio/lobe;
        echo 'Bucket lobe created successfully!';
      else
        echo 'Bucket lobe already exists';
      fi;
      exit 0;
      "
    networks:
      - agents-network

volumes:
  postgres_data:
  minio_data:

networks:
  agents-network:
    driver: bridge
EOF

# Atualizar senhas no docker-compose.db.yml
sed -i "s/minio-super-secret-password-123/${MINIO_PASSWORD}/g" docker-compose.db.yml

# Iniciar banco e MinIO otimizados
docker-compose -f docker-compose.db.yml up -d

log "Aguardando PostgreSQL e MinIO inicializarem..."
sleep 30

# Aguardar PostgreSQL
log "Verificando PostgreSQL..."
until docker exec agents-chat-postgres pg_isready -U postgres; do
    log "PostgreSQL ainda inicializando..."
    sleep 5
done

# Aguardar MinIO
log "Verificando MinIO..."
until curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; do
    log "MinIO ainda inicializando..."
    sleep 5
done

success "PostgreSQL e MinIO otimizados para 32GB RAM configurados!"

# =============================================================================
# 10. EXECUÇÃO OTIMIZADA DA APLICAÇÃO
# =============================================================================

log "🚀 Iniciando aplicação com otimizações para 32GB RAM..."

# Parar container anterior
docker stop agents-chat 2>/dev/null || true
docker rm agents-chat 2>/dev/null || true

# Executar com otimizações para 32GB RAM
docker run -d \
  --name agents-chat \
  --restart unless-stopped \
  -p 3210:3210 \
  --env-file .env \
  --network host \
  --memory="16g" \
  --memory-swap="20g" \
  --cpus="6" \
  --shm-size="4g" \
  --ulimit nofile=65536:65536 \
  agents-chat:32gb-optimized

log "Aguardando aplicação otimizada inicializar..."
sleep 20

success "Aplicação iniciada com otimizações para 32GB RAM!"

# =============================================================================
# 11. VERIFICAÇÃO E MONITORAMENTO
# =============================================================================

log "🔍 Verificando performance otimizada..."

echo ""
echo "=== CONTAINERS OTIMIZADOS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== USO DE RECURSOS ==="
docker stats --no-stream

echo ""
echo "=== LOGS DA APLICAÇÃO ==="
docker logs agents-chat --tail 15

# Teste de performance
if curl -f http://localhost:3210 >/dev/null 2>&1; then
    success "Aplicação otimizada funcionando!"
else
    warn "Aplicação ainda inicializando..."
fi

# =============================================================================
# 12. RELATÓRIO FINAL
# =============================================================================

echo ""
echo "============================================================================="
echo -e "${GREEN}🎉 DEPLOY OTIMIZADO PARA 32GB RAM CONCLUÍDO!${NC}"
echo "============================================================================="
echo ""
echo -e "${PURPLE}📊 OTIMIZAÇÕES APLICADAS:${NC}"
echo "   • Node.js: 28GB heap size"
echo "   • PostgreSQL: 8GB shared_buffers, 24GB effective_cache_size"
echo "   • MinIO: 2GB memory limit, bucket 'lobe' criado automaticamente"
echo "   • Docker: 16GB memory limit, 6 CPUs, 4GB shm-size"
echo "   • Sistema: Kernel otimizado, ulimits aumentados"
echo ""
echo -e "${BLUE}📋 INFORMAÇÕES:${NC}"
echo "   • App URL: http://$(curl -s ipinfo.io/ip):3210"
echo "   • MinIO Console: http://$(curl -s ipinfo.io/ip):9001"
echo "   • Container: agents-chat (32GB optimized)"
echo "   • Database: agents-chat-postgres (32GB optimized)"
echo "   • Storage: agents-chat-minio (2GB optimized)"
echo ""
echo -e "${GREEN}🔧 COMANDOS OTIMIZADOS:${NC}"
echo "   • Monitorar: docker logs -f agents-chat"
echo "   • Stats: docker stats"
echo "   • Reiniciar: docker restart agents-chat"
echo "   • Performance: htop"
echo ""
echo -e "${YELLOW}🔐 CREDENCIAIS MinIO:${NC}"
echo "   • Usuário: minioadmin"
echo "   • Senha: ${MINIO_PASSWORD}"
echo "   • Bucket: lobe (criado automaticamente)"
echo ""
echo -e "${YELLOW}⚡ PERFORMANCE MONITORING:${NC}"
echo "   • Memória total: $(free -h | grep Mem | awk '{print $2}')"
echo "   • Containers: $(docker ps | wc -l) running"
echo "   • Build time: ~5-10 minutos (otimizado)"
echo ""

# Criar script de monitoramento otimizado
cat > /opt/agents-chat/monitor-32gb.sh << 'EOF'
#!/bin/bash

echo "=== MONITORAMENTO OTIMIZADO PARA 32GB RAM ==="
echo "=============================================="

echo "🖥️  RECURSOS DO SISTEMA:"
free -h | grep -E "(Mem|Swap)"
echo ""

echo "🐳 CONTAINERS:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "📊 PERFORMANCE:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

echo "📋 LOGS RECENTES:"
docker logs agents-chat --tail 10
echo ""

echo "🔍 HEALTH CHECK:"
curl -f http://localhost:3210/api/health 2>/dev/null && echo "✅ API OK" || echo "❌ API Down"
curl -f http://localhost:9000/minio/health/live 2>/dev/null && echo "✅ MinIO OK" || echo "❌ MinIO Down"
EOF

chmod +x /opt/agents-chat/monitor-32gb.sh

success "Script de monitoramento otimizado criado!"

highlight "Deploy otimizado para 32GB RAM finalizado! 🚀"
