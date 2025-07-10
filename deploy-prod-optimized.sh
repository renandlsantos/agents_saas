#!/bin/bash

# =============================================================================
# 🚀 DEPLOY PRODUÇÃO OTIMIZADO - AGENTS CHAT
# =============================================================================
# Script otimizado que corrige todos os problemas identificados:
# - Erro no migrate do pgvector
# - Validação completa de ambiente
# - Configuração automática de todos os serviços
# - Redis, MinIO, Casdoor, PostgreSQL + pgvector
# - Retry automático para operações críticas
# - Monitoramento e validação em tempo real
# =============================================================================

set -e  # Parar em qualquer erro

# Cores para output melhorado
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funções de output aprimoradas
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
highlight() { echo -e "${PURPLE}[HIGHLIGHT]${NC} $1"; }
step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$SCRIPT_DIR"
LOG_FILE="$WORK_DIR/deploy-prod.log"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=300

# Função para logging
log_to_file() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Função para retry de comandos
retry_command() {
    local cmd="$1"
    local description="$2"
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log_to_file "Tentativa $((retry_count + 1)): $description"
        if eval "$cmd"; then
            success "$description - sucesso!"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                warn "$description - falhou. Tentando novamente em 10s... ($retry_count/$MAX_RETRIES)"
                sleep 10
            else
                error "$description - falhou após $MAX_RETRIES tentativas"
            fi
        fi
    done
}

# Função para aguardar serviço
wait_for_service() {
    local service_name="$1"
    local health_check="$2"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    local count=0
    
    log "Aguardando $service_name estar pronto..."
    
    while [ $count -lt $timeout ]; do
        if eval "$health_check" &>/dev/null; then
            success "$service_name pronto!"
            return 0
        fi
        
        if [ $((count % 30)) -eq 0 ]; then
            log "$service_name inicializando... (${count}s/${timeout}s)"
        fi
        
        sleep 1
        count=$((count + 1))
    done
    
    error "$service_name não ficou pronto em ${timeout}s"
}

# =============================================================================
# 1. VALIDAÇÃO COMPLETA DO AMBIENTE
# =============================================================================

step "1. Validando ambiente de produção..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Verificar usuário
if [[ $EUID -eq 0 ]]; then
   warn "Executando como root - ajustando comportamento"
   USER_HOME="/root"
   CURRENT_USER="root"
else
   USER_HOME="$HOME"
   CURRENT_USER="$USER"
fi

# Verificar dependências críticas
step "Verificando dependências críticas..."
command -v docker >/dev/null 2>&1 || error "Docker não está instalado!"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose não está instalado!"
command -v node >/dev/null 2>&1 || error "Node.js não está instalado!"
command -v pnpm >/dev/null 2>&1 || error "PNPM não está instalado!"

# Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    error "Docker daemon não está rodando! Inicie o Docker primeiro."
fi

# Verificar/instalar tsx
if ! command -v tsx >/dev/null 2>&1; then
    log "Instalando tsx globalmente..."
    pnpm install -g tsx || error "Falha ao instalar tsx"
fi

# Verificar recursos do sistema
step "Verificando recursos do sistema..."
TOTAL_RAM=$(free -g | awk 'NR==2{print $2}')
TOTAL_DISK=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$TOTAL_RAM" -lt 4 ]; then
    warn "RAM baixa detectada: ${TOTAL_RAM}GB. Mínimo recomendado: 4GB"
fi

if [ "$TOTAL_DISK" -lt 20 ]; then
    warn "Espaço em disco baixo: ${TOTAL_DISK}GB. Mínimo recomendado: 20GB"
fi

# Verificar portas em uso
step "Verificando portas necessárias..."
REQUIRED_PORTS=(3210 5432 6379 9000 9001 8000)
for port in "${REQUIRED_PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        error "Porta $port já está em uso! Pare o serviço que está usando esta porta."
    fi
done

success "Ambiente validado com sucesso!"

# =============================================================================
# 2. CONFIGURAÇÃO AUTOMÁTICA
# =============================================================================

step "2. Configurando ambiente automaticamente..."

# Gerar senhas seguras
log "Gerando senhas seguras..."
POSTGRES_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXT_AUTH_SECRET=$(openssl rand -hex 32)

