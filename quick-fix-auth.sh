#!/bin/bash

# ============================================================================
# Quick Fix - Corrigir erro 404 em /next-auth/signin
# ============================================================================

echo "🚀 Aplicando correção rápida no servidor..."

# Copiar o arquivo .env.vm atualizado
echo "📤 1. Enviando arquivo .env atualizado..."
scp env/.env.vm root@64.23.166.36:/tmp/.env.new

# Aplicar correções no servidor
ssh root@64.23.166.36 << 'EOF'
    cd /opt/agents_saas
    
    echo "📋 2. Fazendo backup do .env atual..."
    cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
    
    echo "📝 3. Aplicando novo .env..."
    cp /tmp/.env.new .env
    
    echo "🔄 4. Reiniciando aplicação..."
    docker-compose down
    docker-compose up -d
    
    echo "⏳ 5. Aguardando aplicação iniciar (45s)..."
    sleep 45
    
    echo "🧪 6. Testando endpoints:"
    echo -n "   Homepage: "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/
    
    echo -n "   Login redirect: "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/login
    
    echo -n "   Auth signin: "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/next-auth/signin
    
    echo ""
    echo "📋 7. Verificando logs de erro:"
    docker-compose logs --tail=30 app | grep -E "(Error|error|404|ready|Ready)" || true
    
    # Limpar
    rm -f /tmp/.env.new
EOF

echo ""
echo "✅ Correção aplicada!"
echo ""
echo "🔍 Para verificar se funcionou:"
echo "1. Acesse: http://64.23.166.36:3210/"
echo "2. Verifique o console do navegador"
echo "3. Tente clicar em 'Fazer Login'"
echo ""
echo "💡 Se ainda der erro 404:"
echo "   - O problema está no código (precisa fazer build com as correções)"
echo "   - Execute: ./diagnose-auth-error.sh para mais detalhes"