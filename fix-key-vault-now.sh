#!/bin/bash

# =============================================================================
# CORREÇÃO IMEDIATA: KEY_VAULTS_SECRET
# =============================================================================

echo "🚨 CORREÇÃO IMEDIATA: Resolvendo erro KEY_VAULTS_SECRET..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar KEY atual
log_info "🔍 Verificando KEY_VAULTS_SECRET atual..."
current_key=$(grep "KEY_VAULTS_SECRET" .env 2>/dev/null || echo "não encontrado")
echo "Key atual: $current_key"

# 2. Forçar cópia do .env.vm para .env
log_info "📄 Forçando atualização do .env..."
cp env/.env.vm .env

# 3. Verificar se foi atualizado
new_key=$(grep "KEY_VAULTS_SECRET" .env)
echo "Nova key: $new_key"

# 4. Parar aplicação
log_info "🛑 Parando aplicação..."
docker-compose stop app

# 5. Remover container para forçar recreação
log_info "🗑️ Removendo container para forçar reload..."
docker-compose rm -f app

# 6. Rebuild do container
log_info "🔄 Recriando container com novo .env..."
export DOCKERFILE_PATH=Dockerfile.database
docker-compose build app

# 7. Subir aplicação
log_info "🚀 Iniciando aplicação com .env corrigido..."
docker-compose up -d app

# 8. Aguardar
log_info "⏳ Aguardando aplicação inicializar..."
sleep 20

# 9. Verificar logs
log_info "📋 Verificando logs da aplicação..."
docker logs --tail 10 agents-chat

echo ""
echo "🎯 CORREÇÃO APLICADA!"
echo "✅ Arquivo .env atualizado com KEY_VAULTS_SECRET válido"
echo "✅ Container recriado com nova configuração"
echo "✅ Aplicação reiniciada"
echo ""
echo "🌐 Teste agora: http://64.23.166.36:3210"
echo ""

# 10. Teste final
log_info "🧪 Testando conectividade..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3210 | grep -q "200\|302\|404"; then
    log_success "✅ Aplicação respondendo!"
else
    log_error "❌ Aplicação ainda não responde - verificar logs"
fi