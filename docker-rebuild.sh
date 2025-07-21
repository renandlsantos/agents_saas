#!/bin/bash

# ============================================================================
# 🐳 DOCKER REBUILD SCRIPT - AGENTS SAAS
# ============================================================================
# Script simplificado para rebuild usando apenas Docker
# Não requer Node.js, pnpm ou qualquer dependência local
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}=============================================================================="
echo -e "🐳 DOCKER REBUILD - AGENTS SAAS"
echo -e "==============================================================================${NC}"
echo ""

# ============================================================================
# 1. VERIFICAÇÃO INICIAL
# ============================================================================
log "🔍 Verificando pré-requisitos..."

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Verificar Docker
command -v docker >/dev/null 2>&1 || error "Docker não está instalado!"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose não está instalado!"

# Verificar se .env existe
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado! Execute setup-admin-environment.sh primeiro."
fi

success "Pré-requisitos verificados!"

# ============================================================================
# 2. PARAR E LIMPAR CONTAINERS
# ============================================================================
log "🛑 Parando containers existentes..."
docker-compose down

log "🧹 Limpando cache do Docker..."
docker system prune -f

# Remover volume de cache do Next.js
docker volume rm agents_saas_next-cache 2>/dev/null || true

success "Ambiente limpo!"

# ============================================================================
# 3. BUILD DA APLICAÇÃO
# ============================================================================
log "🔨 Construindo imagem Docker..."
log "Isso pode levar vários minutos..."

# Detectar memória disponível
if [ -f /proc/meminfo ]; then
    TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
else
    TOTAL_MEM_MB=8192  # Default 8GB
fi

# Calcular memória para Node.js (75% do total, máximo 24GB)
NODE_HEAP_SIZE=$((TOTAL_MEM_MB * 75 / 100))
if [ $NODE_HEAP_SIZE -gt 24576 ]; then
    NODE_HEAP_SIZE=24576
fi

log "💾 Usando ${NODE_HEAP_SIZE}MB de memória para o build"

# Build com argumentos otimizados
docker-compose build \
    --build-arg NODE_OPTIONS="--max-old-space-size=${NODE_HEAP_SIZE}" \
    --build-arg NEXT_PUBLIC_SERVICE_MODE=server \
    --build-arg NEXT_PUBLIC_ENABLE_NEXT_AUTH=1 \
    app

if [ $? -eq 0 ]; then
    success "✅ Imagem Docker construída com sucesso!"
else
    error "❌ Falha ao construir imagem Docker"
fi

# ============================================================================
# 4. INICIAR SERVIÇOS
# ============================================================================
log "🚀 Iniciando todos os serviços..."
docker-compose up -d

# Aguardar PostgreSQL iniciar
log "⏳ Aguardando PostgreSQL iniciar..."
for i in {1..30}; do
    if docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1; then
        success "PostgreSQL pronto!"
        break
    fi
    echo -n "."
    sleep 2
done

# Aguardar aplicação iniciar
log "⏳ Aguardando aplicação iniciar..."
for i in {1..60}; do
    if curl -f http://localhost:3210/api/health >/dev/null 2>&1; then
        success "Aplicação iniciada!"
        break
    fi
    if [ $i -eq 60 ]; then
        warn "Aplicação ainda está iniciando..."
        warn "Verifique os logs com: docker logs -f agents-chat"
    fi
    echo -n "."
    sleep 5
done

# ============================================================================
# 5. VERIFICAÇÃO FINAL
# ============================================================================
echo ""
echo "=============================================================================="
success "🎉 REBUILD CONCLUÍDO COM SUCESSO!"
echo "=============================================================================="
echo ""

# Status dos serviços
echo "📊 STATUS DOS SERVIÇOS:"
docker-compose ps

echo ""
echo "🔗 ACESSOS:"
echo "   • Aplicação: ${GREEN}http://localhost:3210${NC}"
echo "   • Admin Panel: ${GREEN}http://localhost:3210/admin${NC}"
echo "   • MinIO Console: ${BLUE}http://localhost:9001${NC}"
echo ""
echo "📝 COMANDOS ÚTEIS:"
echo "   • Ver logs: ${YELLOW}docker logs -f agents-chat${NC}"
echo "   • Parar tudo: ${YELLOW}docker-compose down${NC}"
echo "   • Reiniciar app: ${YELLOW}docker-compose restart app${NC}"
echo "   • Shell no container: ${YELLOW}docker exec -it agents-chat sh${NC}"
echo ""
echo "=============================================================================="