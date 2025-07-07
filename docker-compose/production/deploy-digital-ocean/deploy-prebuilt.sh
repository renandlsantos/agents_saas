#!/bin/bash

# ==============================================================================
# AGENTS CHAT - DEPLOY COM IMAGEM PRÉ-CONSTRUÍDA (SEM BUILD LOCAL)
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
EMAIL="${2:-admin@example.com}"

echo "=============================================================================="
echo "AGENTS CHAT - DEPLOY COM IMAGEM PRÉ-CONSTRUÍDA"
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

# Função para baixar e configurar o projeto
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

    # Copiar arquivo de configuração
    cp docker-compose/production/docker-compose.yml .

    # Substituir variáveis no arquivo
    sed -i "s/localhost/$DOMAIN/g" docker-compose.yml
    sed -i "s/admin@example.com/$EMAIL/g" docker-compose.yml

    # Usar imagem pré-construída
    sed -i 's/image: agents-chat:latest/image: lobehub\/lobe-chat:latest/g' docker-compose.yml

    success "Docker Compose configurado"
}

# Função para configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."

    # Copiar configuração do Nginx
    cp docker-compose/production/nginx.conf /tmp/nginx-agents-chat.conf

    # Substituir domínio
    sed -i "s/localhost/$DOMAIN/g" /tmp/nginx-agents-chat.conf

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
        success "Deploy concluído!"
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
    setup_nginx
    setup_ssl
    start_services
}

# Executar função principal
main "$@"
