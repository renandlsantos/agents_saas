#!/bin/bash

# ============================================================================
# 🚀 ADMIN PANEL SETUP - AGENTS CHAT
# ============================================================================
# Script para configurar o ambiente completo do painel administrativo
# Utiliza a infraestrutura existente do projeto
# ============================================================================

set -e  # Exit on error

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
command -v node >/dev/null 2>&1 || error "Node.js não está instalado!"
command -v pnpm >/dev/null 2>&1 || error "PNPM não está instalado! Execute: npm install -g pnpm"

# Check for tsx in multiple locations
if ! command -v tsx >/dev/null 2>&1; then
    # Check in pnpm global directory
    if [ -f "$HOME/.local/share/pnpm/tsx" ]; then
        # Add pnpm global bin to PATH for this script
        export PATH="$HOME/.local/share/pnpm:$PATH"
        log "TSX encontrado em $HOME/.local/share/pnpm"
    elif [ -f "/root/.local/share/pnpm/tsx" ]; then
        # For root user
        export PATH="/root/.local/share/pnpm:$PATH"
        log "TSX encontrado em /root/.local/share/pnpm"
    else
        error "TSX não está instalado! Execute: pnpm install -g tsx"
    fi
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js 18 ou superior é necessário!"
fi

success "Pré-requisitos verificados!"

# ============================================================================
# 2. CONFIGURAÇÃO DO ADMIN
# ============================================================================
log "⚙️  Configurando ambiente para o painel administrativo..."

# Perguntar o IP/domínio para acesso externo
read -p "Digite o IP ou domínio para acesso externo (ex: 192.168.1.100 ou admin.suaempresa.com): " EXTERNAL_HOST
if [ -z "$EXTERNAL_HOST" ]; then
    EXTERNAL_HOST="localhost"
    warn "Usando localhost como host padrão"
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
ADMIN_PASSWORD=$(openssl rand -base64 12)

# Log if using existing passwords
if [ -n "$EXISTING_DB_PASSWORD" ]; then
    log "Using existing PostgreSQL password from .env"
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
update_env "S3_ENDPOINT" "http://localhost:9000"
update_env "S3_ACCESS_KEY_ID" "minioadmin"
update_env "S3_SECRET_ACCESS_KEY" "${MINIO_PASSWORD}"
update_env "S3_BUCKET" "lobe"
update_env "S3_REGION" "us-east-1"
update_env "S3_FORCE_PATH_STYLE" "true"
update_env "MINIO_ROOT_USER" "minioadmin"
update_env "MINIO_ROOT_PASSWORD" "${MINIO_PASSWORD}"

# PostgreSQL
update_env "POSTGRES_PASSWORD" "${DB_PASSWORD}"
update_env "LOBE_DB_NAME" "agents_chat"

# Admin configuration
update_env "ADMIN_EMAIL" "admin@${EXTERNAL_HOST}"
update_env "ADMIN_DEFAULT_PASSWORD" "${ADMIN_PASSWORD}"
update_env "ENABLE_ADMIN_PANEL" "true"

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
# 4. INSTALAR DEPENDÊNCIAS
# ============================================================================
log "📦 Instalando dependências do projeto..."

# Configurar Node.js para build
export NODE_OPTIONS="--max-old-space-size=4096"

# Instalar dependências
pnpm install --no-frozen-lockfile

success "Dependências instaladas!"

# ============================================================================
# 5. GERAR ESQUEMA DO BANCO DE DADOS
# ============================================================================
log "🗄️  Gerando esquema do banco de dados com as novas tabelas admin..."

# Gerar schemas
pnpm db:generate

success "Esquema do banco de dados gerado!"

# ============================================================================
# 6. INICIAR SERVIÇOS DOCKER
# ============================================================================
log "🐳 Iniciando serviços Docker..."

# Parar serviços existentes se houver
docker-compose down 2>/dev/null || true

# Iniciar serviços usando o docker-compose existente
docker-compose up -d postgres redis minio

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
                minio/mc mb myminio/lobe --ignore-existing
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

