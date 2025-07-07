#!/bin/bash

# Script para fazer pull seguro no deploy
# Resolve conflitos e garante que o código mais recente seja baixado

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[GIT]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Não é um repositório git!"
    exit 1
fi

log "Salvando mudanças locais (se houver)..."
git stash push -m "Deploy stash $(date +%Y%m%d-%H%M%S)" || true

log "Buscando atualizações do remoto..."
git fetch origin

log "Resetando para o estado do origin/main..."
git reset --hard origin/main

log "Fazendo pull das últimas mudanças..."
git pull origin main

log "Limpando arquivos não rastreados..."
git clean -fd

# Verificar se há stash para aplicar
if git stash list | grep -q "Deploy stash"; then
    log "Tentando aplicar mudanças locais salvas..."
    git stash pop || {
        error "Conflito ao aplicar mudanças locais. Mudanças foram mantidas no stash."
        log "Use 'git stash list' para ver e 'git stash pop' para tentar novamente."
    }
fi

# Mostrar status final
log "Status final do repositório:"
git status --short

# Mostrar último commit
log "Último commit:"
git log -1 --oneline

success "Pull concluído com sucesso!"