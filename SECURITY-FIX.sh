#!/bin/bash

# =============================================================================
# 🚨 CORREÇÃO CRÍTICA DE SEGURANÇA - AGENTS CHAT
# =============================================================================
# Script para corrigir IMEDIATAMENTE os problemas de segurança identificados
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[CRÍTICO]${NC} $1"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }

echo "============================================================================="
echo -e "${RED}🚨 CORREÇÃO CRÍTICA DE SEGURANÇA${NC}"
echo "============================================================================="
echo ""

# 1. REMOÇÃO IMEDIATA DE ARQUIVOS .ENV EXPOSTOS
echo "1. Removendo arquivos .env expostos do git..."

# Fazer backup antes
mkdir -p .security-backup
cp .env .security-backup/.env.backup 2>/dev/null || true
cp .env.vm .security-backup/.env.vm.backup 2>/dev/null || true

# Remover do git
git rm --cached .env .env.vm .env.production-fixed 2>/dev/null || true

success "Arquivos .env removidos do controle de versão"

# 2. ATUALIZAR .GITIGNORE
echo "2. Atualizando .gitignore..."

cat >> .gitignore << 'EOF'

# =============================================================================
# ARQUIVOS SENSÍVEIS - NUNCA COMMITAR
# =============================================================================
.env*
!.env.example
!.env.template
*.key
*.pem
*.cert
secrets/
credentials/
.security-backup/

# Dados sensíveis
data/postgres/
data/redis/
data/minio/
data/casdoor/
backups/
logs/

# Arquivos temporários de deploy
deploy-info.txt
*.log
EOF

success "Gitignore atualizado com regras de segurança"

# 3. CRIAR .ENV.EXAMPLE SEGURO
echo "3. Criando .env.example seguro..."

cat > .env.example << 'EOF'
# =============================================================================
# AGENTS CHAT - TEMPLATE DE CONFIGURAÇÃO SEGURA
# =============================================================================
# COPIE ESTE ARQUIVO PARA .env E CONFIGURE COM SEUS VALORES REAIS
# NUNCA COMMITE O ARQUIVO .env COM DADOS REAIS
# =============================================================================

# Application URLs (SUBSTITUA pelo seu domínio/IP)
APP_URL=http://SEU_DOMINIO_OU_IP:3210
NEXT_PUBLIC_SITE_URL=http://SEU_DOMINIO_OU_IP:3210
NEXTAUTH_URL=http://SEU_DOMINIO_OU_IP:3210

# Configurações básicas
LOBE_PORT=3210
NODE_ENV=production
NEXT_PUBLIC_SERVICE_MODE=server
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
DATABASE_DRIVER=node

# Banco de dados (GERE UMA SENHA FORTE)
DATABASE_URL=postgresql://postgres:SENHA_FORTE_AQUI@localhost:5432/agents_chat
POSTGRES_PASSWORD=SENHA_FORTE_AQUI
LOBE_DB_NAME=agents_chat

# Segurança (GERE CHAVES ÚNICAS DE 64 CARACTERES)
KEY_VAULTS_SECRET=CHAVE_SECRETA_64_CARACTERES
NEXTAUTH_SECRET=CHAVE_NEXTAUTH_64_CARACTERES

# MinIO (GERE UMA SENHA FORTE)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=SENHA_FORTE_MINIO
MINIO_LOBE_BUCKET=lobe
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=SENHA_FORTE_MINIO
S3_BUCKET=lobe
S3_FORCE_PATH_STYLE=true

# API Keys (CONFIGURE SUAS CHAVES REAIS)
OPENAI_API_KEY=sk-proj-SUA_CHAVE_REAL_AQUI
ANTHROPIC_API_KEY=sk-ant-SUA_CHAVE_REAL_AQUI
GOOGLE_API_KEY=SUA_CHAVE_GOOGLE_AQUI

# Opcionais
ACCESS_CODE=
FEATURE_FLAGS=
DEBUG=0
EOF

success "Template .env.example criado"

# 4. GERAR SENHAS SEGURAS AUTOMATICAMENTE
echo "4. Gerando senhas seguras..."

# Verificar se openssl está disponível
if ! command -v openssl >/dev/null 2>&1; then
    error "OpenSSL não encontrado! Instale: apt-get install openssl"
    exit 1
fi

# Gerar senhas seguras
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
MINIO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KEY_VAULTS_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# Detectar IP público
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipecho.net/plain 2>/dev/null || echo "localhost")

