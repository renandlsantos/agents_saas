#!/bin/bash

echo "🔐 Gerador de Secrets para Lobe Chat"
echo "===================================="
echo ""

# Função para gerar secret aleatório
generate_secret() {
    # Gera 32 bytes aleatórios e converte para base64
    openssl rand -base64 32
}

# Gerar NEXT_AUTH_SECRET
echo "📝 NEXT_AUTH_SECRET (para autenticação NextAuth):"
NEXT_AUTH_SECRET=$(generate_secret)
echo "NEXT_AUTH_SECRET=$NEXT_AUTH_SECRET"
echo ""

# Gerar KEY_VAULTS_SECRET
echo "🔑 KEY_VAULTS_SECRET (para criptografia de dados sensíveis):"
KEY_VAULTS_SECRET=$(generate_secret)
echo "KEY_VAULTS_SECRET=$KEY_VAULTS_SECRET"
echo ""

# Gerar outros secrets úteis
echo "🎲 Outros secrets que você pode precisar:"
echo ""
echo "# Secret para cookies/sessões:"
SESSION_SECRET=$(generate_secret)
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""

echo "# Secret para JWT (se usar):"
JWT_SECRET=$(generate_secret)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

echo "=================================="
echo "💡 Como usar:"
echo "1. Copie os valores gerados acima"
echo "2. Cole no seu arquivo .env"
echo "3. NUNCA compartilhe esses valores!"
echo "4. NUNCA commite no git!"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- Cada ambiente (dev, staging, prod) deve ter secrets DIFERENTES"
echo "- Guarde backup dos secrets de produção em local seguro"
echo "- Mude os secrets periodicamente (a cada 6-12 meses)"