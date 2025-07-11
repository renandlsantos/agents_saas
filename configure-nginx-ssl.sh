#!/bin/bash

# ============================================================================
# Script para configurar Nginx com SSL para Agents Chat
# ============================================================================

set -e

DOMAIN=${1:-""}

if [ -z "$DOMAIN" ]; then
    echo "Uso: ./configure-nginx-ssl.sh seu-dominio.com"
    exit 1
fi

echo "🔧 Configurando Nginx com SSL para ${DOMAIN}..."

# Criar configuração Nginx
cat > agents-chat-nginx.conf << EOF
# Configuração Nginx para Agents Chat com SSL

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL - Certificados serão gerados pelo Certbot
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy para aplicação Next.js
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
        
        # Timeouts para requisições longas (AI)
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
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

# Proxy para MinIO S3 (porta 9000)
server {
    listen 9000 ssl http2;
    listen [::]:9000 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Configurações para upload de arquivos grandes
        client_max_body_size 100M;
        proxy_request_buffering off;
    }
}
EOF

echo "✅ Configuração Nginx criada: agents-chat-nginx.conf"
echo ""
echo "📋 Instruções para aplicar no servidor:"
echo ""
echo "1. Instalar Nginx e Certbot (se não instalados):"
echo "   apt update && apt install -y nginx certbot python3-certbot-nginx"
echo ""
echo "2. Copiar configuração:"
echo "   scp agents-chat-nginx.conf root@64.23.166.36:/etc/nginx/sites-available/${DOMAIN}"
echo ""
echo "3. No servidor, executar:"
echo "   ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   certbot --nginx -d ${DOMAIN}"
echo "   systemctl reload nginx"
echo ""
echo "4. Atualizar firewall:"
echo "   ufw allow 'Nginx Full'"
echo "   ufw allow 9000/tcp"
echo ""
echo "✅ Após isso, acesse: https://${DOMAIN}"