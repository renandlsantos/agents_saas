#!/bin/bash

# =============================================================================
# Script para Corrigir Configuração DNS - app.ai4learning.com.br
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DOMAIN="app.ai4learning.com.br"
IP_SERVER="64.23.166.36"

echo -e "${GREEN}=== Corrigindo Configuração DNS para ${DOMAIN} ===${NC}"
echo ""

# 1. Verificar se o DNS está apontando corretamente
echo -e "${YELLOW}Passo 1: Verificando DNS...${NC}"
DNS_IP=$(dig +short ${DOMAIN} | head -1)

if [ "$DNS_IP" != "$IP_SERVER" ]; then
    echo -e "${RED}❌ DNS não está apontando corretamente!${NC}"
    echo "   Atual: $DNS_IP"
    echo "   Esperado: $IP_SERVER"
    echo ""
    echo -e "${YELLOW}⚠️  Configure seu DNS:${NC}"
    echo "   Tipo: A"
    echo "   Nome: app"
    echo "   Valor: $IP_SERVER"
    echo "   TTL: 3600 (ou menor)"
    echo ""
    echo "Após configurar o DNS, aguarde alguns minutos e execute este script novamente."
    exit 1
else
    echo -e "${GREEN}✅ DNS está configurado corretamente!${NC}"
fi

# 2. Atualizar arquivo .env local
echo -e "${YELLOW}Passo 2: Atualizando arquivo .env local...${NC}"

# Fazer backup do .env atual
cp .env .env.backup.$(date +%Y%m%d%H%M%S)

# Atualizar as URLs no .env
sed -i.bak \
    -e 's|APP_URL=.*|APP_URL=https://app.ai4learning.com.br|' \
    -e 's|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://app.ai4learning.com.br|' \
    -e 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://app.ai4learning.com.br|' \
    -e 's|AUTH_URL=.*|AUTH_URL=https://app.ai4learning.com.br|' \
    -e 's|S3_PUBLIC_DOMAIN=.*|S3_PUBLIC_DOMAIN=https://app.ai4learning.com.br:9443|' \
    -e 's|LOBE_PORT=.*|LOBE_PORT=3210|' \
    .env

echo -e "${GREEN}✅ Arquivo .env atualizado!${NC}"

# 3. Criar configuração Nginx corrigida
echo -e "${YELLOW}Passo 3: Criando configuração Nginx...${NC}"

cat > /tmp/nginx-ai4learning.conf << 'EOF'
# Configuração para app.ai4learning.com.br

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.ai4learning.com.br;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

# HTTPS - Aplicação Principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.ai4learning.com.br;

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy para Agents Chat
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para AI
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        
        # Buffer sizes
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Upload de arquivos
        client_max_body_size 50M;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS - MinIO S3 (porta 9443)
server {
    listen 9443 ssl http2;
    listen [::]:9443 ssl http2;
    server_name app.ai4learning.com.br;

    # SSL (mesmo certificado)
    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload de arquivos grandes
        client_max_body_size 100M;
        proxy_request_buffering off;
    }
}
EOF

echo -e "${GREEN}✅ Configuração Nginx criada!${NC}"

# 4. Aplicar configurações no servidor
echo -e "${YELLOW}Passo 4: Aplicando configurações no servidor...${NC}"

# Verificar se conseguimos conectar ao servidor
if ! ssh -o ConnectTimeout=5 root@${IP_SERVER} exit 2>/dev/null; then
    echo -e "${RED}❌ Não foi possível conectar ao servidor!${NC}"
    echo "Certifique-se de que:"
    echo "1. Você tem acesso SSH ao servidor"
    echo "2. Sua chave SSH está configurada"
    echo ""
    echo "Para aplicar manualmente:"
    echo "1. Copie o arquivo /tmp/nginx-ai4learning.conf para o servidor"
    echo "2. Execute os comandos no servidor conforme indicado abaixo"
    exit 1
fi

# Copiar configuração para o servidor
scp /tmp/nginx-ai4learning.conf root@${IP_SERVER}:/etc/nginx/sites-available/${DOMAIN}

# Executar comandos no servidor
ssh root@${IP_SERVER} << EOF
    # Criar diretório para Certbot
    mkdir -p /var/www/certbot
    
    # Ativar site
    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Testar configuração
    nginx -t
    
    # Recarregar Nginx
    systemctl reload nginx
    
    # Obter certificado SSL (se ainda não existir)
    if [ ! -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
        certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} --non-interactive --agree-tos --email admin@ai4learning.com.br
        systemctl reload nginx
    fi
    
    # Configurar firewall
    ufw allow 'Nginx Full' || true
    ufw allow 9443/tcp || true
    
    # Verificar se o docker-compose está rodando
    cd /opt/agents_saas || cd /root/agents_saas || cd /app
    
    # Copiar .env.vm se existir
    if [ -f /root/env/.env.vm ]; then
        cp /root/env/.env.vm .env
    fi
    
    # Reiniciar aplicação
    docker-compose down
    docker-compose up -d
EOF

echo ""
echo -e "${GREEN}=== Configuração Concluída! ===${NC}"
echo ""
echo "✅ DNS configurado e verificado"
echo "✅ Arquivo .env atualizado"
echo "✅ Nginx configurado com SSL"
echo "✅ Aplicação reiniciada"
echo ""
echo "🌐 Acesse: https://${DOMAIN}"
echo "📦 MinIO S3: https://${DOMAIN}:9443"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Aguarde 1-2 minutos para a aplicação iniciar"
echo "2. Teste o acesso em: https://${DOMAIN}"
echo "3. Se houver problemas, verifique os logs:"
echo "   ssh root@${IP_SERVER} 'docker-compose logs -f agents-chat'"