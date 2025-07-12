#!/bin/bash

# Script para configurar MinIO com HTTPS via Nginx proxy

echo "🔧 Configurando MinIO com HTTPS..."

# Criar configuração Nginx para MinIO
sudo tee /etc/nginx/sites-available/minio > /dev/null <<EOF
server {
    listen 9443 ssl;
    server_name app.ai4learning.com.br;

    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support (for MinIO console)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Ativar o site
sudo ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/

# Testar configuração Nginx
echo "📝 Testando configuração Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração Nginx válida"
    
    # Recarregar Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado"
    
    # Abrir porta no firewall se ufw estiver ativo
    if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
        sudo ufw allow 9443/tcp
        echo "✅ Porta 9443 aberta no firewall"
    fi
    
    echo ""
    echo "🎉 MinIO HTTPS configurado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Teste o acesso: https://app.ai4learning.com.br:9443"
    echo "2. Reinicie os containers Docker:"
    echo "   docker-compose down && docker-compose up -d"
    echo ""
else
    echo "❌ Erro na configuração Nginx. Verifique o arquivo de configuração."
    exit 1
fi