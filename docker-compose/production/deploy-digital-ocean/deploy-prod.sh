#!/bin/bash

# ==============================================================================
# AGENTS CHAT - DEPLOY PRODUÇÃO AUTOMATIZADO
# ==============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configurações
PROJECT_DIR="/opt/agents-chat"
DOMAIN="${1:-localhost}"
EMAIL="${2:-admin@localhost.com}"

echo "=============================================================================="
echo "AGENTS CHAT - DEPLOY PRODUÇÃO AUTOMATIZADO"
echo "=============================================================================="
echo "Domínio: $DOMAIN"
echo "Email: $EMAIL"
echo "=============================================================================="

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -eq 0 ]; then
    error "Não execute este script como root. Use um usuário normal com sudo."
    exit 1
fi

# Verificar se o usuário está no grupo docker
if ! groups | grep -q docker; then
    error "Usuário não está no grupo docker. Execute:"
    echo "sudo usermod -aG docker $USER"
    echo "newgrp docker"
    echo "Ou reconecte sua sessão SSH"
    exit 1
fi

# Função para configurar projeto
setup_project() {
    log "Configurando projeto Agents Chat..."

    # Criar diretório se não existir
    if [ ! -d "$PROJECT_DIR" ]; then
        log "Criando diretório do projeto..."
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $USER:$USER "$PROJECT_DIR"
        success "Diretório criado: $PROJECT_DIR"
    fi

    cd "$PROJECT_DIR"

    # Clonar ou atualizar repositório
    if [ ! -d ".git" ]; then
        log "Clonando repositório..."
        git clone https://github.com/lobehub/lobe-chat.git .
    else
        log "Atualizando repositório..."
        git pull origin main
    fi

    success "Projeto configurado"
}

# Função para baixar imagem pré-construída
download_prebuilt_image() {
    log "Baixando imagem pré-construída do Docker Hub..."

    # Baixar imagem oficial
    if docker pull lobehub/lobe-chat:latest; then
        # Tag local para facilitar uso
        docker tag lobehub/lobe-chat:latest agents-chat:latest
        success "Imagem pré-construída baixada e configurada"
        return 0
    else
        error "Falha ao baixar imagem pré-construída"
        return 1
    fi
}

# Função para configurar Docker Compose
setup_docker_compose() {
    log "Configurando Docker Compose..."

    cd "$PROJECT_DIR"

    # Criar docker-compose.yml para produção
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Banco de Dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: agents-chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${LOBE_DB_NAME}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - agents-chat

  # Redis para cache
  redis:
    image: redis:7-alpine
    container_name: agents-chat-redis
    restart: unless-stopped
    volumes:
      - ./data/redis:/data
    networks:
      - agents-chat

  # MinIO para armazenamento de arquivos
  minio:
    image: minio/minio:latest
    container_name: agents-chat-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - ./data/minio:/data
    networks:
      - agents-chat

  # Casdoor para autenticação
  casdoor:
    image: casbin/casdoor:latest
    container_name: agents-chat-casdoor
    restart: unless-stopped
    environment:
      - CASDOOR_DATABASE_TYPE=postgres
      - CASDOOR_DATABASE_HOST=postgres
      - CASDOOR_DATABASE_PORT=5432
      - CASDOOR_DATABASE_USER=postgres
      - CASDOOR_DATABASE_PASSWORD=${POSTGRES_PASSWORD}
      - CASDOOR_DATABASE_NAME=casdoor
      - CASDOOR_APPNAME=agents-chat
      - CASDOOR_ORIGIN=${NEXT_PUBLIC_SITE_URL}
    volumes:
      - ./data/casdoor:/app/conf
    depends_on:
      - postgres
    networks:
      - agents-chat

  # Aplicação principal
  app:
    image: agents-chat:latest
    container_name: agents-chat-app
    restart: unless-stopped
    environment:
      # Banco de Dados
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/${LOBE_DB_NAME}

      # Redis
      - REDIS_URL=redis://redis:6379

      # MinIO/S3
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - S3_BUCKET=${MINIO_LOBE_BUCKET}
      - S3_REGION=us-east-1
      - S3_FORCE_PATH_STYLE=true

      # Autenticação
      - AUTH_CASDOOR_ISSUER=${AUTH_CASDOOR_ISSUER}
      - AUTH_CASDOOR_CLIENT_ID=agents-chat
      - AUTH_CASDOOR_CLIENT_SECRET=agents-chat-secret

      # Aplicação
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
      - LOBE_PORT=${LOBE_PORT}
      - NODE_ENV=production

      # Segurança
      - NEXT_AUTH_SECRET=${NEXT_AUTH_SECRET}
      - KEY_VAULTS_SECRET=${KEY_VAULTS_SECRET}

      # API Keys
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - AZURE_API_KEY=${AZURE_API_KEY}
      - AZURE_ENDPOINT=${AZURE_ENDPOINT}
      - AZURE_API_VERSION=${AZURE_API_VERSION}

      # Configurações opcionais
      - ACCESS_CODE=${ACCESS_CODE}
      - DEBUG=${DEBUG}
    ports:
      - "${LOBE_PORT}:${LOBE_PORT}"
    depends_on:
      - postgres
      - redis
      - minio
      - casdoor
    networks:
      - agents-chat
    volumes:
      - ./logs/app:/app/logs

networks:
  agents-chat:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
EOF

    # Criar .env básico
    cat > .env << EOF
# Configurações do Banco de Dados
POSTGRES_PASSWORD=agents_chat_password_123
LOBE_DB_NAME=agents_chat_prod

# Configurações do MinIO
MINIO_ROOT_PASSWORD=minio_password_123
MINIO_PORT=9000

# Configurações do Casdoor
CASDOOR_PORT=8000

# Configurações da Aplicação
LOBE_PORT=3210
NEXT_PUBLIC_SITE_URL=http://$DOMAIN

# Configurações de Segurança
NEXT_AUTH_SECRET=your-secret-key-here-123
KEY_VAULTS_SECRET=your-key-vault-secret-123

# Configurações de Autenticação
AUTH_CASDOOR_ISSUER=http://$DOMAIN:8000

# Configurações do S3/MinIO
MINIO_LOBE_BUCKET=agents-chat-files

# API Keys (configure depois)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
AZURE_API_KEY=
AZURE_ENDPOINT=
AZURE_API_VERSION=

# Configurações Opcionais
ACCESS_CODE=
DEBUG=false
EOF

    success "Docker Compose configurado"
}