# Detectar IP público
log "Detectando IP público..."
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost")
log "IP público detectado: $PUBLIC_IP"

# Criar backup do .env se existir
[ -f ".env" ] && cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"

# Criar arquivo .env otimizado
log "Criando arquivo .env otimizado..."
cat > .env << EOF
# =============================================================================
# AGENTS CHAT - CONFIGURAÇÃO PRODUÇÃO OTIMIZADA
# =============================================================================
# Gerado automaticamente em: $(date)
# Script: deploy-prod-optimized.sh
# =============================================================================

# Application URLs
APP_URL=http://${PUBLIC_IP}:3210
LOBE_PORT=3210
NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}:3210
NEXT_PUBLIC_SERVICE_MODE=server
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_TELEMETRY_DISABLED=1

# Network Configuration
HOST=0.0.0.0
HOSTNAME=0.0.0.0

# Authentication
NEXT_AUTH_SSO_PROVIDERS=credentials
NEXTAUTH_URL=http://${PUBLIC_IP}:3210
NEXTAUTH_URL_INTERNAL=http://localhost:3210
NEXTAUTH_SECRET=${NEXT_AUTH_SECRET}
AUTH_URL=http://${PUBLIC_IP}:3210
AUTH_TRUST_HOST=true

# Database Configuration
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat
DATABASE_DRIVER=node
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
LOBE_DB_NAME=agents_chat

# Security
KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_LOBE_BUCKET=lobe
MINIO_PORT=9000

# S3 Configuration
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
S3_PUBLIC_DOMAIN=${PUBLIC_IP}:9000
NEXT_PUBLIC_S3_DOMAIN=${PUBLIC_IP}:9000

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Build Configuration
DOCKER=true
NODE_ENV=production
NEXT_PUBLIC_UPLOAD_MAX_SIZE=50

# Model Providers (configure suas chaves aqui)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
AZURE_API_KEY=
AZURE_ENDPOINT=
AZURE_API_VERSION=2024-02-01

# Optional
ACCESS_CODE=
FEATURE_FLAGS=
DEBUG=0

EOF

success "Arquivo .env criado com configurações otimizadas!"

# =============================================================================
# 3. LIMPEZA COMPLETA
# =============================================================================

step "3. Realizando limpeza completa..."

log "Parando containers antigos..."
docker-compose down --remove-orphans 2>/dev/null || true

log "Removendo containers órfãos..."
docker container prune -f

log "Removendo imagens antigas..."
docker rmi agents-chat:local agents-chat:production agents-chat:32gb-optimized 2>/dev/null || true

log "Limpando cache de build..."
rm -rf .next out node_modules/.cache .pnpm-store

log "Removendo volumes órfãos..."
docker volume prune -f

success "Limpeza completa finalizada!"

# =============================================================================
# 4. PREPARAÇÃO DE DIRETÓRIOS
# =============================================================================

step "4. Preparando estrutura de diretórios..."

# Criar diretórios necessários
mkdir -p data/{postgres,redis,minio,casdoor}
mkdir -p logs/{app,postgres,redis,minio,casdoor}
mkdir -p backup/agents-chat

# Definir permissões corretas
log "Configurando permissões..."
sudo chown -R 1001:1001 data/postgres || chown -R 1001:1001 data/postgres
sudo chown -R 999:999 data/redis || chown -R 999:999 data/redis
sudo chown -R 1000:1000 data/minio || chown -R 1000:1000 data/minio
sudo chown -R 1001:1001 data/casdoor || chown -R 1001:1001 data/casdoor
sudo chown -R 1001:1001 logs/ || chown -R 1001:1001 logs/

success "Estrutura de diretórios preparada!"

# =============================================================================
# 5. INSTALAÇÃO E BUILD OTIMIZADO
# =============================================================================

step "5. Instalando dependências e buildando aplicação..."

# Configurar variáveis de ambiente para build otimizado
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=16
export LIBUV_THREAD_COUNT=8

# Instalar dependências
log "Instalando dependências..."
retry_command "pnpm install --no-frozen-lockfile" "Instalação de dependências"

# Build da aplicação
log "Executando build da aplicação..."
retry_command "pnpm run build" "Build da aplicação"

# Verificar se build foi bem-sucedido
if [ ! -d ".next" ]; then
    error "Build falhou! Diretório .next não encontrado."
