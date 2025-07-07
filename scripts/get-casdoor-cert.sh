#!/bin/bash

echo "🔐 Obtendo Certificado do Casdoor"
echo "================================="
echo ""

CASDOOR_URL="http://161.35.227.30:8000"

# Tentar obter via API pública
echo "📡 Tentando obter certificado via API..."
echo ""

# Método 1: Via API de certs
CERT=$(curl -s "$CASDOOR_URL/api/get-certs" 2>/dev/null | jq -r '.data[] | select(.name=="cert-built-in") | .certificate' 2>/dev/null)

if [ -n "$CERT" ] && [ "$CERT" != "null" ]; then
    echo "✅ Certificado encontrado!"
    echo ""
    echo "📋 Certificado:"
    echo "================"
    echo "$CERT"
    echo "================"
    echo ""
    echo "📝 Para usar no .env, copie e cole como:"
    echo ""
    echo "AUTH_CASDOOR_CERTIFICATE=\"$CERT\""
    echo ""
else
    echo "❌ Não foi possível obter o certificado via API"
    echo ""
    echo "🔧 Alternativas:"
    echo ""
    echo "1. Acesse manualmente: $CASDOOR_URL"
    echo "   - Faça login como admin"
    echo "   - Vá em Certs"
    echo "   - Copie o certificado 'cert-built-in'"
    echo ""
    echo "2. Se tiver acesso SSH ao servidor:"
    echo "   docker exec casdoor cat /etc/casdoor/certs/cert-built-in.pem"
    echo ""
    echo "3. Verifique se o Casdoor está rodando:"
    echo "   curl $CASDOOR_URL"
fi

echo ""
echo "💡 Dica: O certificado deve incluir as linhas BEGIN e END!"