# Função para configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."

    # Criar configuração do Nginx
    cat > /tmp/nginx-agents-chat.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/agents-chat-access.log;
    error_log /var/log/nginx/agents-chat-error.log;

    # Proxy para aplicação
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Proxy para Casdoor
    location /casdoor/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Proxy para MinIO Console
    location /minio/ {
        proxy_pass http://localhost:9001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Limite de upload
    client_max_body_size 100M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
EOF

    # Mover para local correto
    sudo mv /tmp/nginx-agents-chat.conf /etc/nginx/sites-available/agents-chat

    # Ativar site
    if [ ! -L /etc/nginx/sites-enabled/agents-chat ]; then
        sudo ln -s /etc/nginx/sites-available/agents-chat /etc/nginx/sites-enabled/
    fi

    # Remover site padrão se existir
    if [ -L /etc/nginx/sites-enabled/default ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi

    # Testar configuração
    if sudo nginx -t; then
        sudo systemctl reload nginx
        success "Nginx configurado e recarregado"
    else
        error "Erro na configuração do Nginx"
        exit 1
    fi
}

# Função para configurar SSL
setup_ssl() {
    if [ "$DOMAIN" != "localhost" ]; then
        log "Configurando SSL com Let's Encrypt..."

        # Verificar se certbot está instalado
        if ! command -v certbot &> /dev/null; then
            log "Instalando certbot..."
            sudo apt update
            sudo apt install -y certbot python3-certbot-nginx
        fi

        # Obter certificado
        if sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --non-interactive --agree-tos; then
            success "SSL configurado para $DOMAIN"
        else
            warning "Falha ao configurar SSL. Verifique se o domínio aponta para este servidor."
        fi
    else
        warning "SSL não configurado para localhost"
    fi
}

# Função para criar diretórios
create_directories() {
    log "Criando diretórios necessários..."

    cd "$PROJECT_DIR"

    mkdir -p data/{postgres,minio,redis}
    mkdir -p logs/{app,casdoor,nginx}
    mkdir -p cache

    success "Diretórios criados"
}

# Função para iniciar serviços
start_services() {
    log "Iniciando serviços..."

    cd "$PROJECT_DIR"

    # Parar serviços existentes
    docker-compose down 2>/dev/null || true

    # Iniciar serviços
    if docker-compose up -d; then
        success "Serviços iniciados com sucesso!"

        # Aguardar um pouco e verificar status
        sleep 10
        docker-compose ps

        echo
        success "Deploy de produção concluído!"
        echo
        log "Acesse: http://$DOMAIN"
        if [ "$DOMAIN" != "localhost" ]; then
            log "HTTPS: https://$DOMAIN"
        fi
        echo
        log "Comandos úteis:"
        log "  cd $PROJECT_DIR"
        log "  docker-compose logs -f    # Ver logs"
        log "  docker-compose down       # Parar serviços"
        log "  docker-compose up -d      # Reiniciar serviços"
    else
        error "Falha ao iniciar serviços"
        exit 1
    fi
}

# Função principal
main() {
    # Verificar argumentos
    if [ -z "$1" ]; then
        echo "Uso: $0 <dominio> [email]"
        echo "Exemplo: $0 meusite.com admin@meusite.com"
        echo "Exemplo: $0 localhost"
        exit 1
    fi

    # Executar etapas
    setup_project
    download_prebuilt_image
    setup_docker_compose
    create_directories
    setup_nginx
    setup_ssl
    start_services
}

# Executar função principal
main "$@"