# Executar migrações
log "Tentando executar migrações..."
# Always use localhost for migrations run from host machine
MIGRATION_URL="postgresql://postgres:${DB_PASSWORD}@localhost:5432/agents_chat"
log "Using database URL for migration: postgresql://postgres:****@localhost:5432/agents_chat"
MIGRATION_DB=1 DATABASE_URL="${MIGRATION_URL}" pnpm db:migrate || {
    warn "Migrações falharam - possivelmente o schema já existe"
    log "Verificando e adicionando coluna is_admin se necessário..."
    
    # Adicionar coluna is_admin se não existir
    docker exec agents-chat-postgres psql -U postgres -d agents_chat << 'SQLEOF'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
    END IF;
END$$;
SQLEOF
    success "Schema do banco de dados verificado!"
}

# ============================================================================
# 8. CRIAR USUÁRIO ADMINISTRADOR
# ============================================================================
log "👤 Criando usuário administrador inicial..."

# Criar admin diretamente no banco via SQL
log "Criando usuário administrador diretamente no banco..."

# Gerar UUID v4 para o admin
ADMIN_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(openssl rand -hex 8)-$(openssl rand -hex 4)-4$(openssl rand -hex 3)-$(openssl rand -hex 4)-$(openssl rand -hex 12)")
ADMIN_EMAIL="admin@${EXTERNAL_HOST}"
ADMIN_USERNAME="admin"

# Criar ou atualizar admin via SQL
docker exec agents-chat-postgres psql -U postgres -d agents_chat << EOF
-- Criar ou atualizar usuário admin
INSERT INTO users (
    id,
    email,
    username,
    full_name,
    is_admin,
    is_onboarded,
    created_at,
    updated_at
) VALUES (
    '${ADMIN_ID}',
    '${ADMIN_EMAIL}',
    '${ADMIN_USERNAME}',
    'Administrator',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    updated_at = NOW();

-- Verificar que o admin foi criado
SELECT id, email, username, full_name, is_admin 
FROM users 
WHERE email = '${ADMIN_EMAIL}';
EOF

echo ""
echo "=== CREDENCIAIS DO ADMIN ==="
echo "Email: ${ADMIN_EMAIL}"
echo "Senha: ${ADMIN_PASSWORD}"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"

success "Usuário administrador criado!"

# ============================================================================
# 9. BUILD DA APLICAÇÃO
# ============================================================================
log "🔨 Fazendo build da aplicação..."

# Build com configurações de produção
export DOCKER=true
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

pnpm build

success "Build concluído!"

# ============================================================================
# 10. CRIAR SCRIPTS DE INICIALIZAÇÃO
# ============================================================================
log "📝 Criando scripts de inicialização..."

# Script para desenvolvimento
cat > start-admin-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando ambiente de desenvolvimento com Admin Panel..."
echo ""
echo "Admin Panel: http://localhost:3010/admin"
echo "MinIO Console: http://localhost:9001"
echo ""

# Garantir que os serviços estão rodando
docker-compose up -d postgres redis minio

# Iniciar em modo desenvolvimento
pnpm dev
EOF

chmod +x start-admin-dev.sh

# Script para produção
cat > start-admin-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando ambiente de produção com Admin Panel..."

# Garantir que os serviços estão rodando
docker-compose up -d

# Iniciar servidor de produção
echo "Admin Panel disponível em: http://localhost:3210/admin"
pnpm start
EOF

chmod +x start-admin-prod.sh

success "Scripts criados!"

# ============================================================================
# 11. SALVAR INFORMAÇÕES DE DEPLOY
# ============================================================================
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
- Email: admin@${EXTERNAL_HOST}
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

# ============================================================================
# 12. VERIFICAÇÃO FINAL E INSTRUÇÕES
# ============================================================================
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
echo ""
echo "👤 CREDENCIAIS DO ADMIN:"
echo "   • Email: ${YELLOW}admin@${EXTERNAL_HOST}${NC}"
echo "   • Senha: ${YELLOW}${ADMIN_PASSWORD}${NC}"
echo "   • ${RED}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
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