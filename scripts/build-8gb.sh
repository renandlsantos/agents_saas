#!/bin/bash

echo "🏗️  Build Otimizado para VMs com 8GB RAM"
echo "========================================"

# Verificar memória disponível para o build
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
echo "📊 Memória disponível: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 3000 ]; then
    echo "⚠️  AVISO: Menos de 3GB disponíveis para o build!"
    echo "   O build pode falhar. Considere:"
    echo "   1. Fechar outras aplicações"
    echo "   2. Adicionar swap temporário"
    echo ""
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Limpar cache do Docker para liberar espaço
echo "🧹 Limpando cache do Docker..."
docker builder prune -f

# Build com limites de memória
echo "🔨 Iniciando build otimizado..."
echo "   - Usando cache de camadas"
echo "   - Limitando uso de memória"
echo "   - Removendo arquivos desnecessários"

# Configurar BuildKit para otimizações
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build com configurações otimizadas
docker build \
    --memory="3g" \
    --memory-swap="4g" \
    --cpus="2" \
    -f Dockerfile.8gb-optimized \
    -t agents-chat-8gb:latest \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    .

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "📏 Tamanho da imagem:"
    docker images agents-chat-8gb:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
    echo "🚀 Para executar:"
    echo "   docker run -d \\"
    echo "     --name lobe-chat \\"
    echo "     --memory=\"2g\" \\"
    echo "     --memory-swap=\"3g\" \\"
    echo "     -p 3210:3210 \\"
    echo "     -e DATABASE_URL=\"sua-url-do-banco\" \\"
    echo "     -e KEY_VAULTS_SECRET=\"seu-secret\" \\"
    echo "     agents-chat-8gb:latest"
else
    echo "❌ Build falhou!"
    echo ""
    echo "💡 Dicas para resolver:"
    echo "   1. Adicione swap temporário:"
    echo "      sudo fallocate -l 4G /swapfile"
    echo "      sudo chmod 600 /swapfile"
    echo "      sudo mkswap /swapfile"
    echo "      sudo swapon /swapfile"
    echo ""
    echo "   2. Use build em etapas:"
    echo "      docker build --target deps -t deps-cache ."
    echo "      docker build --target builder -t builder-cache ."
    echo "      docker build -t agents-chat-8gb:latest ."
fi