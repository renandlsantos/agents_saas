#!/bin/bash

echo "🚀 Correção Completa do MinIO - Script Unificado V2"
echo "==================================================="

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

# 3. Configurar MinIO com senha correta
echo ""
echo "🔐 PASSO 3: Configurando MinIO..."
echo "---------------------------------"
ssh root@64.23.166.36 << 'EOF'
# Buscar senha do MinIO no arquivo .env
if [ -f /opt/agents_saas/.env ]; then
    ENV_FILE="/opt/agents_saas/.env"
elif [ -f /root/agents_saas/.env ]; then
    ENV_FILE="/root/agents_saas/.env"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Extrair senha do MinIO
MINIO_PASSWORD=$(grep "^MINIO_ROOT_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
echo "🔑 Usando senha do MinIO: ${MINIO_PASSWORD:0:4}..." # Mostrar apenas primeiros 4 caracteres

# Testar conexão com MinIO
echo "🔍 Testando conexão com MinIO..."
docker exec agents-chat-minio mc alias set myminio http://localhost:9000 minioadmin "$MINIO_PASSWORD" --api S3v4

if [ $? -eq 0 ]; then
    echo "✅ Conexão com MinIO estabelecida!"
    
    # Criar bucket se não existir
    docker exec agents-chat-minio mc mb myminio/lobe --ignore-existing || echo "⚠️ Bucket já existe ou erro ao criar"
    
    # Configurar política pública para leitura
    docker exec agents-chat-minio mc anonymous set public myminio/lobe || echo "⚠️ Erro ao configurar política"
    
    # Listar buckets para confirmar
    echo "📦 Buckets disponíveis:"
    docker exec agents-chat-minio mc ls myminio/
else
    echo "❌ Falha ao conectar com MinIO. Verificando configuração..."
    echo "🔍 Variáveis de ambiente do MinIO:"
    docker exec agents-chat-minio env | grep MINIO
fi

# Aplicar configuração de CORS diretamente no container
echo "🌐 Configurando CORS..."
docker exec agents-chat-minio sh -c 'cat > /tmp/cors.json << CORS
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
      "MaxAgeSeconds": 3000
    }
  ]
}
CORS'

# Tentar aplicar CORS (pode falhar em algumas versões)
docker exec agents-chat-minio mc cors set /tmp/cors.json myminio/lobe 2>/dev/null || echo "⚠️ CORS via mc não suportado nesta versão"

# Reiniciar MinIO
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
curl -k -I https://app.ai4learning.com.br:9443/minio/health/live 2>/dev/null | head -n 1 || echo "⚠️ MinIO HTTPS ainda não está acessível"
echo ""
echo "🔍 Verificando se código tem a correção:"
docker exec agents-chat grep -c "S3_PUBLIC_DOMAIN" /app/src/server/modules/S3/index.ts 2>/dev/null && echo "✅ Correção de URL aplicada" || echo "⚠️ Correção de URL não encontrada"
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
echo "🔍 DEBUGGING (se necessário):"
echo "----------------------------"
echo "1. Ver senha do MinIO:"
echo "   ssh root@64.23.166.36 'grep MINIO_ROOT_PASSWORD /opt/agents_saas/.env'"
echo ""
echo "2. Testar MinIO diretamente:"
echo "   ssh root@64.23.166.36 'docker exec agents-chat-minio mc ls myminio/'"
echo ""
echo "3. Ver logs:"
echo "   ssh root@64.23.166.36 'docker logs --tail=50 agents-chat-minio'"