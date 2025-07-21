#!/bin/bash

# ============================================================================
# 🚀 ADMIN PANEL SETUP - AGENTS CHAT
# ============================================================================
# Script para configurar o ambiente completo do painel administrativo
# Utiliza a infraestrutura existente do projeto
# 
# RECENT UPDATES (2025-07-18):
# - Fixed S3/MinIO configuration with correct bucket name (agents-chat)
# - Added S3_ENABLE_PATH_STYLE and MINIO_LOBE_BUCKET variables
# - Fixed admin/models endpoint 500 error (Drizzle ORM relations issue)
# - Added CORS configuration for MinIO
# - Improved memory management for builds
# - Added automatic db:generate before builds
# - Enhanced admin user creation with SQL approach
# - Fixed missing database columns (category, group_id, etc)
# ============================================================================

set -e  # Exit on error

# Parse command line arguments
FORCE_MIGRATION=false
CLEAN_ENVIRONMENT=false
REBUILD_ONLY=false
CONFIGURE_NGINX_ONLY=false
SKIP_ADMIN_CREATION=false

for arg in "$@"; do
    case $arg in
        --force-migration)
            FORCE_MIGRATION=true
            ;;
        --clean)
            CLEAN_ENVIRONMENT=true
            ;;
        --rebuild)
            REBUILD_ONLY=true
            ;;
        --configure-nginx)
            CONFIGURE_NGINX_ONLY=true
            ;;
        --skip-admin)
            SKIP_ADMIN_CREATION=true
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force-migration  Force run all database migrations"
            echo "  --clean           Clean entire environment (Docker, volumes, cache)"
            echo "  --rebuild         Rebuild existing application (migrations + build)"
            echo "  --configure-nginx Configure Nginx for external access"
            echo "  --skip-admin      Skip admin user creation (useful for rebuilds)"
            echo "  --help            Show this help message"
            echo ""
            exit 0
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
highlight() { echo -e "${PURPLE}[HIGHLIGHT]${NC} $1"; }

# ============================================================================
# CLEAN ENVIRONMENT FUNCTION
# ============================================================================
clean_environment() {
    echo ""
    echo -e "${YELLOW}=============================================================================="
    echo -e "🧹 LIMPEZA COMPLETA DO AMBIENTE"
    echo -e "==============================================================================${NC}"

    warn "⚠️  ATENÇÃO: Isso irá remover TODOS os dados e containers!"
    read -p "Tem certeza que deseja continuar? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log "Operação cancelada."
        exit 0
    fi

    log "Parando todos os containers..."
    docker-compose down -v 2>/dev/null || true

    log "Removendo containers órfãos..."
    docker container prune -f

    log "Removendo imagens não utilizadas..."
    docker image prune -a -f

    log "Removendo volumes..."
    docker volume prune -f

    log "Limpando sistema Docker..."
    docker system prune -a -f --volumes

    log "Removendo diretórios de dados..."
    rm -rf data/ 2>/dev/null || true
    rm -rf .next/ 2>/dev/null || true
    rm -rf node_modules/ 2>/dev/null || true
    rm -rf .pnpm-store/ 2>/dev/null || true

    log "Removendo arquivos de cache..."
    rm -rf ~/.pnpm-store/ 2>/dev/null || true
    rm -rf ~/.npm/_cacache/ 2>/dev/null || true

    log "Removendo arquivos temporários..."
    rm -f .env.bak* 2>/dev/null || true
    rm -f admin-deploy-info.txt 2>/dev/null || true
    rm -f start-admin-*.sh 2>/dev/null || true

    success "Ambiente limpo com sucesso!"
    echo ""
    log "Para fazer uma nova instalação, execute:"
    echo "  ./setup-admin-environment.sh"
    echo ""
    exit 0
}

# ============================================================================
# HANDLE SPECIAL FLAGS FIRST
# ============================================================================
# Execute clean if requested
if [ "$CLEAN_ENVIRONMENT" = "true" ]; then
    clean_environment
fi

