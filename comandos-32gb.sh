#!/bin/bash

# ============================================================================
# COMANDOS OTIMIZADOS PARA 32GB RAM - AGENTS CHAT
# Comandos rápidos para operações com máxima performance
# ============================================================================

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 COMANDOS OTIMIZADOS PARA 32GB RAM - AGENTS CHAT${NC}"
echo "============================================================================="

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "⚠️  Navegando para /opt/agents-chat..."
    cd /opt/agents-chat
fi

# Função para mostrar menu
show_menu() {
    echo ""
    echo -e "${BLUE}Escolha uma opção:${NC}"
    echo "1. 📦 Reinstalar dependências (32GB otimizado)"
    echo "2. 🔨 Build da aplicação (32GB otimizado)"
    echo "3. 🐳 Rebuild imagem Docker (32GB otimizado)"
    echo "4. 🚀 Restart aplicação (32GB otimizado)"
    echo "5. 📊 Monitorar performance"
    echo "6. 🔍 Ver logs da aplicação"
    echo "7. 🗄️  Restart banco de dados"
    echo "8. 🧹 Limpar cache e rebuild completo"
    echo "9. ⚙️  Configurar variáveis 32GB"
    echo "0. ❌ Sair"
    echo ""
    read -p "Digite sua escolha: " choice
}

# Configurar variáveis otimizadas para 32GB
configure_32gb_vars() {
    echo -e "${YELLOW}⚙️  Configurando variáveis para 32GB RAM...${NC}"

    export NODE_OPTIONS="--max-old-space-size=28672 --optimize-for-size --gc-interval=100"
    export UV_THREADPOOL_SIZE=128
    export LIBUV_THREAD_COUNT=16
    export DOCKER=true
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1

    echo -e "${GREEN}✅ Variáveis configuradas para 32GB RAM!${NC}"
}

# Reinstalar dependências
reinstall_deps() {
    echo -e "${YELLOW}📦 Reinstalando dependências com otimizações 32GB...${NC}"

    configure_32gb_vars

    rm -rf node_modules
    rm -rf .pnpm-store
    rm -rf pnpm-lock.yaml

    pnpm install --no-frozen-lockfile --prefer-offline

    echo -e "${GREEN}✅ Dependências reinstaladas com sucesso!${NC}"
}

# Build da aplicação
build_app() {
    echo -e "${YELLOW}🔨 Fazendo build otimizado para 32GB RAM...${NC}"

    configure_32gb_vars

    rm -rf .next out

    pnpm run build:docker

    if [ -d ".next/standalone" ]; then
        echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

        BUILD_SIZE=$(du -sh .next/standalone | cut -f1)
        STATIC_SIZE=$(du -sh .next/static | cut -f1)
        echo -e "${PURPLE}📊 Build Size: ${BUILD_SIZE}, Static Size: ${STATIC_SIZE}${NC}"
    else
        echo -e "${RED}❌ Build falhou!${NC}"
    fi
}

# Rebuild imagem Docker
rebuild_docker() {
    echo -e "${YELLOW}🐳 Rebuilding imagem Docker otimizada...${NC}"

    configure_32gb_vars

    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --build-arg NODE_OPTIONS="--max-old-space-size=28672" \
        -f docker-compose/Dockerfile.prebuilt \
        -t agents-chat:32gb-optimized .

    if docker images | grep -q "agents-chat.*32gb-optimized"; then
        echo -e "${GREEN}✅ Imagem Docker criada com sucesso!${NC}"

        IMAGE_SIZE=$(docker images agents-chat:32gb-optimized --format "{{.Size}}")
        echo -e "${PURPLE}📊 Tamanho da imagem: ${IMAGE_SIZE}${NC}"
    else
        echo -e "${RED}❌ Falha ao criar imagem Docker!${NC}"
    fi
}

