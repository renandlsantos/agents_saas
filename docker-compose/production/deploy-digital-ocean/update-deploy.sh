#!/bin/bash

# =============================================================================
# AGENTS CHAT - UPDATE DEPLOY SCRIPT
# =============================================================================
# Script para atualizar o deploy com novas versões do código
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
if [ ! -f "Dockerfile" ]; then
    log_error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o diretório de produção existe
if [ ! -d "/opt/agents-chat" ]; then
    log_error "Diretório de produção não encontrado. Execute o deploy primeiro."
    exit 1
fi

# Navegar para o diretório de produção
cd /opt/agents-chat

# Fazer backup antes da atualização
log_info "Fazendo backup antes da atualização..."
if [ -f "backup.sh" ]; then
    ./backup.sh
else
    log_warning "Script de backup não encontrado. Criando backup manual..."
    DATE=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    docker-compose exec -T postgresql pg_dump -U postgres agents_chat_prod > backups/postgres-backup-$DATE.sql
    cp .env backups/env-backup-$DATE
fi

# Parar serviços
log_info "Parando serviços..."
docker-compose down

# Atualizar código do repositório
log_info "Atualizando código do repositório..."
cd /tmp
if [ -d "lobe-chat" ]; then
    cd lobe-chat
    git pull origin main
else
    git clone https://github.com/lobehub/lobe-chat.git
    cd lobe-chat
fi

# Perguntar sobre build personalizado
echo
read -p "Deseja fazer build da nova versão personalizada? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Fazendo build da nova versão..."

    # Fazer build da nova imagem
    docker build -t agents-chat-custom:latest .

    if [ $? -eq 0 ]; then
        log_success "Build da nova versão concluído"

        # Atualizar .env com nova imagem
        cd /opt/agents-chat
        sed -i 's/CUSTOM_IMAGE_NAME=.*/CUSTOM_IMAGE_NAME=agents-chat-custom:latest/' .env
        sed -i 's/USE_CUSTOM_BUILD=.*/USE_CUSTOM_BUILD=true/' .env

        # Remover imagem antiga
        docker rmi agents-chat-custom:$(docker images agents-chat-custom --format "table {{.Tag}}" | grep -v "latest" | head -1) 2>/dev/null || true

    else
        log_error "Erro no build da nova versão. Mantendo versão atual."
        cd /opt/agents-chat
    fi
else
    log_info "Atualizando imagem oficial..."
    cd /opt/agents-chat
    docker-compose pull
fi

# Iniciar serviços com nova versão
log_info "Iniciando serviços com nova versão..."
docker-compose up -d

# Aguardar serviços ficarem prontos
log_info "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status
log_info "Verificando status dos serviços..."
docker-compose ps

# Verificar logs
log_info "Verificando logs dos serviços..."
docker-compose logs --tail=20

# Teste de conectividade
log_info "Testando conectividade..."
if curl -f http://localhost:3210/api/health > /dev/null 2>&1; then
    log_success "Aplicação está respondendo corretamente"
else
    log_warning "Aplicação pode não estar respondendo. Verifique os logs."
fi

# Limpeza de imagens antigas
log_info "Limpando imagens antigas..."
docker image prune -f

log_success "Atualização concluída!"
echo
echo "=============================================================================="
echo "AGENTS CHAT - ATUALIZAÇÃO CONCLUÍDA"
echo "=============================================================================="
echo
echo "📋 Status:"
echo "  - Backup criado antes da atualização"
echo "  - Código atualizado do repositório"
echo "  - Nova imagem buildada (se solicitado)"
echo "  - Serviços reiniciados"
echo
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Status: docker-compose ps"
echo "  - Reiniciar: docker-compose restart"
echo
echo "⚠️  IMPORTANTE: Teste a aplicação para garantir que tudo está funcionando!"
echo "=============================================================================="