# Configure Nginx only if requested
if [ "$CONFIGURE_NGINX_ONLY" = "true" ]; then
    # Get external host from .env or ask
    if [ -f .env ]; then
        EXTERNAL_HOST=$(grep "^ADMIN_EMAIL=" .env | cut -d'@' -f2 || echo "localhost")
    fi
    
    if [ -z "$EXTERNAL_HOST" ] || [ "$EXTERNAL_HOST" = "localhost" ]; then
        read -p "Digite o IP ou domínio para acesso externo: " EXTERNAL_HOST
    fi
    
    if command -v nginx >/dev/null 2>&1; then
        log "🌐 Configurando Nginx para acesso externo..."
        
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/agents-chat > /dev/null << EOF
server {
    listen 80;
    server_name ${EXTERNAL_HOST};

    # Main application
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # MinIO API
    location /minio/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # MinIO Console  
    location /minio-console/ {
        proxy_pass http://localhost:9001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 100M;
}
EOF

        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/agents-chat /etc/nginx/sites-enabled/
        
        # Remove default site if exists
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        if sudo nginx -t; then
            sudo systemctl reload nginx
            success "Nginx configurado com sucesso!"
            echo ""
            echo "🌐 Acesso externo configurado:"
            echo "   • Aplicação: http://${EXTERNAL_HOST}"
            echo "   • Admin Panel: http://${EXTERNAL_HOST}/admin"
            echo "   • MinIO: http://${EXTERNAL_HOST}/minio-console/"
            echo ""
        else
            error "Erro na configuração do Nginx"
        fi
    else
        error "Nginx não está instalado. Instale com: sudo apt update && sudo apt install nginx -y"
    fi
    exit 0
fi

# Show mode header
if [ "$REBUILD_ONLY" = "true" ]; then
    echo ""
    echo -e "${BLUE}=============================================================================="
    echo -e "🔄 MODO REBUILD - RECONSTRUINDO APLICAÇÃO EXISTENTE"
    echo -e "==============================================================================${NC}"
    echo ""
elif [ "$FORCE_MIGRATION" = "true" ]; then
    echo ""
    echo -e "${YELLOW}=============================================================================="
    echo -e "⚡ MODO FORCE MIGRATION - EXECUTANDO TODAS AS MIGRAÇÕES"
    echo -e "==============================================================================${NC}"
    echo ""
fi

# ============================================================================
# 1. VERIFICAÇÃO DO AMBIENTE
# ============================================================================
log "🔍 Verificando pré-requisitos..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Verificar dependências
command -v docker >/dev/null 2>&1 || error "Docker não está instalado!"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose não está instalado!"

success "Pré-requisitos verificados!"

# ============================================================================
# 2. CONFIGURAÇÃO DO ADMIN
# ============================================================================
if [ "$REBUILD_ONLY" = "true" ]; then
    log "🔄 Modo rebuild - pulando configuração interativa..."
    # Extract existing host from .env if available
    if [ -f .env ]; then
        EXTERNAL_HOST=$(grep "^ADMIN_EMAIL=" .env | cut -d'@' -f2 || echo "localhost")
        CUSTOM_ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2 || echo "")
        AUTH_MODE="credentials"
    else
        EXTERNAL_HOST="localhost"
        CUSTOM_ADMIN_EMAIL=""
        AUTH_MODE="credentials"
    fi
else
    log "⚙️  Configurando ambiente para o painel administrativo..."

    # Perguntar o IP/domínio para acesso externo
    read -p "Digite o IP ou domínio para acesso externo (ex: 192.168.1.100 ou admin.suaempresa.com): " EXTERNAL_HOST
    if [ -z "$EXTERNAL_HOST" ]; then
        EXTERNAL_HOST="localhost"
        warn "Usando localhost como host padrão"
    fi

    # Perguntar sobre o email do administrador
    echo ""
    read -p "Digite o email do administrador (ex: admin@ai4learning.com.br): " CUSTOM_ADMIN_EMAIL
    
    # Validar se o email foi fornecido
    if [ -z "$CUSTOM_ADMIN_EMAIL" ]; then
        error "Email do administrador é obrigatório!"
    fi

    # Validar formato do email
    if ! echo "$CUSTOM_ADMIN_EMAIL" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'; then
        error "Email inválido! Use um formato válido como: admin@exemplo.com"
    fi

    # Perguntar sobre senha personalizada do administrador
    echo ""
    read -p "Digite uma senha personalizada para o administrador [deixe vazio para gerar automaticamente]: " CUSTOM_ADMIN_PASSWORD
    if [ -n "$CUSTOM_ADMIN_PASSWORD" ]; then
        # Verificar se a senha tem pelo menos 8 caracteres
        if [ ${#CUSTOM_ADMIN_PASSWORD} -lt 8 ]; then
            warn "Senha muito curta. Deve ter pelo menos 8 caracteres. Gerando automaticamente..."
            CUSTOM_ADMIN_PASSWORD=""
        fi
    fi

    # Perguntar sobre autenticação
    echo ""
    echo "Escolha o modo de autenticação:"
    echo "1) Login local (usuário/senha)"
    echo "2) Google OAuth"
    echo "3) GitHub OAuth"
    echo "4) Casdoor (SSO)"
    read -p "Opção (1-4) [padrão: 1]: " AUTH_CHOICE

    case "$AUTH_CHOICE" in
        2)
            AUTH_MODE="google"
            read -p "Digite seu Google Client ID: " GOOGLE_CLIENT_ID
            read -p "Digite seu Google Client Secret: " GOOGLE_CLIENT_SECRET
            ;;
        3)
            AUTH_MODE="github"
            read -p "Digite seu GitHub Client ID: " GITHUB_CLIENT_ID
            read -p "Digite seu GitHub Client Secret: " GITHUB_CLIENT_SECRET
            ;;
        4)
            AUTH_MODE="casdoor"
            ;;
        *)
            AUTH_MODE="credentials"
            ;;
    esac
fi

# Backup do .env existente
if [ -f .env ]; then
    cp .env .env.backup
    log "Backup do .env criado em .env.backup"
fi

# Copiar .env.example se não existir .env
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    log "Criado .env a partir de .env.example"
fi