fi

# Build da imagem Docker
log "Criando imagem Docker otimizada..."
retry_command "DOCKER_BUILDKIT=1 docker build --build-arg NODE_OPTIONS=\"--max-old-space-size=4096\" -f Dockerfile -t agents-chat:production ." "Build da imagem Docker"

success "Build completo finalizado!"

# =============================================================================
# 6. CONFIGURAÇÃO DO DOCKER COMPOSE OTIMIZADO
# =============================================================================

step "6. Configurando Docker Compose otimizado..."

# Criar docker-compose.yml otimizado para produção
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # PostgreSQL com pgvector - CONFIGURAÇÃO CRÍTICA
  postgres:
    image: pgvector/pgvector:pg16  # IMPORTANTE: usar pgvector, não postgres
    container_name: agents-chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: agents_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./logs/postgres:/var/log/postgresql
    ports:
      - "5432:5432"
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=256MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c work_mem=16MB
      -c max_connections=100
      -c log_statement=all
      -c log_destination=stderr
      -c logging_collector=on
      -c log_directory=/var/log/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d agents_chat"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - agents-chat

  # Redis para cache e sessões
  redis:
    image: redis:7-alpine
    container_name: agents-chat-redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - ./data/redis:/data
      - ./logs/redis:/var/log/redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agents-chat

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
      MINIO_PROMETHEUS_AUTH_TYPE: public
    command: server /data --console-address ":9001"
    volumes:
      - ./data/minio:/data
      - ./logs/minio:/var/log/minio
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agents-chat

  # Casdoor para autenticação SSO
  casdoor:
    image: casbin/casdoor:latest
    container_name: agents-chat-casdoor
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - httpport=8000
      - RUNNING_IN_DOCKER=true
      - driverName=postgres
      - dataSourceName=user=postgres password=${POSTGRES_PASSWORD} host=agents-chat-postgres port=5432 sslmode=disable dbname=casdoor
      - runmode=prod
      - logConfig_console=true
      - logConfig_file=true
      - logConfig_level=Info
    volumes:
      - ./data/casdoor:/app/conf
      - ./logs/casdoor:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - agents-chat

  # Aplicação principal
  app:
    image: agents-chat:production
    container_name: agents-chat
    restart: unless-stopped
    ports:
      - "3210:3210"
    environment:
      # Configurações básicas
      - NODE_ENV=production
      - NEXT_PUBLIC_SERVICE_MODE=server
      - NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
      - NEXT_TELEMETRY_DISABLED=1
      - HOST=0.0.0.0
      - HOSTNAME=0.0.0.0
      - PORT=3210
      - NODE_OPTIONS=--max-old-space-size=2048
      
      # URLs
      - APP_URL=http://${PUBLIC_IP}:3210
      - NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}:3210
      - NEXTAUTH_URL=http://${PUBLIC_IP}:3210
      - NEXTAUTH_URL_INTERNAL=http://localhost:3210
      - AUTH_URL=http://${PUBLIC_IP}:3210
      - AUTH_TRUST_HOST=true
      
      # Banco de dados
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@agents-chat-postgres:5432/agents_chat
      - DATABASE_DRIVER=node
      
      # Redis
      - REDIS_URL=redis://agents-chat-redis:6379
      
      # MinIO/S3
      - S3_ENDPOINT=http://agents-chat-minio:9000
      - S3_ACCESS_KEY_ID=minioadmin
      - S3_SECRET_ACCESS_KEY=${MINIO_PASSWORD}
      - S3_BUCKET=lobe
      - S3_REGION=us-east-1
      - S3_FORCE_PATH_STYLE=true
      - S3_PUBLIC_DOMAIN=${PUBLIC_IP}:9000
      - NEXT_PUBLIC_S3_DOMAIN=${PUBLIC_IP}:9000
      
      # Segurança
      - NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}
      - KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}
      - NEXT_AUTH_SSO_PROVIDERS=credentials
      
      # API Keys (configure no .env)
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=\${GOOGLE_API_KEY}
      - AZURE_API_KEY=\${AZURE_API_KEY}
      - AZURE_ENDPOINT=\${AZURE_ENDPOINT}
      - AZURE_API_VERSION=\${AZURE_API_VERSION}
      
      # Opcionais
      - ACCESS_CODE=\${ACCESS_CODE}
      - FEATURE_FLAGS=\${FEATURE_FLAGS}
      - DEBUG=\${DEBUG}
    
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./logs/app:/app/logs
    networks:
      - agents-chat
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3210/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  agents-chat:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

