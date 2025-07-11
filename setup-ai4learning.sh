#!/bin/bash

# ============================================================================
# Script de Configuração para app.ai4learning.com.br
# ============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DOMAIN="app.ai4learning.com.br"
IP_SERVER="64.23.166.36"

echo -e "${GREEN}=== Configurando ${DOMAIN} ===${NC}"
echo ""

# 1. Instalar Nginx e Certbot no servidor
echo -e "${YELLOW}Passo 1: Instalando Nginx e Certbot...${NC}"
ssh root@${IP_SERVER} << 'EOF'
    apt update
    apt install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
EOF

# 2. Criar configuração Nginx
echo -e "${YELLOW}Passo 2: Criando configuração Nginx...${NC}"
cat > /tmp/ai4learning-nginx.conf << EOF
# Configuração para app.ai4learning.com.br

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - Aplicação Principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy para Agents Chat
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts para AI
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        
        # Buffer sizes
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# HTTPS - MinIO S3 (porta 9443)
server {
    listen 9443 ssl http2;
    listen [::]:9443 ssl http2;
    server_name ${DOMAIN};

    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Upload de arquivos grandes
        client_max_body_size 100M;
        proxy_request_buffering off;
    }
}
EOF

# 3. Copiar configuração para o servidor
echo -e "${YELLOW}Passo 3: Enviando configuração para o servidor...${NC}"
scp /tmp/ai4learning-nginx.conf root@${IP_SERVER}:/etc/nginx/sites-available/${DOMAIN}

# 4. Ativar site e obter certificado SSL
echo -e "${YELLOW}Passo 4: Ativando site e obtendo certificado SSL...${NC}"
ssh root@${IP_SERVER} << EOF
    # Ativar site
    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Testar configuração
    nginx -t
    
    # Recarregar Nginx
    systemctl reload nginx
    
    # Obter certificado SSL
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@ai4learning.com.br
    
    # Configurar firewall
    ufw allow 'Nginx Full'
    ufw allow 9443/tcp
    
    # Atualizar docker-compose para usar novo .env
    cd /opt/agents_saas
    docker-compose down
    cp /root/env/.env.vm /app/.env
    docker-compose up -d
EOF

echo ""
echo -e "${GREEN}=== Configuração Concluída! ===${NC}"
echo ""
echo "✅ Domínio configurado: https://${DOMAIN}"
echo "✅ MinIO S3: https://${DOMAIN}:9443"
echo ""
echo -e "${YELLOW}📋 Verifique se o DNS está apontando corretamente:${NC}"
echo "   Tipo A: ${DOMAIN} → ${IP_SERVER}"
echo ""
echo -e "${YELLOW}⚠️  Nota sobre MinIO/S3:${NC}"
echo "   - A porta HTTPS do MinIO foi alterada de 9000 para 9443"
echo "   - Atualize S3_PUBLIC_DOMAIN no .env se necessário"
echo ""
echo "🔧 Para verificar o status:"
echo "   ssh root@${IP_SERVER} 'docker-compose logs -f app'"