#!/bin/bash

# =============================================================================
# 🔧 TROUBLESHOOTING AGENTS CHAT
# =============================================================================
# Script para diagnosticar e resolver problemas comuns
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
highlight() { echo -e "${PURPLE}[HIGHLIGHT]${NC} $1"; }

echo "============================================================================="
echo -e "${BLUE}🔧 TROUBLESHOOTING AGENTS CHAT${NC}"
echo "============================================================================="
echo ""

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
    exit 1
fi

# 2. Verificar status dos containers
echo -e "${PURPLE}1. STATUS DOS CONTAINERS${NC}"
echo "========================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep agents-chat
echo ""

# 3. Verificar logs de erro
echo -e "${PURPLE}2. LOGS DE ERRO RECENTES${NC}"
echo "========================="
echo "Aplicação:"
docker logs agents-chat --tail 20 2>&1 | grep -i error || echo "Nenhum erro recente"
echo ""
echo "PostgreSQL:"
docker logs agents-chat-postgres --tail 20 2>&1 | grep -i error || echo "Nenhum erro recente"
echo ""

# 4. Verificar conectividade dos serviços
echo -e "${PURPLE}3. TESTE DE CONECTIVIDADE${NC}"
echo "========================="

# Teste da aplicação
if curl -f -s http://localhost:3210 >/dev/null 2>&1; then
    success "✅ Aplicação: OK (http://localhost:3210)"
else
    error "❌ Aplicação: ERRO (http://localhost:3210)"
fi

# Teste do PostgreSQL
if docker exec agents-chat-postgres pg_isready -U postgres -d agents_chat >/dev/null 2>&1; then
    success "✅ PostgreSQL: OK"
else
    error "❌ PostgreSQL: ERRO"
fi

# Teste do Redis
if docker exec agents-chat-redis redis-cli ping >/dev/null 2>&1; then
    success "✅ Redis: OK"
else
    error "❌ Redis: ERRO"
fi

# Teste do MinIO
if curl -f -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    success "✅ MinIO: OK"
else
    error "❌ MinIO: ERRO"
fi

# Teste do Casdoor
if curl -f -s http://localhost:8000 >/dev/null 2>&1; then
    success "✅ Casdoor: OK"
else
    error "❌ Casdoor: ERRO"
fi

echo ""

# 5. Verificar extensão pgvector
echo -e "${PURPLE}4. VERIFICAÇÃO DO PGVECTOR${NC}"
echo "========================="
if docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT * FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | grep -q "vector"; then
    success "✅ Extensão pgvector: INSTALADA"
else
    error "❌ Extensão pgvector: NÃO INSTALADA"
    echo ""
    warn "SOLUÇÃO: Execute os comandos abaixo para instalar o pgvector:"
    echo "docker exec agents-chat-postgres psql -U postgres -d agents_chat -c \"CREATE EXTENSION IF NOT EXISTS vector;\""
    echo ""
fi

# 6. Verificar variáveis de ambiente críticas
echo -e "${PURPLE}5. VARIÁVEIS DE AMBIENTE${NC}"
echo "========================="
if docker exec agents-chat env | grep -q "DATABASE_URL="; then
    success "✅ DATABASE_URL: CONFIGURADA"
else
    error "❌ DATABASE_URL: NÃO CONFIGURADA"
fi

if docker exec agents-chat env | grep -q "S3_ENDPOINT="; then
    success "✅ S3_ENDPOINT: CONFIGURADA"
else
    error "❌ S3_ENDPOINT: NÃO CONFIGURADA"
fi

if docker exec agents-chat env | grep -q "NEXT_AUTH_SECRET="; then
    success "✅ NEXT_AUTH_SECRET: CONFIGURADA"
else
    error "❌ NEXT_AUTH_SECRET: NÃO CONFIGURADA"
fi

echo ""

# 7. Verificar recursos do sistema
echo -e "${PURPLE}6. RECURSOS DO SISTEMA${NC}"
echo "========================="
TOTAL_RAM=$(free -g | awk 'NR==2{print $2}')
TOTAL_DISK=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

echo "RAM Total: ${TOTAL_RAM}GB"
echo "Espaço Livre: ${TOTAL_DISK}GB"

if [ "$TOTAL_RAM" -lt 4 ]; then
    warn "⚠️ RAM baixa! Recomendado: 4GB+"
fi

if [ "$TOTAL_DISK" -lt 10 ]; then
    warn "⚠️ Espaço em disco baixo! Recomendado: 10GB+"
fi

echo ""

# 8. Verificar portas em uso
echo -e "${PURPLE}7. PORTAS EM USO${NC}"
echo "========================="
PORTS=(3210 5432 6379 9000 9001 8000)
for port in "${PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        success "✅ Porta $port: EM USO"
    else
        error "❌ Porta $port: LIVRE (deveria estar em uso)"
    fi
done

echo ""

# 9. Soluções Rápidas
echo -e "${PURPLE}8. SOLUÇÕES RÁPIDAS${NC}"
echo "========================="
echo "Para problemas comuns, execute:"
echo ""
echo "🔄 Reiniciar todos os serviços:"
echo "   docker-compose restart"
echo ""
echo "🔄 Reiniciar apenas a aplicação:"
echo "   docker-compose restart app"
echo ""
echo "🔄 Recriar containers:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "📊 Ver logs detalhados:"
echo "   docker-compose logs -f app"
echo ""
echo "🗄️ Executar migrações manualmente:"
echo "   MIGRATION_DB=1 DATABASE_URL=\"postgresql://postgres:SENHA@localhost:5432/agents_chat\" tsx ./scripts/migrateServerDB/index.ts"
echo ""
echo "🔧 Instalar pgvector manualmente:"
echo "   docker exec agents-chat-postgres psql -U postgres -d agents_chat -c \"CREATE EXTENSION IF NOT EXISTS vector;\""
echo ""
echo "💾 Recriar bucket MinIO:"
echo "   docker exec agents-chat-minio mc mb myminio/lobe"
echo "   docker exec agents-chat-minio mc anonymous set download myminio/lobe"
echo ""

# 10. Verificar .env
echo -e "${PURPLE}9. VERIFICAÇÃO DO .ENV${NC}"
echo "========================="
if [ -f ".env" ]; then
    success "✅ Arquivo .env: EXISTE"
    
    # Verificar se há chaves API configuradas
    if grep -q "OPENAI_API_KEY=sk-" .env; then
        success "✅ OPENAI_API_KEY: CONFIGURADA"
    else
        warn "⚠️ OPENAI_API_KEY: NÃO CONFIGURADA"
    fi
    
    if grep -q "ANTHROPIC_API_KEY=sk-" .env; then
        success "✅ ANTHROPIC_API_KEY: CONFIGURADA"
    else
        warn "⚠️ ANTHROPIC_API_KEY: NÃO CONFIGURADA"
    fi
else
    error "❌ Arquivo .env: NÃO EXISTE"
    echo "Execute: cp .env.vm .env"
fi

echo ""

# 11. Informações de contato
echo -e "${PURPLE}10. PRECISA DE AJUDA?${NC}"
echo "========================="
echo "📧 Email: contato@agentssaas.com"
echo "🐙 GitHub: https://github.com/seu-usuario/agents_saas/issues"
echo "📖 Documentação: DEPLOY-PROD.md"
echo ""

echo "============================================================================="
echo -e "${GREEN}🔧 TROUBLESHOOTING CONCLUÍDO${NC}"
echo "============================================================================="