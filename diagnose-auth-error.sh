#!/bin/bash

# ============================================================================
# Script para diagnosticar e corrigir erro de autenticação
# ============================================================================

set -e

echo "🔍 Diagnosticando erro de autenticação no servidor..."

# Conectar ao servidor e verificar
ssh root@64.23.166.36 << 'EOF'
    cd /opt/agents_saas
    
    echo "📋 1. Verificando estrutura de rotas no container:"
    docker exec agents-chat ls -la /app/src/app/[variants]/(auth)/ || echo "❌ Erro ao listar diretório"
    
    echo ""
    echo "📋 2. Verificando se a rota next-auth existe:"
    docker exec agents-chat ls -la /app/src/app/[variants]/(auth)/next-auth/signin/ || echo "❌ Rota signin não encontrada"
    
    echo ""
    echo "📋 3. Verificando configuração do NextAuth:"
    docker exec agents-chat cat /app/src/libs/next-auth/auth.config.ts | grep -A 3 "pages:" || echo "❌ Configuração não encontrada"
    
    echo ""
    echo "📋 4. Verificando se o build foi aplicado:"
    docker exec agents-chat ls -la /app/.next/server/app/[variants]/(auth)/next-auth/signin/ 2>/dev/null || echo "❌ Build não encontrado"
    
    echo ""
    echo "📋 5. Verificando logs de erro:"
    docker-compose logs --tail=50 app | grep -E "(404|not found|next-auth)" || echo "ℹ️  Nenhum erro relacionado encontrado"
EOF

echo ""
echo "🔧 Aplicando correção..."

# Criar script de correção para executar no servidor
cat > fix-auth-server.sh << 'SCRIPT'
#!/bin/bash
cd /opt/agents_saas

echo "🔄 Reconstruindo aplicação com rotas corretas..."

# Parar container
docker-compose stop app

# Fazer build limpo
docker-compose build --no-cache app

# Reiniciar
docker-compose up -d app

echo "⏳ Aguardando aplicação iniciar (60s)..."
sleep 60

# Verificar se está funcionando
echo "🧪 Testando rotas:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/ && echo " ✅ / - OK" || echo " ❌ / - Erro"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/login && echo " ✅ /login - OK" || echo " ❌ /login - Erro"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/next-auth/signin && echo " ✅ /next-auth/signin - OK" || echo " ❌ /next-auth/signin - Erro"

echo ""
echo "📋 Logs finais:"
docker-compose logs --tail=20 app
SCRIPT

# Enviar e executar script
scp fix-auth-server.sh root@64.23.166.36:/tmp/
ssh root@64.23.166.36 'chmod +x /tmp/fix-auth-server.sh && /tmp/fix-auth-server.sh'

# Limpar
rm -f fix-auth-server.sh

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "🔍 Possíveis causas do erro:"
echo "1. O build local não foi sincronizado com o servidor"
echo "2. O container está usando uma imagem antiga em cache"
echo "3. As rotas não foram compiladas corretamente"
echo ""
echo "💡 Se o erro persistir, tente:"
echo "1. Fazer push do código atualizado para o repositório"
echo "2. Fazer pull no servidor e rebuild"
echo "3. Verificar se o Dockerfile está copiando todos os arquivos necessários"