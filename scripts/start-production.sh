#!/bin/bash

echo "🚀 Iniciando Lobe Chat em Produção (Otimizado para 8GB RAM)"
echo "================================================"

# Verificar memória disponível
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')

echo "📊 Memória Total: ${TOTAL_MEM}MB"
echo "📊 Memória Disponível: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 4000 ]; then
    echo "⚠️  AVISO: Menos de 4GB de memória disponível!"
    echo "   Recomenda-se fechar outras aplicações antes de continuar."
    read -p "   Deseja continuar mesmo assim? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Verificar se .env existe
if [ ! -f .env.production ]; then
    echo "⚠️  Arquivo .env.production não encontrado!"
    echo "   Copiando .env.production.example..."
    cp .env.production.example .env.production
    echo "   Por favor, edite .env.production com suas configurações!"
    exit 1
fi

# Limpar recursos Docker não utilizados
echo "🧹 Limpando recursos Docker não utilizados..."
docker system prune -f

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.production.yml down

# Verificar se a imagem existe
if [[ "$(docker images -q agents-chat-custom:latest 2> /dev/null)" == "" ]]; then
    echo "🏗️  Imagem não encontrada. Construindo..."
    docker build -f Dockerfile.database.optimized -t agents-chat-custom:latest .
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# Aguardar serviços ficarem saudáveis
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker-compose -f docker-compose.production.yml ps

# Mostrar logs
echo ""
echo "📝 Para ver os logs em tempo real:"
echo "   docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "🌐 Acesse o Lobe Chat em: http://localhost:3210"
echo ""
echo "💡 Dicas para economizar memória:"
echo "   - Use apenas os provedores de IA necessários"
echo "   - Desabilite features não utilizadas via FEATURE_FLAGS"
echo "   - Monitore o uso: docker stats"
echo ""