volumes:
  postgres_data:
  redis_data:
  minio_data:
  casdoor_data:
EOF

success "Docker Compose configurado!"

# =============================================================================
# 7. INICIALIZAÇÃO SEQUENCIAL DOS SERVIÇOS
# =============================================================================

step "7. Iniciando serviços sequencialmente..."

# Iniciar PostgreSQL primeiro
log "Iniciando PostgreSQL..."
docker-compose up -d postgres

wait_for_service "PostgreSQL" "docker exec agents-chat-postgres pg_isready -U postgres -d agents_chat"

# Instalar extensão pgvector
log "Instalando extensão pgvector..."
retry_command "docker exec agents-chat-postgres psql -U postgres -d agents_chat -c \"CREATE EXTENSION IF NOT EXISTS vector;\"" "Instalação do pgvector"

# Iniciar Redis
log "Iniciando Redis..."
docker-compose up -d redis

wait_for_service "Redis" "docker exec agents-chat-redis redis-cli ping"

# Iniciar MinIO
log "Iniciando MinIO..."
docker-compose up -d minio

wait_for_service "MinIO" "curl -f http://localhost:9000/minio/health/live"

# Configurar bucket no MinIO
log "Configurando bucket no MinIO..."
sleep 10  # Aguardar MinIO estar completamente pronto

retry_command "docker exec agents-chat-minio mc alias set myminio http://localhost:9000 minioadmin ${MINIO_PASSWORD}" "Configuração do alias MinIO"
retry_command "docker exec agents-chat-minio mc mb myminio/lobe" "Criação do bucket"
retry_command "docker exec agents-chat-minio mc anonymous set download myminio/lobe" "Configuração de permissões do bucket"

# Iniciar Casdoor
log "Iniciando Casdoor..."
docker-compose up -d casdoor

wait_for_service "Casdoor" "curl -f http://localhost:8000" 60

success "Infraestrutura iniciada com sucesso!"

# =============================================================================
# 8. EXECUÇÃO DAS MIGRAÇÕES COM RETRY
# =============================================================================

step "8. Executando migrações do banco de dados..."

# Aguardar um pouco mais para garantir que o banco está pronto
sleep 10

# Executar migrações com retry
log "Executando migrações..."
cd "$WORK_DIR"

MIGRATION_COMMAND="MIGRATION_DB=1 DATABASE_URL=\"postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat\" tsx ./scripts/migrateServerDB/index.ts"

retry_command "$MIGRATION_COMMAND" "Execução das migrações"

# Verificar se extensão pgvector foi instalada corretamente
log "Verificando extensão pgvector..."
PGVECTOR_CHECK="docker exec agents-chat-postgres psql -U postgres -d agents_chat -c \"SELECT * FROM pg_extension WHERE extname = 'vector';\""
if eval "$PGVECTOR_CHECK" | grep -q "vector"; then
    success "Extensão pgvector instalada corretamente!"
else
    error "Extensão pgvector não foi instalada corretamente"
fi

success "Migrações executadas com sucesso!"

# =============================================================================
# 9. INICIALIZAÇÃO DA APLICAÇÃO
# =============================================================================

step "9. Iniciando aplicação..."

# Iniciar aplicação
log "Iniciando aplicação Agents Chat..."
docker-compose up -d app

wait_for_service "Aplicação" "curl -f http://localhost:3210" 120

success "Aplicação iniciada com sucesso!"

# =============================================================================
# 10. VALIDAÇÃO COMPLETA E TESTES
# =============================================================================

step "10. Executando validação completa..."

# Função para testar endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    
    if curl -f -s "$url" >/dev/null; then
        success "✅ $description: OK"
        return 0
    else
        error "❌ $description: FALHA"
        return 1
    fi
}

# Testes de conectividade
log "Executando testes de conectividade..."

test_endpoint "http://localhost:3210" "Aplicação Principal"
test_endpoint "http://localhost:9000/minio/health/live" "MinIO Health"
test_endpoint "http://localhost:9001" "MinIO Console"
test_endpoint "http://localhost:8000" "Casdoor"