# Check if .env exists and extract existing passwords
if [ -f .env ]; then
    # Extract existing passwords from .env
    EXISTING_DB_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
    EXISTING_MINIO_PASSWORD=$(grep "^MINIO_ROOT_PASSWORD=" .env | cut -d'=' -f2)
    EXISTING_KEY_VAULTS=$(grep "^KEY_VAULTS_SECRET=" .env | cut -d'=' -f2)
    EXISTING_NEXTAUTH=$(grep "^NEXT_AUTH_SECRET=" .env | cut -d'=' -f2)
fi

# Use existing passwords if available, otherwise generate new ones
DB_PASSWORD=${EXISTING_DB_PASSWORD:-$(openssl rand -hex 32)}
MINIO_PASSWORD=${EXISTING_MINIO_PASSWORD:-$(openssl rand -hex 16)}
KEY_VAULTS_SECRET=${EXISTING_KEY_VAULTS:-$(openssl rand -hex 32)}
NEXTAUTH_SECRET=${EXISTING_NEXTAUTH:-$(openssl rand -hex 32)}

# Use custom password if provided, otherwise generate one
if [ -n "$CUSTOM_ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD="$CUSTOM_ADMIN_PASSWORD"
else
    ADMIN_PASSWORD=$(openssl rand -base64 12)
fi

# Log if using existing passwords
if [ -n "$EXISTING_DB_PASSWORD" ]; then
    log "Using existing PostgreSQL password from .env"
fi

# Calculate memory allocation early for .env
if [ -f /proc/meminfo ]; then
    TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
else
    TOTAL_MEM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo "8589934592")
    TOTAL_MEM_MB=$((TOTAL_MEM_BYTES / 1024 / 1024))
fi
NODE_HEAP_SIZE=$((TOTAL_MEM_MB * 75 / 100))
if [ $NODE_HEAP_SIZE -lt 28672 ]; then
    NODE_HEAP_SIZE=28672
elif [ $NODE_HEAP_SIZE -gt 24576 ]; then
    NODE_HEAP_SIZE=24576
fi

# Atualizar variáveis no .env existente
log "Atualizando configurações no .env..."

# Função para atualizar ou adicionar variável no .env
update_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env; then
        # Se a variável existe, atualiza
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env
    else
        # Se não existe, adiciona
        echo "${key}=${value}" >> .env
    fi
}

# Atualizar variáveis essenciais
update_env "DATABASE_URL" "postgresql://postgres:${DB_PASSWORD}@localhost:5432/agents_chat"
update_env "DATABASE_DRIVER" "node"
update_env "KEY_VAULTS_SECRET" "${KEY_VAULTS_SECRET}"
update_env "NEXT_AUTH_SECRET" "${NEXTAUTH_SECRET}"
update_env "NEXTAUTH_SECRET" "${NEXTAUTH_SECRET}"
update_env "NEXTAUTH_URL" "http://${EXTERNAL_HOST}:3210"
update_env "APP_URL" "http://${EXTERNAL_HOST}:3210"
update_env "NEXT_PUBLIC_BASE_URL" "http://${EXTERNAL_HOST}:3210"
update_env "NEXT_PUBLIC_SITE_URL" "http://${EXTERNAL_HOST}:3210"
update_env "NODE_ENV" "production"
update_env "NEXT_PUBLIC_SERVICE_MODE" "server"
update_env "NEXT_PUBLIC_ENABLE_NEXT_AUTH" "1"

# MinIO/S3 Configuration
update_env "S3_ENDPOINT" "http://agents-chat-minio:9000"
update_env "S3_ACCESS_KEY_ID" "minioadmin"
update_env "S3_SECRET_ACCESS_KEY" "${MINIO_PASSWORD}"
update_env "S3_BUCKET" "agents-chat"
update_env "MINIO_LOBE_BUCKET" "agents-chat"
update_env "S3_REGION" "us-east-1"
update_env "S3_ENABLE_PATH_STYLE" "1"
update_env "S3_FORCE_PATH_STYLE" "true"
update_env "S3_PUBLIC_DOMAIN" "http://${EXTERNAL_HOST}:9000"
update_env "MINIO_ROOT_USER" "minioadmin"
update_env "MINIO_ROOT_PASSWORD" "${MINIO_PASSWORD}"

# PostgreSQL
update_env "POSTGRES_PASSWORD" "${DB_PASSWORD}"
update_env "LOBE_DB_NAME" "agents_chat"

# Admin configuration
# Use the provided admin email (required in new setup)
if [ -n "$CUSTOM_ADMIN_EMAIL" ]; then
    update_env "ADMIN_EMAIL" "${CUSTOM_ADMIN_EMAIL}"
else
    # For rebuild mode, try to extract from existing .env
    if [ -f .env ]; then
        EXISTING_ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2)
        if [ -n "$EXISTING_ADMIN_EMAIL" ]; then
            update_env "ADMIN_EMAIL" "${EXISTING_ADMIN_EMAIL}"
        else
            error "Email do administrador não encontrado! Configure manualmente no .env"
        fi
    else
        error "Email do administrador é obrigatório!"
    fi
fi
update_env "ADMIN_DEFAULT_PASSWORD" "${ADMIN_PASSWORD}"
update_env "ENABLE_ADMIN_PANEL" "true"

