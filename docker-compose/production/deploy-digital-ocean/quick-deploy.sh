#!/bin/bash

# =============================================================================
# AGENTS CHAT - QUICK DEPLOY SCRIPT
# =============================================================================
# Script rápido para deploy em servidor já configurado
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "docker-compose-production.yml" ]; then
    log_error "Execute este script no diretório docker-compose/deploy-digital-ocean"
    exit 1
fi

# Perguntar sobre build personalizado
echo
read -p "Deseja fazer build da sua versão personalizada? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    USE_CUSTOM_BUILD=true
    log_info "Configurando para build personalizado..."

    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado. Execute o script completo de deploy primeiro."
        exit 1
    fi

    # Fazer build da imagem personalizada
    log_info "Fazendo build da imagem personalizada..."
    docker build -t agents-chat-custom:latest .

    if [ $? -eq 0 ]; then
        log_success "Build da imagem personalizada concluído"
        CUSTOM_IMAGE_NAME="agents-chat-custom:latest"
    else
        log_error "Erro no build da imagem. Usando imagem oficial."
        CUSTOM_IMAGE_NAME="lobehub/lobe-chat-database:latest"
    fi
else
    USE_CUSTOM_BUILD=false
    CUSTOM_IMAGE_NAME="lobehub/lobe-chat-database:latest"
    log_info "Usando imagem oficial do Docker Hub"
fi

# Criar diretórios necessários
log_info "Criando diretórios..."
sudo mkdir -p /opt/agents-chat/{data/{postgres,minio,redis},logs/{app,casdoor,nginx},cache,backups,ssl}

# Copiar arquivos
log_info "Copiando arquivos de configuração..."
sudo cp docker-compose-production.yml /opt/agents-chat/docker-compose.yml
sudo cp nginx-production.conf /opt/agents-chat/nginx.conf
sudo cp deploy-production.sh /opt/agents-chat/
sudo cp README-DEPLOY-PROD.md /opt/agents-chat/

# Definir permissões
sudo chown -R $USER:$USER /opt/agents-chat

# Criar .env se não existir
if [ ! -f "/opt/agents-chat/.env" ]; then
    log_info "Criando arquivo .env..."
    cat > /opt/agents-chat/.env <<EOF
# =============================================================================
# AGENTS CHAT - CONFIGURAÇÃO DE PRODUÇÃO
# =============================================================================

# Configurações do Banco de Dados
LOBE_DB_NAME=agents_chat_prod
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Configurações do MinIO (S3)
MINIO_PORT=9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
MINIO_LOBE_BUCKET=agents-chat-files

# Configurações do Casdoor (Autenticação)
CASDOOR_PORT=8000
AUTH_CASDOOR_ISSUER=http://localhost:8000

# Configurações do LobeChat
LOBE_PORT=3210

# Configurações de Segurança
KEY_VAULTS_SECRET=$(openssl rand -base64 32)
NEXT_AUTH_SECRET=$(openssl rand -base64 32)

# Configurações de API Keys (CONFIGURE ESTAS!)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
AZURE_API_KEY=your_azure_api_key_here
AZURE_ENDPOINT=your_azure_endpoint_here
AZURE_API_VERSION=2024-02-15-preview

# Configurações de Proxy (opcional)
OPENAI_PROXY_URL=
ANTHROPIC_PROXY_URL=
GOOGLE_PROXY_URL=

# Configurações de Domínio (CONFIGURE ESTE!)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Configurações de Email (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Configurações de Monitoramento (opcional)
SENTRY_DSN=

# Configurações de Segurança
ACCESS_CODE=

# Configurações de Features
FEATURE_FLAGS=

# Configurações de Debug
DEBUG=false

# Configuração da Imagem (não altere)
CUSTOM_IMAGE_NAME=${CUSTOM_IMAGE_NAME}
USE_CUSTOM_BUILD=${USE_CUSTOM_BUILD}
EOF
    log_success "Arquivo .env criado"
else
    log_warning "Arquivo .env já existe. Verifique se as configurações estão corretas."
fi

# Navegar para o diretório
cd /opt/agents-chat

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Execute o script completo de deploy primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado. Execute o script completo de deploy primeiro."
    exit 1
fi

# Perguntar sobre configuração de domínio
read -p "Deseja configurar SSL com Let's Encrypt agora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Digite seu domínio (ex: agents.yourdomain.com): " DOMAIN
    if [ ! -z "$DOMAIN" ]; then
        # Atualizar configuração do Nginx
        sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf
        sed -i "s/your-domain.com/$DOMAIN/g" .env

        # Configurar SSL
        log_info "Configurando SSL para $DOMAIN..."
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

        # Configurar renovação automática
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

        log_success "SSL configurado para $DOMAIN"
    fi
fi

# Iniciar serviços
log_info "Iniciando serviços..."
docker-compose up -d

# Aguardar serviços ficarem prontos
log_info "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status
log_info "Verificando status dos serviços..."
docker-compose ps

# Mostrar informações finais
log_success "Deploy rápido concluído!"
echo
echo "=============================================================================="
echo "AGENTS CHAT - DEPLOY RÁPIDO CONCLUÍDO"
echo "=============================================================================="
echo
echo "📁 Diretório: /opt/agents-chat"
echo "🌐 Acesse: https://your-domain.com (configure seu domínio)"
echo "🔧 Porta: 3210"
echo
echo "📋 Próximos passos:"
echo "  1. Configure suas API keys no arquivo .env"
echo "  2. Configure seu domínio no arquivo .env"
echo "  3. Teste a aplicação"
echo
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Reiniciar: docker-compose restart"
echo "  - Parar: docker-compose down"
echo "  - Status: docker-compose ps"
echo
echo "⚠️  IMPORTANTE: Configure suas API keys antes de usar!"
echo "=============================================================================="
