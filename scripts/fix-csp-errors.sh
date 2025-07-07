#!/bin/bash

echo "🔧 Corrigindo erros de CSP no Lobe Chat"
echo "======================================="

# Parar containers atuais
echo "🛑 Parando containers..."
docker-compose down

# Backup do .env atual
echo "💾 Fazendo backup do .env..."
cp /opt/agents-chat/.env /opt/agents-chat/.env.backup-$(date +%Y%m%d-%H%M%S)

# Adicionar configuração para desabilitar CSP
echo "📝 Adicionando configuração CSP..."
if ! grep -q "NEXT_PUBLIC_CSP_DISABLED" /opt/agents-chat/.env; then
    echo "" >> /opt/agents-chat/.env
    echo "# Fix para erros de CSP (Three.js, etc)" >> /opt/agents-chat/.env
    echo "NEXT_PUBLIC_CSP_DISABLED=true" >> /opt/agents-chat/.env
fi

# Reiniciar com a nova configuração
echo "🚀 Reiniciando containers..."
docker-compose up -d

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "Se ainda tiver erros, considere usar o Nginx:"
echo "  docker-compose -f docker-compose.production-nginx.yml up -d"
echo ""
echo "Acesse em: http://161.35.227.30"