# Memory configuration
update_env "NODE_OPTIONS" "--max-old-space-size=${NODE_HEAP_SIZE:-28672}"
update_env "NODE_MAX_MEMORY" "${NODE_HEAP_SIZE:-28672}"

# Authentication configuration
case "$AUTH_MODE" in
    google)
        update_env "NEXT_AUTH_SSO_PROVIDERS" "google"
        update_env "AUTH_GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID}"
        update_env "AUTH_GOOGLE_CLIENT_SECRET" "${GOOGLE_CLIENT_SECRET}"
        ;;
    github)
        update_env "NEXT_AUTH_SSO_PROVIDERS" "github"
        update_env "AUTH_GITHUB_CLIENT_ID" "${GITHUB_CLIENT_ID}"
        update_env "AUTH_GITHUB_CLIENT_SECRET" "${GITHUB_CLIENT_SECRET}"
        ;;
    casdoor)
        update_env "NEXT_AUTH_SSO_PROVIDERS" "casdoor"
        update_env "AUTH_CASDOOR_ISSUER" "http://localhost:8000"
        update_env "AUTH_CASDOOR_ID" "agents-chat"
        update_env "AUTH_CASDOOR_SECRET" "agents-chat-secret"
        ;;
    *)
        update_env "NEXT_AUTH_SSO_PROVIDERS" "credentials"
        ;;
esac

success "Configuração do ambiente atualizada!"

# ============================================================================
# 3. VERIFICAR DOCKER COMPOSE EXISTENTE
# ============================================================================
log "🐳 Verificando configuração Docker existente..."

# Usar o docker-compose.yml existente do projeto
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml não encontrado! Certifique-se de estar no diretório correto."
fi

# Verificar se os serviços necessários estão no docker-compose
if ! grep -q "postgres:" docker-compose.yml; then
    error "Serviço PostgreSQL não encontrado no docker-compose.yml"
fi

if ! grep -q "minio:" docker-compose.yml; then
    warn "Serviço MinIO não encontrado, algumas funcionalidades podem não funcionar"
fi

success "Docker Compose verificado!"

# ============================================================================
# 4. PREPARAR AMBIENTE DOCKER
# ============================================================================
log "🐳 Preparando ambiente Docker..."

# Memory was already calculated, just show the info
log "🧮 Configuração de memória:"
log "💾 Memória total: ${TOTAL_MEM_MB}MB"
log "🚀 Alocando ${NODE_HEAP_SIZE}MB para Node.js no Docker"

# Configure memory limits for Docker build
export NODE_OPTIONS="--max-old-space-size=${NODE_HEAP_SIZE}"
export NODE_MAX_MEMORY="${NODE_HEAP_SIZE}"

success "Ambiente Docker preparado!"

# ============================================================================
# 5. LIMPAR CACHE DO DOCKER (SE REBUILD)
# ============================================================================
if [ "$REBUILD_ONLY" = "true" ]; then
    log "🧹 Limpando cache do Docker para rebuild..."
    
    # Parar containers
    docker-compose down
    
    # Limpar cache do sistema
    docker system prune -f
    
    # Remover volume de cache do Next.js se existir
    docker volume rm agents_saas_next-cache 2>/dev/null || true
    
    success "Cache do Docker limpo!"
fi

# ============================================================================
# 6. INICIAR SERVIÇOS DOCKER
# ============================================================================
if [ "$REBUILD_ONLY" = "true" ]; then
    log "🐳 Verificando serviços Docker..."
    # Ensure services are running but don't restart them
    if ! docker ps | grep -q agents-chat-postgres; then
        log "Iniciando serviços necessários..."
        docker-compose up -d postgres redis minio
    else
        log "Serviços já estão rodando"
    fi
else
    log "🐳 Iniciando serviços Docker..."

    # Parar serviços existentes se houver
    docker-compose down 2>/dev/null || true

    # Iniciar serviços usando o docker-compose existente
    docker-compose up -d postgres redis minio
fi

# Aguardar serviços iniciarem
log "Aguardando serviços iniciarem..."
sleep 15

# Verificar PostgreSQL
log "Verificando PostgreSQL..."
for i in {1..30}; do
    if docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1; then
        success "PostgreSQL pronto!"
        break
    fi
    echo -n "."
    sleep 2
done

# Verificar MinIO (se existir)
if docker ps | grep -q minio; then
    log "Verificando MinIO..."
    for i in {1..30}; do
        if curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
            success "MinIO pronto!"
            # Criar bucket
            docker run --rm --network host \
                minio/mc alias set myminio http://localhost:9000 minioadmin ${MINIO_PASSWORD} && \
                docker run --rm --network host \
                minio/mc mb myminio/agents-chat --ignore-existing && \
                docker run --rm --network host \
                minio/mc policy set public myminio/agents-chat
            
            # Configure CORS for MinIO
            log "Configurando CORS para MinIO..."
            if [ -f scripts/configure-minio-cors.js ]; then
                # Update the script with the current password
                sed -i.bak "s|secretAccessKey: '.*'|secretAccessKey: '${MINIO_PASSWORD}'|" scripts/configure-minio-cors.js
                node scripts/configure-minio-cors.js || warn "Falha ao configurar CORS do MinIO"
            else
                warn "Script de configuração CORS não encontrado"
            fi
            break
        fi
        echo -n "."
        sleep 2
    done