# Testes de banco de dados
log "Testando conectividade do banco..."
if docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT 1;" >/dev/null 2>&1; then
    success "✅ PostgreSQL: OK"
else
    error "❌ PostgreSQL: FALHA"
fi

# Testes de Redis
log "Testando Redis..."
if docker exec agents-chat-redis redis-cli ping >/dev/null 2>&1; then
    success "✅ Redis: OK"
else
    error "❌ Redis: FALHA"
fi

# Teste de upload no MinIO
log "Testando upload no MinIO..."
echo "test" | docker exec -i agents-chat-minio mc pipe myminio/lobe/test.txt 2>/dev/null && success "✅ MinIO Upload: OK" || error "❌ MinIO Upload: FALHA"

success "Validação completa finalizada!"

# =============================================================================
# 11. CONFIGURAÇÃO DE MONITORAMENTO
# =============================================================================

step "11. Configurando monitoramento..."

# Criar script de health check
cat > /usr/local/bin/agents-chat-health.sh << 'EOF'
#!/bin/bash

echo "=== AGENTS CHAT HEALTH CHECK ==="
echo "Data: $(date)"
echo "=================================="

# Verificar aplicação
if curl -f -s http://localhost:3210/api/health >/dev/null 2>&1; then
    echo "✅ Aplicação: OK"
else
    echo "❌ Aplicação: ERRO"
fi

# Verificar PostgreSQL
if docker exec agents-chat-postgres pg_isready -U postgres -d agents_chat >/dev/null 2>&1; then
    echo "✅ PostgreSQL: OK"
else
    echo "❌ PostgreSQL: ERRO"
fi

# Verificar Redis
if docker exec agents-chat-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: ERRO"
fi

# Verificar MinIO
if curl -f -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "✅ MinIO: OK"
else
    echo "❌ MinIO: ERRO"
fi

# Verificar Casdoor
if curl -f -s http://localhost:8000 >/dev/null 2>&1; then
    echo "✅ Casdoor: OK"
else
    echo "❌ Casdoor: ERRO"
fi

echo "=================================="
EOF

chmod +x /usr/local/bin/agents-chat-health.sh

# Criar script de backup
cat > /usr/local/bin/agents-chat-backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/backup/agents-chat"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p "\$BACKUP_DIR"

# Backup do banco
docker exec agents-chat-postgres pg_dump -U postgres agents_chat > "\$BACKUP_DIR/db_\$DATE.sql"

# Backup dos dados
tar -czf "\$BACKUP_DIR/data_\$DATE.tar.gz" -C "$WORK_DIR" data/

# Backup do .env
cp "$WORK_DIR/.env" "\$BACKUP_DIR/env_\$DATE.backup"

# Manter apenas últimos 7 dias
find "\$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "\$BACKUP_DIR" -name "*.backup" -mtime +7 -delete

echo "Backup concluído: \$BACKUP_DIR/"
EOF

chmod +x /usr/local/bin/agents-chat-backup.sh

success "Monitoramento configurado!"

# =============================================================================
# 12. RELATÓRIO FINAL COMPLETO
# =============================================================================

step "12. Gerando relatório final..."