# Restart aplicação
restart_app() {
    echo -e "${YELLOW}🚀 Reiniciando aplicação com otimizações 32GB...${NC}"

    docker stop agents-chat 2>/dev/null || true
    docker rm agents-chat 2>/dev/null || true

    docker run -d \
        --name agents-chat \
        --restart unless-stopped \
        -p 3210:3210 \
        --env-file .env \
        --network host \
        --memory="16g" \
        --memory-swap="20g" \
        --cpus="6" \
        --shm-size="4g" \
        --ulimit nofile=65536:65536 \
        agents-chat:32gb-optimized

    echo -e "${GREEN}✅ Aplicação reiniciada com otimizações!${NC}"

    sleep 10
    docker ps | grep agents-chat
}

# Monitorar performance
monitor_performance() {
    echo -e "${YELLOW}📊 Monitorando performance otimizada...${NC}"

    echo ""
    echo "=== RECURSOS DO SISTEMA ==="
    free -h | grep -E "(Mem|Swap)"

    echo ""
    echo "=== CONTAINERS ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

    echo ""
    echo "=== PERFORMANCE DETALHADA ==="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

    echo ""
    echo "=== HEALTH CHECK ==="
    curl -f http://localhost:3210/api/health 2>/dev/null && echo "✅ API OK" || echo "❌ API Down"
}

# Ver logs
view_logs() {
    echo -e "${YELLOW}🔍 Visualizando logs da aplicação...${NC}"

    echo "=== LOGS RECENTES ==="
    docker logs agents-chat --tail 30

    echo ""
    echo "=== MONITORAMENTO EM TEMPO REAL ==="
    echo "Pressione Ctrl+C para sair..."
    docker logs -f agents-chat
}

# Restart banco
restart_db() {
    echo -e "${YELLOW}🗄️  Reiniciando banco de dados otimizado...${NC}"

    docker-compose -f docker-compose.db.yml restart

    echo "Aguardando banco inicializar..."
    sleep 15

    docker logs agents-chat-postgres --tail 10

    echo -e "${GREEN}✅ Banco reiniciado!${NC}"
}

# Limpeza completa e rebuild
full_cleanup_rebuild() {
    echo -e "${YELLOW}🧹 Limpeza completa e rebuild otimizado...${NC}"

    echo "1. Parando containers..."
    docker stop agents-chat agents-chat-postgres 2>/dev/null || true
    docker rm agents-chat agents-chat-postgres 2>/dev/null || true

    echo "2. Limpando cache..."
    rm -rf .next out node_modules .pnpm-store pnpm-lock.yaml
    docker system prune -f

    echo "3. Configurando variáveis..."
    configure_32gb_vars

    echo "4. Instalando dependências..."
    pnpm install --no-frozen-lockfile --prefer-offline

    echo "5. Fazendo build..."
    pnpm run build:docker

    echo "6. Criando imagem Docker..."
    docker build \
        --build-arg NODE_OPTIONS="--max-old-space-size=28672" \
        -f docker-compose/Dockerfile.prebuilt \
        -t agents-chat:32gb-optimized .

    echo "7. Iniciando banco..."
    docker-compose -f docker-compose.db.yml up -d
    sleep 20

    echo "8. Iniciando aplicação..."
    docker run -d \
        --name agents-chat \
        --restart unless-stopped \
        -p 3210:3210 \
        --env-file .env \
        --network host \
        --memory="16g" \
        --memory-swap="20g" \
        --cpus="6" \
        --shm-size="4g" \
        --ulimit nofile=65536:65536 \
        agents-chat:32gb-optimized

    echo -e "${GREEN}✅ Rebuild completo finalizado!${NC}"
}

# Menu principal
while true; do
    show_menu

    case $choice in
        1)
            reinstall_deps
            ;;
        2)
            build_app
            ;;
        3)
            rebuild_docker
            ;;
        4)
            restart_app
            ;;
        5)
            monitor_performance
            ;;
        6)
            view_logs
            ;;
        7)
            restart_db
            ;;
        8)
            full_cleanup_rebuild
            ;;
        9)
            configure_32gb_vars
            ;;
        0)
            echo -e "${GREEN}👋 Até logo!${NC}"
            break
            ;;
        *)
            echo -e "${RED}❌ Opção inválida!${NC}"
            ;;
    esac

    echo ""
    read -p "Pressione Enter para continuar..."
done