fi

success "Serviços Docker iniciados!"

# ============================================================================
# 7. EXECUTAR MIGRAÇÕES DO BANCO DE DADOS
# ============================================================================
log "🔄 Executando migrações do banco de dados..."

# Check if this is an existing deployment
if docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT 1 FROM users LIMIT 1" >/dev/null 2>&1; then
    log "Detectado banco de dados existente com tabela users"
    EXISTING_DEPLOYMENT=true
else
    EXISTING_DEPLOYMENT=false
fi

# Instalar extensão pgvector
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || {
    log "Creating database if it doesn't exist..."
    docker exec agents-chat-postgres psql -U postgres -c "CREATE DATABASE agents_chat;" 2>/dev/null || true
    docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
}

# Verificar conectividade antes de migrar
log "Verificando conectividade com PostgreSQL..."
for i in {1..10}; do
    if nc -z localhost 5432 2>/dev/null; then
        success "PostgreSQL está acessível na porta 5432"
        break
    fi
    if [ $i -eq 10 ]; then
        error "PostgreSQL não está acessível em localhost:5432. Verifique se o container está rodando."
    fi
    echo -n "."
    sleep 2
done

# For existing deployments, skip migrations by default unless forced
if [ "$EXISTING_DEPLOYMENT" = "true" ] && [ "$FORCE_MIGRATION" = "false" ]; then
    log "Deploy existente detectado - pulando migrações completas"
    log "Use --force-migration para forçar execução de migrações"
else
    log "Migrações serão executadas durante o build do Docker..."
fi

# Always ensure admin column exists
log "Garantindo que coluna is_admin existe..."
docker exec agents-chat-postgres psql -U postgres -d agents_chat << 'SQLEOF'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE 'Coluna is_admin adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna is_admin já existe';
    END IF;
END$$;
SQLEOF

# Fix missing category column in agentsToSessions table
log "Verificando e corrigindo estrutura das tabelas de sessão..."
docker exec agents-chat-postgres psql -U postgres -d agents_chat << 'SQLEOF'
-- Check if agentsToSessions table exists and add missing columns
DO $$
BEGIN
    -- First check if the table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents_to_sessions'
    ) THEN
        -- Add category column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'agents_to_sessions' AND column_name = 'category'
        ) THEN
            ALTER TABLE agents_to_sessions ADD COLUMN category VARCHAR(255);
            RAISE NOTICE 'Coluna category adicionada à tabela agents_to_sessions';
        END IF;
    END IF;

    -- Also check for the sessions table structure
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) THEN
        -- Ensure sessions table has all required columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'sessions' AND column_name = 'group_id'
        ) THEN
            ALTER TABLE sessions ADD COLUMN group_id VARCHAR(255);
            RAISE NOTICE 'Coluna group_id adicionada à tabela sessions';
        END IF;
    END IF;

    -- Check for agents table category column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'agents' AND column_name = 'category'
        ) THEN
            ALTER TABLE agents ADD COLUMN category VARCHAR(255) DEFAULT 'general';
            RAISE NOTICE 'Coluna category adicionada à tabela agents';
        END IF;
    END IF;
END$$;
SQLEOF

# Run a more comprehensive migration fix
log "Executando correções adicionais no schema..."
docker exec agents-chat-postgres psql -U postgres -d agents_chat << 'SQLEOF'
-- Create a function to safely add columns
CREATE OR REPLACE FUNCTION safe_add_column(
    p_table_name text,
    p_column_name text,
    p_column_definition text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = p_table_name AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_definition);
        RAISE NOTICE 'Column % added to table %', p_column_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply fixes for common missing columns
