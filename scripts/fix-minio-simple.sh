#!/bin/bash

echo "🔧 Corrigindo erro 403 do MinIO (versão simplificada)..."

# Verificar se está no servidor correto
if [[ ! -f /opt/agents_saas/docker-compose.yml ]]; then
    echo "❌ Este script deve ser executado no servidor onde o MinIO está rodando"
    exit 1
fi

# 1. Configurar MinIO para aceitar requisições
echo "📝 Configurando MinIO..."

# Configurar alias do MinIO
docker exec agents-chat-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin --api S3v4

# Tornar bucket público (temporário para teste)
echo "🔓 Tornando bucket público para teste..."
docker exec agents-chat-minio mc anonymous set public myminio/lobe

# 2. Verificar se o Nginx está configurado para MinIO
echo "📝 Verificando configuração Nginx..."

# Criar configuração Nginx para MinIO se não existir
if [[ ! -f /etc/nginx/sites-available/minio ]]; then
    echo "📝 Criando configuração Nginx para MinIO..."
    sudo tee /etc/nginx/sites-available/minio > /dev/null <<'EOF'
server {
    listen 9443 ssl;
    server_name app.ai4learning.com.br;

    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Aumentar limite para uploads
    client_max_body_size 1000M;
    client_body_buffer_size 128k;

    # Timeouts para uploads grandes
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host:9443;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host:9443;

        # Headers importantes para MinIO
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://app.ai4learning.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://app.ai4learning.com.br" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
EOF

    # Habilitar o site
    sudo ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
fi

# 3. Abrir porta 9443 no firewall
echo "🔓 Abrindo porta 9443 no firewall..."
sudo ufw allow 9443/tcp

# 4. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Configurações aplicadas!"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste o upload novamente em https://app.ai4learning.com.br/files"
echo "2. Se ainda der erro, verifique os logs:"
echo "   - Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   - MinIO: docker logs -f agents-chat-minio"
echo ""
echo "🔐 Para reverter acesso público do bucket (após resolver):"
echo "   docker exec agents-chat-minio mc anonymous set none myminio/lobe"