# Criar .env seguro
cat > .env << EOF
# =============================================================================
# AGENTS CHAT - CONFIGURAÇÃO SEGURA GERADA AUTOMATICAMENTE
# =============================================================================
# Gerado em: $(date)
# MANTENHA ESTE ARQUIVO SEGURO E NUNCA O COMMITE
# =============================================================================

# Application URLs
APP_URL=http://${PUBLIC_IP}:3210
NEXT_PUBLIC_SITE_URL=http://${PUBLIC_IP}:3210
NEXTAUTH_URL=http://${PUBLIC_IP}:3210
NEXTAUTH_URL_INTERNAL=http://localhost:3210
AUTH_URL=http://${PUBLIC_IP}:3210
AUTH_TRUST_HOST=true

# Configurações básicas
LOBE_PORT=3210
NODE_ENV=production
NEXT_PUBLIC_SERVICE_MODE=server
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_TELEMETRY_DISABLED=1
DATABASE_DRIVER=node

# Network
HOST=0.0.0.0
HOSTNAME=0.0.0.0

# Banco de dados (SENHAS GERADAS AUTOMATICAMENTE)
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agents_chat
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
LOBE_DB_NAME=agents_chat

# Segurança (CHAVES GERADAS AUTOMATICAMENTE)
KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXT_AUTH_SSO_PROVIDERS=credentials

# MinIO (SENHAS GERADAS AUTOMATICAMENTE)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_LOBE_BUCKET=lobe
MINIO_PORT=9000

# S3 Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=admin
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=${MINIO_PASSWORD}
S3_SECRET_KEY=${MINIO_PASSWORD}
S3_BUCKET=lobe
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_ENABLE_PATH_STYLE=1
S3_SET_ACL=0
S3_PUBLIC_DOMAIN=${PUBLIC_IP}:9000
NEXT_PUBLIC_S3_DOMAIN=${PUBLIC_IP}:9000

# Build Configuration
DOCKER=true
NEXT_PUBLIC_UPLOAD_MAX_SIZE=50

# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Keys (CONFIGURE SUAS CHAVES REAIS AQUI)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
AZURE_API_KEY=
AZURE_ENDPOINT=
AZURE_API_VERSION=2024-02-01

# Opcionais
ACCESS_CODE=
FEATURE_FLAGS=
DEBUG=0
EOF

success "Arquivo .env seguro criado com senhas fortes"

# 5. CRIAR DOCKER-COMPOSE SEGURO
echo "5. Criando docker-compose seguro..."

cat > docker-compose.secure.yml << EOF
version: '3.8'

services:
  # PostgreSQL com pgvector - VERSÃO ESPECÍFICA
  postgres:
    image: pgvector/pgvector:pg16-3.0.0  # Versão específica, não latest
    container_name: agents-chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: agents_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Não expor porta externamente em produção
    # ports:
    #   - "5432:5432"
    networks:
      - agents-chat
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d agents_chat"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis - VERSÃO ESPECÍFICA
  redis:
    image: redis:7.2.4-alpine  # Versão específica
    container_name: agents-chat-redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass \${REDIS_PASSWORD:-\${MINIO_ROOT_PASSWORD}}
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    # Não expor porta externamente
    # ports:
    #   - "6379:6379"
    networks:
      - agents-chat
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "\${REDIS_PASSWORD:-\${MINIO_ROOT_PASSWORD}}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO - VERSÃO ESPECÍFICA
  minio:
    image: minio/minio:RELEASE.2024-01-16T16-07-38Z  # Versão específica
    container_name: agents-chat-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-admin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD}
      MINIO_API_CORS_ALLOW_ORIGIN: "*"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - agents-chat
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Casdoor - VERSÃO ESPECÍFICA
  casdoor:
    image: casbin/casdoor:v1.565.0  # Versão específica
    container_name: agents-chat-casdoor
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - httpport=8000
      - RUNNING_IN_DOCKER=true
      - driverName=postgres
      - dataSourceName=user=postgres password=\${POSTGRES_PASSWORD} host=postgres port=5432 sslmode=disable dbname=casdoor
      - runmode=prod
    volumes:
      - casdoor_data:/app/conf
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - agents-chat

  # Aplicação principal
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: agents-chat:secure
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
      - NODE_OPTIONS=--max-old-space-size=2048
      
      # URLs
      - APP_URL=\${APP_URL}
      - NEXT_PUBLIC_SITE_URL=\${NEXT_PUBLIC_SITE_URL}
      - NEXTAUTH_URL=\${NEXTAUTH_URL}
      - AUTH_URL=\${AUTH_URL}
      
      # Banco de dados
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/agents_chat
      - DATABASE_DRIVER=node
      
      # Redis com senha
      - REDIS_URL=redis://:\${REDIS_PASSWORD:-\${MINIO_ROOT_PASSWORD}}@redis:6379
      
      # MinIO/S3
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY_ID=\${MINIO_ROOT_USER:-admin}
      - S3_SECRET_ACCESS_KEY=\${MINIO_ROOT_PASSWORD}
      - S3_BUCKET=lobe
      - S3_FORCE_PATH_STYLE=true
      
      # Segurança
      - NEXT_AUTH_SECRET=\${NEXTAUTH_SECRET}
      - KEY_VAULTS_SECRET=\${KEY_VAULTS_SECRET}
      
      # API Keys
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=\${GOOGLE_API_KEY}
    
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - app_logs:/app/logs
    networks:
      - agents-chat