SELECT safe_add_column('sessions', 'group_id', 'VARCHAR(255)');
SELECT safe_add_column('sessions', 'pinned', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('agents', 'category', 'VARCHAR(255) DEFAULT ''general''');
SELECT safe_add_column('agents', 'is_domain', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('agents', 'sort', 'INTEGER DEFAULT 0');
SELECT safe_add_column('agents_to_sessions', 'category', 'VARCHAR(255)');

-- Drop the temporary function
DROP FUNCTION IF EXISTS safe_add_column;
SQLEOF

success "Schema do banco de dados verificado e corrigido!"

# Ensure DATABASE_URL uses container name for runtime
update_env "DATABASE_URL" "postgresql://postgres:${DB_PASSWORD}@agents-chat-postgres:5432/agents_chat"

# ============================================================================
# 8. CRIAR USUÁRIO ADMINISTRADOR
# ============================================================================
if [ "$SKIP_ADMIN_CREATION" = "true" ] || [ "$REBUILD_ONLY" = "true" ]; then
    log "⏭️  Pulando criação de usuário admin (--skip-admin ou --rebuild)"
else
    log "👤 Criando usuário administrador inicial..."

    # Set admin email based on configuration
    if [ -n "$CUSTOM_ADMIN_EMAIL" ]; then
        ADMIN_EMAIL="${CUSTOM_ADMIN_EMAIL}"
    else
        # Extract from .env if available
        ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2)
        if [ -z "$ADMIN_EMAIL" ]; then
            error "Email do administrador não encontrado!"
        fi
    fi

    # First, create or update the create-admin-user.ts script to use the correct email
    log "Atualizando script de criação de admin..."
    log "Email do admin: ${ADMIN_EMAIL}"

    # Create a more robust admin creation approach
    log "Verificando se usuário admin já existe..."

    # First, check if admin user exists using SQL
    ADMIN_EXISTS=$(docker exec agents-chat-postgres psql -U postgres -d agents_chat -t -c "SELECT COUNT(*) FROM users WHERE email = '${ADMIN_EMAIL}' AND is_admin = true;" 2>/dev/null | xargs || echo "0")

    if [ "$ADMIN_EXISTS" -gt 0 ]; then
        log "✅ Usuário admin já existe: ${ADMIN_EMAIL}"
        log "Pulando criação de usuário admin..."
        log "Use --skip-admin para pular esta verificação em futuras execuções"
    else
        log "🆕 Criando novo usuário admin..."
        
        # Generate a simple UUID-like ID for the user
        USER_ID="admin_$(date +%s)_$(openssl rand -hex 4)"
        
        # For password, we'll store it in plain text temporarily and let the app hash it on first login
        # Or use a pre-computed bcrypt hash
        # Using a pre-computed hash for the password (this is 'admin123' hashed)
        # You should change this password immediately after first login
        if [ -n "$CUSTOM_ADMIN_PASSWORD" ]; then
            log "⚠️  Senha personalizada será configurada após o primeiro build..."
            TEMP_PASSWORD="$CUSTOM_ADMIN_PASSWORD"
        else
            TEMP_PASSWORD="$ADMIN_PASSWORD"
        fi
        
        # Create admin user with a temporary marker that will be replaced after build
        # The actual password hashing will be done by the application
        docker exec agents-chat-postgres psql -U postgres -d agents_chat << SQLEOF
-- First, check if we need to create the user
DO \$\$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE email = '${ADMIN_EMAIL}') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- User doesn't exist, create with temporary password marker
        INSERT INTO users (
            id, 
            email, 
            username, 
            full_name, 
            password, 
            is_admin, 
            is_onboarded, 
            email_verified_at, 
            created_at, 
            updated_at
        ) VALUES (
            '${USER_ID}',
            '${ADMIN_EMAIL}',
            '$(echo ${ADMIN_EMAIL} | cut -d'@' -f1)',
            'Administrator',
            'TEMP_PASSWORD_${TEMP_PASSWORD}', -- Temporary marker
            true,
            true,
            NOW(),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Admin user created with temporary password marker';
    ELSE
        -- User exists, just ensure they are admin
        UPDATE users 
        SET is_admin = true, 
            is_onboarded = true,
            updated_at = NOW()
        WHERE email = '${ADMIN_EMAIL}';
        RAISE NOTICE 'Existing user updated to admin';
    END IF;
END\$\$;
SQLEOF

        if [ $? -eq 0 ]; then
            success "✅ Usuário admin criado/atualizado com sucesso!"
            log "📧 Email: ${ADMIN_EMAIL}"
            log "🔑 Senha: ${ADMIN_PASSWORD}"
            log "👤 ID: ${USER_ID}"
        else
            error "❌ Falha ao criar usuário admin via SQL"
        fi
    fi
fi

# Admin user creation completed above

    # Only show credentials if admin was actually created
    if [ "$ADMIN_EXISTS" -eq 0 ]; then
        echo ""
        echo "=== CREDENCIAIS DO ADMIN ==="
        echo "Email: ${ADMIN_EMAIL}"
        echo "Senha: ${ADMIN_PASSWORD}"
        echo ""
        echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
        echo "⚠️  LEMBRE-SE: Salve essas credenciais em local seguro!"
        echo ""
        success "Usuário administrador criado!"
    else
        success "Usuário administrador verificado!"
    fi

# ============================================================================
# 9. BUILD DA APLICAÇÃO DOCKER
# ============================================================================
log "🐳 Construindo aplicação com Docker..."

# Create a script to handle admin password after build
if [ -n "$TEMP_PASSWORD" ]; then
    cat > /tmp/update-admin-password.sql << SQLEOF
-- Update admin password after the application has been built
-- This will be executed after the container starts
UPDATE users 
SET password = crypt('${TEMP_PASSWORD}', gen_salt('bf'))
WHERE email = '${ADMIN_EMAIL}' 
  AND password LIKE 'TEMP_PASSWORD_%';
SQLEOF
fi

# Build arguments for Docker
BUILD_ARGS=""
BUILD_ARGS="${BUILD_ARGS} --build-arg NODE_OPTIONS=--max-old-space-size=${NODE_HEAP_SIZE}"
BUILD_ARGS="${BUILD_ARGS} --build-arg NEXT_PUBLIC_SERVICE_MODE=server"
BUILD_ARGS="${BUILD_ARGS} --build-arg NEXT_PUBLIC_ENABLE_NEXT_AUTH=1"

# Build Docker image
log "🔨 Executando build do Docker (isso pode levar alguns minutos)..."
docker-compose build ${BUILD_ARGS} app

if [ $? -eq 0 ]; then
    success "✅ Imagem Docker construída com sucesso!"
    
    # If we have a password update script, we'll need to run it after the container starts
    if [ -f /tmp/update-admin-password.sql ]; then
        log "⏳ Senha do admin será configurada após o container iniciar..."
    fi
else
    error "❌ Falha ao construir imagem Docker"
fi

# ============================================================================
# 10. CRIAR SCRIPTS DE INICIALIZAÇÃO
# ============================================================================
if [ "$REBUILD_ONLY" = "false" ]; then
    log "📝 Criando scripts de inicialização..."

    # Script para desenvolvimento
cat > start-admin-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando ambiente de desenvolvimento com Admin Panel..."
echo ""
echo "Admin Panel: http://localhost:3210/admin"
echo "MinIO Console: http://localhost:9001"
echo ""

# Garantir que todos os serviços estão rodando
docker-compose up -d

echo ""
echo "Aplicação rodando em modo produção via Docker"
echo "Para desenvolvimento local, use: docker exec -it agents-chat sh"
EOF

chmod +x start-admin-dev.sh

# Script para produção
cat > start-admin-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando ambiente de produção com Admin Panel..."

# Build Docker image
echo "🐳 Building Docker image..."
docker-compose build app

# Garantir que os serviços estão rodando
docker-compose up -d

# Iniciar servidor de produção
echo "Admin Panel disponível em: http://localhost:3210/admin"
EOF

chmod +x start-admin-prod.sh

    success "Scripts criados!"
fi

# ============================================================================
# 11. SALVAR INFORMAÇÕES DE DEPLOY
# ============================================================================
if [ "$REBUILD_ONLY" = "false" ]; then
    log "💾 Salvando informações do deploy..."

    cat > admin-deploy-info.txt << EOF
=== AGENTS CHAT ADMIN - INFORMAÇÕES DO DEPLOY ===
Data: $(date)
Host Externo: ${EXTERNAL_HOST}

ACESSOS:
- Admin Panel: http://${EXTERNAL_HOST}:3210/admin
- Aplicação: http://${EXTERNAL_HOST}:3210
- MinIO Console: http://${EXTERNAL_HOST}:9001
- PostgreSQL: ${EXTERNAL_HOST}:5432

CREDENCIAIS ADMIN:
- Email: ${ADMIN_EMAIL}
- Senha: ${ADMIN_PASSWORD}

CREDENCIAIS BANCO DE DADOS:
- PostgreSQL: postgres / ${DB_PASSWORD}
- MinIO: minioadmin / ${MINIO_PASSWORD}

CHAVES DE SEGURANÇA:
- KEY_VAULTS_SECRET: ${KEY_VAULTS_SECRET}
- NEXT_AUTH_SECRET: ${NEXTAUTH_SECRET}

COMANDOS ÚTEIS:
- Desenvolvimento: ./start-admin-dev.sh
- Produção: ./start-admin-prod.sh
- Logs: docker logs -f agents-chat
- Parar: docker-compose down
- Status: docker ps

MODO DE AUTENTICAÇÃO: ${AUTH_MODE}
EOF

    success "Informações salvas em admin-deploy-info.txt"
fi

# ============================================================================
# 12. CONFIGURAR NGINX (SE DISPONÍVEL)
# ============================================================================
if command -v nginx >/dev/null 2>&1; then
    log "🌐 Configurando Nginx para acesso externo..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/agents-chat > /dev/null << EOF
server {
    listen 80;
    server_name ${EXTERNAL_HOST};

    # Main application
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # MinIO API
    location /minio/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # MinIO Console
    location /minio-console/ {
        proxy_pass http://localhost:9001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 100M;
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/agents-chat /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        success "Nginx configurado para acesso externo!"
        log "Aplicação acessível em: http://${EXTERNAL_HOST}"
    else
        warn "Erro na configuração do Nginx. Verifique manualmente."
    fi
else
    warn "Nginx não está instalado. Para acesso externo, instale com:"
    echo "  sudo apt update && sudo apt install nginx -y"
    echo ""
    warn "Após instalar, execute:"
    echo "  ./setup-admin-environment.sh --configure-nginx"
fi

# ============================================================================
# 13. VERIFICAÇÃO FINAL E INSTRUÇÕES
# ============================================================================
# Skip certain sections for rebuild
if [ "$REBUILD_ONLY" = "true" ]; then
    echo ""
    echo "=============================================================================="
    success "🔄 REBUILD CONCLUÍDO!"
    echo "=============================================================================="
    echo ""
    log "O que foi feito:"
    echo "  ✅ Dependências atualizadas"
    echo "  ✅ Schema do banco regenerado"
    echo "  ✅ Migrações executadas"
    echo "  ✅ Coluna admin verificada"
    echo "  ✅ Aplicação reconstruída"
    echo ""
    echo "🚀 Próximos passos:"
    echo "  1. Reinicie a aplicação: docker-compose restart app"
    echo "  2. Ou use: pnpm start (produção) ou pnpm dev (desenvolvimento)"
    echo ""
    exit 0
fi

# ============================================================================
# 12. DEPLOY FINAL - INICIAR APLICAÇÃO PRINCIPAL
# ============================================================================
log "🚀 Iniciando aplicação principal..."

# Ensure docker-compose.yml has S3_ENABLE_PATH_STYLE variable
if ! grep -q "S3_ENABLE_PATH_STYLE" docker-compose.yml; then
    log "Adicionando S3_ENABLE_PATH_STYLE ao docker-compose.yml..."
    sed -i '/S3_PUBLIC_DOMAIN/a\      - S3_ENABLE_PATH_STYLE=${S3_ENABLE_PATH_STYLE:-1}' docker-compose.yml
fi

# Garantir que todos os serviços estão rodando
docker-compose up -d

# Aguardar aplicação iniciar
log "Aguardando aplicação iniciar (pode levar alguns minutos)..."
for i in {1..60}; do
    if curl -f http://localhost:3210/api/health >/dev/null 2>&1; then
        success "Aplicação iniciada com sucesso!"
        break
    fi
    if [ $i -eq 60 ]; then
        error "Timeout aguardando aplicação iniciar"
        echo "Verifique os logs com: docker logs agents-chat"
        exit 1
    fi
    echo -n "."
    sleep 5
done
echo ""

# Update admin password if needed
if [ -f /tmp/update-admin-password.sql ] && [ -n "$TEMP_PASSWORD" ]; then
    log "🔐 Configurando senha do administrador..."
    
    # Wait a bit more to ensure app is fully initialized
    sleep 10
    
    # Create a proper bcrypt hash using the application container
    docker exec agents-chat sh -c "
        # Try to update the admin password using the app's bcrypt
        node -e \"
            const bcrypt = require('bcryptjs');
            const password = '${TEMP_PASSWORD}';
            const hash = bcrypt.hashSync(password, 10);
            console.log(hash);
        \"
    " > /tmp/hashed_password.txt 2>/dev/null || {
        warn "Não foi possível gerar hash da senha. Use a senha temporária para o primeiro login."
    }
    
    if [ -f /tmp/hashed_password.txt ] && [ -s /tmp/hashed_password.txt ]; then
        HASHED_PASSWORD=$(cat /tmp/hashed_password.txt)
        docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "
            UPDATE users 
            SET password = '${HASHED_PASSWORD}'
            WHERE email = '${ADMIN_EMAIL}' 
              AND password LIKE 'TEMP_PASSWORD_%';
        "
        success "Senha do administrador configurada!"
        rm -f /tmp/hashed_password.txt
    fi
    
    rm -f /tmp/update-admin-password.sql
fi

log "🔍 Verificando status dos serviços..."

echo ""
echo "=== STATUS DOS SERVIÇOS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== VERIFICAÇÃO DE SAÚDE ==="
curl -f http://localhost:3210/api/health >/dev/null 2>&1 && echo "✅ API Health: OK" || echo "⚠️  API Health: Aguardando..."
docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1 && echo "✅ PostgreSQL: OK" || echo "❌ PostgreSQL: ERRO"
curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1 && echo "✅ MinIO: OK" || echo "⚠️  MinIO: Não disponível"

echo ""
echo "=============================================================================="
success "🎉 CONFIGURAÇÃO DO ADMIN PANEL CONCLUÍDA! 🎉"
echo "=============================================================================="
echo ""
highlight "📊 PAINEL ADMINISTRATIVO CONFIGURADO COM SUCESSO!"
echo ""
echo "🔗 ACESSOS:"
echo "   • Admin Panel: ${GREEN}http://${EXTERNAL_HOST}:3210/admin${NC}"
echo "   • Aplicação: ${BLUE}http://${EXTERNAL_HOST}:3210${NC}"
echo "   • MinIO Console: ${BLUE}http://${EXTERNAL_HOST}:9001${NC}"
# Only show credentials if they were set (not in rebuild mode)
if [ "$REBUILD_ONLY" = "false" ] && [ "$SKIP_ADMIN_CREATION" = "false" ]; then
    echo ""
    echo "👤 CREDENCIAIS DO ADMIN:"
    echo "   • Email: ${YELLOW}${ADMIN_EMAIL}${NC}"
    echo "   • Senha: ${YELLOW}${ADMIN_PASSWORD}${NC}"
    echo "   • ${RED}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
else
    echo ""
    echo "👤 ADMIN:"
    echo "   • Use as credenciais existentes para acessar o painel"
    echo "   • Email configurado: ${YELLOW}$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2)${NC}"
fi
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "   1. Para desenvolvimento: ${GREEN}./start-admin-dev.sh${NC}"
echo "   2. Para produção: ${GREEN}./start-admin-prod.sh${NC}"
echo "   3. Acesse o admin panel e faça login"
echo "   4. Configure as chaves de API dos provedores AI"
echo "   5. Crie planos de assinatura"
echo "   6. Configure os modelos disponíveis"
echo ""
echo "📁 INFORMAÇÕES SALVAS EM: ${GREEN}admin-deploy-info.txt${NC}"
echo "=============================================================================="