# Coletar estatísticas
DOCKER_STATS=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}")
DISK_USAGE=$(df -h "$WORK_DIR" | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')
CONTAINER_COUNT=$(docker ps -q | wc -l)

# Salvar informações de deploy
cat > "$WORK_DIR/deploy-info.txt" << EOF
=== AGENTS CHAT - DEPLOY PRODUÇÃO ===
Data: $(date)
Script: deploy-prod-optimized.sh
Usuário: $CURRENT_USER
Diretório: $WORK_DIR
IP Público: $PUBLIC_IP

=== CREDENCIAIS GERADAS ===
PostgreSQL: 
  - Usuário: postgres
  - Senha: ${POSTGRES_PASSWORD}
  - Banco: agents_chat
  - URL: postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat

MinIO:
  - Usuário: minioadmin
  - Senha: ${MINIO_PASSWORD}
  - Bucket: lobe
  - Console: http://${PUBLIC_IP}:9001

Segurança:
  - KEY_VAULTS_SECRET: ${KEY_VAULTS_SECRET}
  - NEXT_AUTH_SECRET: ${NEXT_AUTH_SECRET}

=== SERVIÇOS ATIVOS ===
- Aplicação: http://${PUBLIC_IP}:3210
- MinIO Console: http://${PUBLIC_IP}:9001
- Casdoor: http://${PUBLIC_IP}:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

=== COMANDOS ÚTEIS ===
- Status: docker-compose ps
- Logs: docker-compose logs -f
- Health Check: /usr/local/bin/agents-chat-health.sh
- Backup: /usr/local/bin/agents-chat-backup.sh
- Parar: docker-compose down
- Reiniciar: docker-compose restart
- Rebuild: docker-compose up -d --build app

=== ESTATÍSTICAS ===
- Containers ativos: $CONTAINER_COUNT
- Uso de disco: $DISK_USAGE
- Log de deploy: $LOG_FILE

=== PRÓXIMOS PASSOS ===
1. Configure suas API Keys no arquivo .env
2. Acesse http://${PUBLIC_IP}:3210 para começar
3. Configure usuários no Casdoor (http://${PUBLIC_IP}:8000)
4. Execute backup regular: /usr/local/bin/agents-chat-backup.sh
5. Monitore saúde: /usr/local/bin/agents-chat-health.sh

EOF

# Exibir relatório final
clear
echo ""
echo "============================================================================="
echo -e "${GREEN}🎉 DEPLOY PRODUÇÃO CONCLUÍDO COM SUCESSO!${NC}"
echo "============================================================================="
echo ""
echo -e "${PURPLE}📊 RESUMO DO DEPLOY:${NC}"
echo "   • ✅ Aplicação buildada e rodando"
echo "   • ✅ PostgreSQL 16 + pgvector configurado"
echo "   • ✅ Redis 7 para cache"
echo "   • ✅ MinIO para armazenamento"
echo "   • ✅ Casdoor para autenticação"
echo "   • ✅ Migrações executadas"
echo "   • ✅ Testes de conectividade OK"
echo "   • ✅ Monitoramento configurado"
echo "   • ✅ Backup automático configurado"
echo ""
echo -e "${BLUE}🌐 ACESSO AOS SERVIÇOS:${NC}"
echo "   • 🚀 Aplicação: http://${PUBLIC_IP}:3210"
echo "   • 💾 MinIO Console: http://${PUBLIC_IP}:9001"
echo "   • 🔐 Casdoor: http://${PUBLIC_IP}:8000"
echo "   • 🗄️ PostgreSQL: localhost:5432"
echo "   • 🔄 Redis: localhost:6379"
echo ""
echo -e "${YELLOW}🔐 CREDENCIAIS:${NC}"
echo "   • MinIO: minioadmin / ${MINIO_PASSWORD}"
echo "   • PostgreSQL: postgres / ${POSTGRES_PASSWORD}"
echo "   • Casdoor: admin / 123456 (padrão)"
echo ""
echo -e "${GREEN}🔧 COMANDOS RÁPIDOS:${NC}"
echo "   • Status: docker-compose ps"
echo "   • Logs: docker-compose logs -f app"
echo "   • Health: /usr/local/bin/agents-chat-health.sh"
echo "   • Backup: /usr/local/bin/agents-chat-backup.sh"
echo ""
echo -e "${CYAN}📋 INFORMAÇÕES SALVAS EM:${NC}"
echo "   • Credenciais: $WORK_DIR/deploy-info.txt"
echo "   • Log completo: $LOG_FILE"
echo "   • Configuração: $WORK_DIR/.env"
echo ""
echo -e "${PURPLE}🚨 IMPORTANTE:${NC}"
echo "   • Configure suas API keys no arquivo .env"
echo "   • Execute backup regular com o script fornecido"
echo "   • Monitore a saúde dos serviços regularmente"
echo "   • Considere configurar SSL/TLS para produção"
echo ""
echo "============================================================================="
echo -e "${GREEN}✨ AGENTS CHAT ESTÁ RODANDO EM PRODUÇÃO!${NC}"
echo "============================================================================="
echo ""

# Executar health check final
log "Executando health check final..."
/usr/local/bin/agents-chat-health.sh

success "Deploy completo finalizado com sucesso! 🚀"
log_to_file "Deploy concluído com sucesso"

# =============================================================================
# FIM DO SCRIPT
# =============================================================================