#!/bin/bash

# =============================================================================
# Script para Corrigir Nginx antes do Certbot
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DOMAIN="app.ai4learning.com.br"
IP_SERVER="64.23.166.36"

echo -e "${GREEN}=== Corrigindo Configuração Nginx para Certbot ===${NC}"
echo ""

# 1. Criar configuração Nginx inicial (apenas HTTP)
echo -e "${YELLOW}Passo 1: Criando configuração Nginx inicial...${NC}"

cat > /tmp/nginx-ai4learning-http.conf << 'EOF'
# Configuração inicial para app.ai4learning.com.br (apenas HTTP)

server {
    listen 80;
    listen [::]:80;
    server_name app.ai4learning.com.br;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Resto redireciona para HTTPS (mas só depois do certificado)
    location / {
        # Por enquanto, apenas proxy para a aplicação
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Configuração HTTP criada!${NC}"

# 2. Aplicar no servidor
echo -e "${YELLOW}Passo 2: Aplicando configuração no servidor...${NC}"

# Verificar conexão SSH
if ! ssh -o ConnectTimeout=5 root@${IP_SERVER} exit 2>/dev/null; then
    echo -e "${RED}❌ Não foi possível conectar ao servidor!${NC}"
    echo "Execute manualmente no servidor:"
    echo "1. Copie /tmp/nginx-ai4learning-http.conf para /etc/nginx/sites-available/${DOMAIN}"
    echo "2. Execute os comandos abaixo"
    exit 1
fi

# Copiar configuração
scp /tmp/nginx-ai4learning-http.conf root@${IP_SERVER}:/etc/nginx/sites-available/${DOMAIN}

# Executar comandos no servidor
ssh root@${IP_SERVER} << 'ENDSSH'
    DOMAIN="app.ai4learning.com.br"
    
    # Criar diretório para Certbot
    mkdir -p /var/www/certbot
    chmod 755 /var/www/certbot
    
    # Criar arquivo de teste
    echo "test" > /var/www/certbot/test.txt
    
    # Remover configuração antiga se existir
    rm -f /etc/nginx/sites-enabled/${DOMAIN}
    
    # Ativar nova configuração
    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Testar configuração
    nginx -t
    
    # Recarregar Nginx
    systemctl reload nginx
    
    echo ""
    echo "Testando acesso ao diretório .well-known..."
    curl -s http://${DOMAIN}/.well-known/acme-challenge/test.txt || echo "Erro no teste"
    
    # Aguardar um pouco
    sleep 2
    
    # Tentar obter certificado
    echo ""
    echo "Obtendo certificado SSL..."
    certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} --non-interactive --agree-tos --email admin@ai4learning.com.br --force-renewal
    
    # Se sucesso, aplicar configuração completa
    if [ -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
        echo ""
        echo "Certificado obtido! Aplicando configuração HTTPS completa..."
        
        # Criar configuração completa
        cat > /etc/nginx/sites-available/${DOMAIN} << 'EOF'
# Configuração completa para app.ai4learning.com.br

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

    # SSL
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
        
        # Recarregar Nginx
        nginx -t && systemctl reload nginx
        
        # Configurar firewall
        ufw allow 'Nginx Full' || true
        ufw allow 9443/tcp || true
        
        echo ""
        echo "✅ Configuração HTTPS aplicada com sucesso!"
    else
        echo ""
        echo "❌ Falha ao obter certificado SSL"
    fi
ENDSSH

echo ""
echo -e "${GREEN}=== Script Finalizado ===${NC}"
echo ""
echo "Se o certificado foi obtido com sucesso:"
echo "🌐 Acesse: https://${DOMAIN}"
echo "📦 MinIO S3: https://${DOMAIN}:9443"
echo ""
echo "Se houve erro, verifique:"
echo "1. O DNS está apontando corretamente"
echo "2. A porta 80 está aberta no firewall"
echo "3. O Nginx está rodando corretamente"