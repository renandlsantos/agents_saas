#!/bin/bash

echo "🚀 Correção Completa do MinIO - Script Unificado"
echo "================================================"

# Configurações baseadas no seu .env.vm
MINIO_PASSWORD="8cfbebfa4b02663cb686293a95974816"
PUBLIC_DOMAIN="https://app.ai4learning.com.br:9443"

# 1. Atualizar e fazer deploy do código
echo ""
echo "📦 PASSO 1: Atualizando código no servidor..."
echo "---------------------------------------------"
ssh root@64.23.166.36 << 'EOF'
cd /root/agents_saas
git pull
docker-compose build app
docker-compose stop app
docker-compose up -d app
sleep 10
EOF

# 2. Configurar Nginx para proxy HTTPS
echo ""
echo "🔧 PASSO 2: Configurando Nginx para HTTPS..."
echo "-------------------------------------------"
ssh root@64.23.166.36 << 'EOF'
# Criar configuração do Nginx para MinIO
cat > /etc/nginx/sites-available/minio << 'NGINX'
server {
    listen 9443 ssl;
    server_name app.ai4learning.com.br;

    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Configurações para upload
    client_max_body_size 1000M;
    client_body_buffer_size 128k;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        
        # Configurações específicas do MinIO
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;
        
        # CORS Headers
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://app.ai4learning.com.br" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "*" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        add_header Access-Control-Allow-Origin "https://app.ai4learning.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "*" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}
NGINX

# Ativar site e recarregar Nginx
ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Abrir porta no firewall
ufw allow 9443/tcp 2>/dev/null || true
EOF

# 3. Configurar MinIO
echo ""
echo "🔐 PASSO 3: Configurando MinIO..."
echo "---------------------------------"
ssh root@64.23.166.36 << EOF
# Configurar alias do MinIO
docker exec agents-chat-minio mc alias set myminio http://localhost:9000 minioadmin "$MINIO_PASSWORD" --api S3v4 || true

# Criar bucket se não existir
docker exec agents-chat-minio mc mb myminio/lobe --ignore-existing || true

# Configurar política do bucket para permitir uploads
docker exec agents-chat-minio mc anonymous set download myminio/lobe || true

# Configurar CORS via política JSON
cat > /tmp/bucket-policy.json << 'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lobe/*",
        "arn:aws:s3:::lobe"
      ]
    }
  ]
}
POLICY

# Aplicar política
docker exec -i agents-chat-minio mc policy set-json /tmp/bucket-policy.json myminio/lobe || true
rm -f /tmp/bucket-policy.json

# Reiniciar MinIO para aplicar mudanças
docker restart agents-chat-minio
sleep 5
EOF

# 4. Verificar configurações
echo ""
echo "✅ PASSO 4: Verificando configurações..."
echo "----------------------------------------"
ssh root@64.23.166.36 << 'EOF'
echo "🔍 Status dos serviços:"
docker-compose ps | grep -E "app|minio"
echo ""
echo "🔍 Teste de conectividade HTTPS:"
curl -k -I https://app.ai4learning.com.br:9443/minio/health/live || echo "⚠️ MinIO HTTPS ainda não está acessível"
echo ""
echo "🔍 Logs recentes da aplicação:"
docker-compose logs --tail=20 app | grep -E "S3_|error|Error" || echo "✅ Sem erros aparentes"
EOF

echo ""
echo "🎉 Correção completa aplicada!"
echo "=============================="
echo ""
echo "📋 INSTRUÇÕES FINAIS:"
echo "--------------------"
echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "2. Acesse: https://app.ai4learning.com.br/files"
echo "3. Teste o upload de um arquivo"
echo ""
echo "🔍 SE AINDA HOUVER PROBLEMAS:"
echo "----------------------------"
echo "1. Verifique os logs:"
echo "   ssh root@64.23.166.36 'docker logs -f agents-chat-minio'"
echo "   ssh root@64.23.166.36 'tail -f /var/log/nginx/error.log'"
echo ""
echo "2. Teste acesso direto ao MinIO:"
echo "   curl -k https://app.ai4learning.com.br:9443/minio/health/live"
echo ""
echo "3. Verifique se a aplicação tem a correção:"
echo "   ssh root@64.23.166.36 'docker exec agents-chat grep -A5 S3_PUBLIC_DOMAIN /app/src/server/modules/S3/index.ts'"