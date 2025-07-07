#!/bin/bash

# ==============================================================================
# AGENTS CHAT - DEPLOY DESENVOLVIMENTO AUTOMATIZADO
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
PROJECT_DIR="/opt/agents-chat-dev"
PORT="${1:-3210}"

echo "=============================================================================="
echo "AGENTS CHAT - DEPLOY DESENVOLVIMENTO AUTOMATIZADO"
echo "=============================================================================="
echo "Porta: $PORT"
echo "Acesso: http://localhost:$PORT"
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
    log "Configurando projeto Agents Chat (Dev)..."

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
        docker tag lobehub/lobe-chat:latest agents-chat-dev:latest
        success "Imagem pré-construída baixada e configurada"
        return 0
    else
        error "Falha ao baixar imagem pré-construída"
        return 1
    fi
}

# Função para configurar Docker Compose (versão simplificada)
setup_docker_compose() {
    log "Configurando Docker Compose (Dev)..."

    cd "$PROJECT_DIR"

    # Criar docker-compose.yml simplificado para desenvolvimento
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Banco de Dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: agents-chat-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: agents_chat_dev_123
      POSTGRES_DB: agents_chat_dev
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - agents-chat-dev

  # Redis para cache
  redis:
    image: redis:7-alpine
    container_name: agents-chat-redis-dev
    restart: unless-stopped
    volumes:
      - ./data/redis:/data
    ports:
      - "6379:6379"
    networks:
      - agents-chat-dev

  # MinIO para armazenamento de arquivos
  minio:
    image: minio/minio:latest
    container_name: agents-chat-minio-dev
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - ./data/minio:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - agents-chat-dev

  # Casdoor para autenticação
  casdoor:
    image: casdoor/casdoor:latest
    container_name: agents-chat-casdoor-dev
    restart: unless-stopped
    environment:
      - CASDOOR_DATABASE_TYPE=postgres
      - CASDOOR_DATABASE_HOST=postgres
      - CASDOOR_DATABASE_PORT=5432
      - CASDOOR_DATABASE_USER=postgres
      - CASDOOR_DATABASE_PASSWORD=agents_chat_dev_123
      - CASDOOR_DATABASE_NAME=casdoor_dev
      - CASDOOR_APPNAME=agents-chat-dev
      - CASDOOR_ORIGIN=http://localhost:$PORT
    volumes:
      - ./data/casdoor:/app/conf
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    networks:
      - agents-chat-dev

  # Aplicação principal
  app:
    image: agents-chat-dev:latest
    container_name: agents-chat-app-dev
    restart: unless-stopped
    environment:
      # Banco de Dados
      - DATABASE_URL=postgresql://postgres:agents_chat_dev_123@postgres:5432/agents_chat_dev

      # Redis
      - REDIS_URL=redis://redis:6379

      # MinIO/S3
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=minioadmin123
      - S3_BUCKET=agents-chat-dev
      - S3_REGION=us-east-1
      - S3_FORCE_PATH_STYLE=true

      # Autenticação
      - AUTH_CASDOOR_ISSUER=http://localhost:8000
      - AUTH_CASDOOR_CLIENT_ID=agents-chat-dev
      - AUTH_CASDOOR_CLIENT_SECRET=agents-chat-dev-secret

      # Aplicação
      - NEXT_PUBLIC_SITE_URL=http://localhost:$PORT
      - LOBE_PORT=$PORT
      - NODE_ENV=development

      # Segurança
      - NEXT_AUTH_SECRET=dev-secret-key-123
      - KEY_VAULTS_SECRET=dev-key-vault-123

      # API Keys (configure depois)
      - OPENAI_API_KEY=
      - ANTHROPIC_API_KEY=
      - GOOGLE_API_KEY=
      - AZURE_API_KEY=
      - AZURE_ENDPOINT=
      - AZURE_API_VERSION=

      # Configurações opcionais
      - ACCESS_CODE=
      - DEBUG=true
    ports:
      - "$PORT:$PORT"
    depends_on:
      - postgres
      - redis
      - minio
      - casdoor
    networks:
      - agents-chat-dev
    volumes:
      - ./logs/app:/app/logs

networks:
  agents-chat-dev:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
EOF

    success "Docker Compose configurado para desenvolvimento"
}

# Função para criar diretórios
create_directories() {
    log "Criando diretórios necessários..."

    cd "$PROJECT_DIR"

    mkdir -p data/{postgres,minio,redis,casdoor}
    mkdir -p logs/app
    mkdir -p cache

    success "Diretórios criados"
}

# Função para iniciar serviços
start_services() {
    log "Iniciando serviços de desenvolvimento..."

    cd "$PROJECT_DIR"

    # Parar serviços existentes
    docker-compose down 2>/dev/null || true

    # Iniciar serviços
    if docker-compose up -d; then
        success "Serviços iniciados com sucesso!"

        # Aguardar um pouco e verificar status
        sleep 15
        docker-compose ps

        echo
        success "Deploy de desenvolvimento concluído!"
        echo
        log "Acesse: http://localhost:$PORT"
        log "MinIO Console: http://localhost:9001 (admin/admin123)"
        log "Casdoor: http://localhost:8000"
        echo
        log "Comandos úteis:"
        log "  cd $PROJECT_DIR"
        log "  docker-compose logs -f    # Ver logs"
        log "  docker-compose down       # Parar serviços"
        log "  docker-compose up -d      # Reiniciar serviços"
        echo
        warning "Configure suas API Keys no arquivo .env depois!"
    else
        error "Falha ao iniciar serviços"
        exit 1
    fi
}

# Função principal
main() {
    # Verificar argumentos
    if [ -z "$1" ]; then
        echo "Uso: $0 [porta]"
        echo "Exemplo: $0 3210"
        echo "Padrão: porta 3210"
        exit 1
    fi

    # Executar etapas
    setup_project
    download_prebuilt_image
    setup_docker_compose
    create_directories
    start_services
}

# Executar função principal
main "$@"