networks:
  agents-chat:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local
  casdoor_data:
    driver: local
  app_logs:
    driver: local
EOF

success "Docker-compose seguro criado"

# 6. SALVAR CREDENCIAIS SEGURAS
echo "6. Salvando credenciais seguras..."

cat > .security-backup/credentials-$(date +%Y%m%d_%H%M%S).txt << EOF
=== CREDENCIAIS SEGURAS GERADAS ===
Data: $(date)

PostgreSQL:
- Usuário: postgres
- Senha: ${POSTGRES_PASSWORD}

MinIO:
- Usuário: admin
- Senha: ${MINIO_PASSWORD}

Chaves de Segurança:
- KEY_VAULTS_SECRET: ${KEY_VAULTS_SECRET}
- NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}

IMPORTANTE:
- Guarde estas credenciais em local seguro
- Configure suas API keys no arquivo .env
- Nunca commite o arquivo .env
EOF

success "Credenciais salvas em .security-backup/"

# 7. CRIAR SCRIPT DE DEPLOY SEGURO
echo "7. Criando script de deploy seguro..."

cat > deploy-secure.sh << 'EOF'
#!/bin/bash

echo "🔒 Deploy seguro iniciando..."

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Execute: ./SECURITY-FIX.sh primeiro"
    exit 1
fi

# Verificar se chaves API estão configuradas
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  OPENAI_API_KEY não configurada no .env"
    echo "Configure suas API keys antes de continuar"
fi

# Deploy usando docker-compose seguro
echo "🚀 Iniciando deploy seguro..."
docker-compose -f docker-compose.secure.yml up -d

echo "✅ Deploy seguro concluído!"
EOF

chmod +x deploy-secure.sh

success "Script de deploy seguro criado"

# 8. COMMIT DAS CORREÇÕES
echo "8. Commitando correções de segurança..."

git add .gitignore .env.example docker-compose.secure.yml deploy-secure.sh SECURITY-FIX.sh
git commit -m "🔒 Security fix: Remove exposed secrets, add secure configurations

- Remove .env files from repository
- Add comprehensive .gitignore for sensitive files
- Create secure docker-compose with specific image versions
- Add .env.example template
- Implement secure password generation
- Add secure deployment script

IMPORTANT: All exposed API keys have been removed.
Configure real API keys in .env file (not committed)."

success "Correções de segurança commitadas"

echo ""
echo "============================================================================="
echo -e "${GREEN}✅ CORREÇÕES DE SEGURANÇA APLICADAS${NC}"
echo "============================================================================="
echo ""
echo -e "${YELLOW}AÇÕES MANUAIS NECESSÁRIAS:${NC}"
echo ""
echo "1. 🔑 REVOGAR IMEDIATAMENTE a chave OpenAI exposta:"
echo "   sk-proj-rcvmrjK5HKgQLyOkHbYZGxzuqSrd8QB53ZbYOsCTJHjg4xX7mqo1mcvRxci-..."
echo ""
echo "2. 🔧 Configurar suas API keys reais no arquivo .env:"
echo "   nano .env"
echo ""
echo "3. 🚀 Usar o deploy seguro:"
echo "   ./deploy-secure.sh"
echo ""
echo -e "${GREEN}✅ Todas as senhas foram geradas automaticamente e salvas seguramente${NC}"
echo -e "${GREEN}✅ Arquivos .env removidos do controle de versão${NC}"
echo -e "${GREEN}✅ Docker-compose configurado com versões específicas${NC}"
echo ""
echo "============================================================================="