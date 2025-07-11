#!/bin/bash

# ============================================================================
# Script para configurar DNS customizado no Agents Chat
# ============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuração de DNS para Agents Chat ===${NC}"
echo ""

# Solicitar informações do DNS
read -p "Digite seu domínio (ex: chat.seudominio.com): " DOMAIN
read -p "Usar HTTPS? (s/n): " USE_HTTPS

# Configurar protocolo
if [[ "$USE_HTTPS" =~ ^[Ss]$ ]]; then
    PROTOCOL="https"
    PORT=""
    echo -e "${YELLOW}⚠️  Certifique-se de configurar SSL no servidor (Nginx/Caddy/Traefik)${NC}"
else
    PROTOCOL="http"
    PORT=":3210"
fi

# URLs completas
APP_URL="${PROTOCOL}://${DOMAIN}${PORT}"
S3_PUBLIC_DOMAIN="${PROTOCOL}://${DOMAIN}:9000"

echo ""
echo -e "${GREEN}Configurações que serão aplicadas:${NC}"
echo "  Domínio: ${DOMAIN}"
echo "  URL da Aplicação: ${APP_URL}"
echo "  URL do S3 (MinIO): ${S3_PUBLIC_DOMAIN}"
echo ""

read -p "Continuar? (s/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 1
fi

# Criar arquivo de configuração DNS
cat > .env.dns << EOF
# =============================================================================
# CONFIGURAÇÕES DE DNS - ${DOMAIN}
# =============================================================================

# URLs com DNS customizado
APP_URL=${APP_URL}
NEXT_PUBLIC_SITE_URL=${APP_URL}
NEXTAUTH_URL=${APP_URL}
NEXTAUTH_URL_INTERNAL=http://localhost:3210
S3_PUBLIC_DOMAIN=${S3_PUBLIC_DOMAIN}

# Manter as URLs internas dos containers
S3_ENDPOINT=http://agents-chat-minio:9000
DATABASE_URL=postgresql://postgres:004ff324bc0db4717e947fb62a42a71a@agents-chat-postgres:5432/agents_chat
EOF

echo -e "${GREEN}✅ Arquivo .env.dns criado${NC}"

# Criar script de aplicação das configurações
cat > apply-dns-config.sh << 'EOF'
#!/bin/bash

# Script para aplicar configurações de DNS

set -e

echo "🔧 Aplicando configurações de DNS..."

# Fazer backup do .env atual
if [ -f "/app/.env" ]; then
    cp /app/.env /app/.env.backup-dns-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup criado"
fi

# Mesclar configurações
if [ -f ".env.dns" ]; then
    # Ler o arquivo .env atual
    source /app/.env
    
    # Ler as novas configurações de DNS
    source .env.dns
    
    # Atualizar apenas as variáveis relacionadas a URLs
    sed -i "s|^APP_URL=.*|APP_URL=${APP_URL}|" /app/.env
    sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}|" /app/.env
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${NEXTAUTH_URL}|" /app/.env
    sed -i "s|^S3_PUBLIC_DOMAIN=.*|S3_PUBLIC_DOMAIN=${S3_PUBLIC_DOMAIN}|" /app/.env
    
    echo "✅ Configurações de DNS aplicadas"
else
    echo "❌ Arquivo .env.dns não encontrado"
    exit 1
fi

echo "🔄 Reiniciando aplicação..."
docker-compose restart app

echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure seu DNS para apontar para o IP: $(curl -s ifconfig.me)"
echo "2. Se usando HTTPS, configure SSL no servidor web (Nginx/Caddy)"
echo "3. Abra as portas necessárias no firewall:"
echo "   - 80/443 (HTTP/HTTPS)"
echo "   - 9000 (MinIO S3)"
EOF

chmod +x apply-dns-config.sh

echo ""
echo -e "${GREEN}=== Instruções de Uso ===${NC}"
echo ""
echo "1. No servidor, execute:"
echo "   scp .env.dns apply-dns-config.sh root@64.23.166.36:/opt/agents_saas/"
echo "   ssh root@64.23.166.36 'cd /opt/agents_saas && ./apply-dns-config.sh'"
echo ""
echo "2. Configure seu DNS:"
echo "   - Tipo A: ${DOMAIN} → 64.23.166.36"
echo "   - Se usar subdomínio: CNAME: ${DOMAIN} → seu-dominio-principal.com"
echo ""
echo "3. Para HTTPS (recomendado), configure Nginx:"
echo "   ./configure-nginx-ssl.sh ${DOMAIN}"
echo ""
echo -e "${YELLOW}⚠️  Importante: As configurações internas (banco, S3 interno) não serão alteradas${NC}"