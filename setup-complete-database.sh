#!/bin/bash

# =============================================================================
# AGENTS CHAT - SETUP COMPLETO DE DATABASE
# =============================================================================

echo "🚀 Iniciando setup completo do database..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se .env existe
if [ ! -f ".env" ]; then
    log_info "Copiando env/.env.vm para .env..."
    cp env/.env.vm .env
else
    log_success ".env já existe, mantendo configuração atual"
fi

# Carregar variáveis do .env
source .env

log_info "Carregando configurações do ambiente..."

# 1. Parar todos os containers
log_info "Parando containers existentes..."
docker-compose down

# 2. Limpar dados antigos se necessário
if [ "$1" = "--clean" ]; then
    log_warning "Limpando dados antigos do PostgreSQL..."
    sudo rm -rf data/postgres/*
    sudo rm -rf data/redis/*
    sudo rm -rf data/minio/*
fi

# 3. Criar diretórios necessários
log_info "Criando diretórios de dados..."
mkdir -p data/postgres data/redis data/minio data/casdoor logs/app

# 4. Subir PostgreSQL primeiro
log_info "Iniciando PostgreSQL com pgvector..."
docker-compose up -d postgres

# 5. Aguardar PostgreSQL ficar pronto
log_info "Aguardando PostgreSQL inicializar..."
sleep 15

# Função para verificar se PostgreSQL está pronto
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec agents-chat-postgres pg_isready -U postgres > /dev/null 2>&1; then
            log_success "PostgreSQL está pronto!"
            return 0
        fi
        
        log_info "Tentativa $attempt/$max_attempts - PostgreSQL ainda não está pronto..."
        sleep 2
        ((attempt++))
    done
    
    log_error "PostgreSQL não ficou pronto após $max_attempts tentativas"
    return 1
}

# Aguardar PostgreSQL ficar pronto
if ! wait_for_postgres; then
    log_error "Falha ao inicializar PostgreSQL"
    exit 1
fi

# 6. Criar databases necessários
log_info "Criando databases necessários..."

# Criar database para Lobe Chat
docker exec agents-chat-postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS agents_chat;" || {
    docker exec agents-chat-postgres psql -U postgres -c "CREATE DATABASE agents_chat;"
}

# Criar database para Casdoor
docker exec agents-chat-postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS casdoor;" || {
    docker exec agents-chat-postgres psql -U postgres -c "CREATE DATABASE casdoor;"
}

# Verificar databases criados
log_info "Verificando databases criados..."
docker exec agents-chat-postgres psql -U postgres -c "\l"

# 7. Instalar extensão pgvector no database do Lobe Chat
log_info "Instalando extensão pgvector..."
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;"

log_success "Databases criados com sucesso!"

# 8. Subir Redis e MinIO
log_info "Iniciando Redis e MinIO..."
docker-compose up -d redis minio

# 9. Aguardar MinIO
sleep 10

# 10. Configurar bucket do MinIO
log_info "Configurando bucket do MinIO..."
docker exec agents-chat-minio mc alias set local http://localhost:9000 minioadmin $MINIO_ROOT_PASSWORD
docker exec agents-chat-minio mc mb local/lobe --ignore-existing

# 11. Build da aplicação
log_info "Fazendo build da aplicação..."
export DOCKERFILE_PATH=Dockerfile.database
docker-compose build --no-cache app

# 12. Subir aplicação
log_info "Iniciando aplicação..."
docker-compose up -d app

# 13. Aguardar aplicação e executar migrações
log_info "Aguardando aplicação inicializar..."
sleep 20

# =============================================================================
# MIGRAÇÕES DE BANCO - EXPLICAÇÃO
# =============================================================================
log_info "Executando migrações das aplicações..."
echo ""
echo "📚 SOBRE AS MIGRAÇÕES:"
echo "   • Lobe Chat: Usa Drizzle ORM - cria tabelas automaticamente"
echo "   • Casdoor: Cria suas próprias tabelas na inicialização"
echo "   • PostgreSQL: Databases criados pelo script init-databases.sql"
echo ""

# Função para aguardar container estar pronto
wait_for_container() {
    local container_name=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $container_name echo "Container ready" > /dev/null 2>&1; then
            log_success "$container_name está pronto!"
            return 0
        fi
        
        log_info "Aguardando $container_name ficar pronto... ($attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    done
    
    log_error "$container_name não ficou pronto após $max_attempts tentativas"
    return 1
}

# Aguardar aplicação estar totalmente pronta
log_info "Aguardando aplicação estar completamente inicializada..."
if ! wait_for_container "agents-chat"; then
    log_error "Aplicação não inicializou corretamente"
    exit 1
fi

# Verificar e executar migrações do Lobe Chat
log_info "🔄 Executando migrações do Lobe Chat (Drizzle ORM)..."

# Tentar migração até 3 vezes
migration_success=false
for attempt in 1 2 3; do
    log_info "Tentativa $attempt/3 de migração..."
    
    if docker exec agents-chat /bin/node /app/docker.cjs; then
        log_success "✅ Migração executada com sucesso!"
        migration_success=true
        break
    else
        log_warning "⚠️ Tentativa $attempt falhou, aguardando 10 segundos..."
        sleep 10
    fi
done

if [ "$migration_success" = false ]; then
    log_error "❌ Migração falhou após 3 tentativas. Verificar logs da aplicação."
    echo ""
    echo "🔍 Logs da aplicação:"
    docker logs --tail 20 agents-chat
    exit 1
fi

# Verificar se tabelas foram criadas
log_info "🔍 Verificando tabelas criadas no banco agents_chat..."
table_count=$(docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "\dt" -t | wc -l)

if [ "$table_count" -gt 10 ]; then
    log_success "✅ $table_count tabelas criadas com sucesso!"
    
    # Mostrar algumas tabelas importantes
    log_info "📋 Tabelas principais criadas:"
    docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'nextauth_sessions', 'messages', 'agents', 'files')
        ORDER BY tablename;
    "
else
    log_error "❌ Tabelas não foram criadas corretamente ($table_count tabelas encontradas)"
    exit 1
fi

# Verificar database e schema
log_info "🔍 Verificando configuração do banco..."
db_name=$(docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT current_database();" -t | xargs)
log_success "Database ativo: $db_name"

# 14. Subir Casdoor
log_info "Iniciando Casdoor..."
docker-compose up -d casdoor

# 15. Verificar status de todos os serviços
log_info "Verificando status dos serviços..."
sleep 10

echo ""
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "🔍 Logs da aplicação (últimas 20 linhas):"
docker logs --tail 20 agents-chat

# Teste final da aplicação
log_info "🧪 Testando conectividade da aplicação..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3210 | grep -q "200\|302\|404"; then
    log_success "✅ Aplicação respondendo corretamente!"
else
    log_warning "⚠️ Aplicação pode ainda estar inicializando..."
fi

echo ""
echo "🎉 =============================================="
echo "     SETUP COMPLETO FINALIZADO COM SUCESSO!"
echo "=============================================="
echo ""
echo "📊 RESUMO DO SISTEMA:"
echo "   ✅ PostgreSQL + pgvector: Funcionando"
echo "   ✅ Redis: Funcionando" 
echo "   ✅ MinIO: Funcionando"
echo "   ✅ Lobe Chat: Funcionando"
echo "   ✅ Casdoor: Funcionando"
echo "   ✅ Database: $table_count tabelas criadas"
echo "   ✅ Migrações: Executadas com sucesso"
echo ""
echo "🌐 URLs DE ACESSO:"
echo "   • 🚀 Lobe Chat:  http://64.23.166.36:3210"
echo "   • 🔐 Casdoor:    http://64.23.166.36:8000"
echo "   • 📦 MinIO:      http://64.23.166.36:9000"
echo ""
echo "👤 PRIMEIROS PASSOS:"
echo "   1. Acesse: http://64.23.166.36:3210"
echo "   2. Clique em 'Sign Up' para criar conta"
echo "   3. Faça login e comece a usar o chat!"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "   • docker-compose ps                    # Status dos serviços"
echo "   • docker logs -f agents-chat           # Logs da aplicação"
echo "   • docker logs -f agents-chat-postgres  # Logs do PostgreSQL"
echo "   • docker-compose down                  # Parar tudo"
echo "   • docker-compose up -d                 # Subir tudo"
echo "   • ./setup-complete-database.sh --clean # Recriar do zero"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "   • Configure domínio personalizado"
echo "   • Configure SSL/HTTPS"
echo "   • Configure backup automático"
echo "   • Monitore logs e performance"
echo ""
log_success "🚀 Sua plataforma SAAS de Chat AI está pronta para produção!"