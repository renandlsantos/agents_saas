# Correção do Erro Mixed Content MinIO

## 🚨 Problema

Sua aplicação está gerando URLs HTTP para o MinIO quando acessada via HTTPS, causando erro de "Mixed Content".

## 🔧 Soluções

### Solução 1: Configurar Proxy HTTPS (Recomendado para Produção)

1. **Configure o Nginx para fazer proxy do MinIO via HTTPS**:

```bash
# No servidor (64.23.166.36)
sudo nano /etc/nginx/sites-available/minio

# Adicione esta configuração:
server {
    listen 9443 ssl;
    server_name app.ai4learning.com.br;

    ssl_certificate /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **Ative o site e reinicie o Nginx**:

```bash
sudo ln -s /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Abra a porta no firewall**:

```bash
sudo ufw allow 9443/tcp
```

### Solução 2: Usar Proxy Reverso Principal (Alternativa)

Modifique sua configuração Nginx principal para incluir um location para MinIO:

```nginx
server {
    listen 443 ssl;
    server_name app.ai4learning.com.br;

    # ... configurações SSL existentes ...

    # Adicione este location para MinIO
    location /minio/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Necessário para upload de arquivos grandes
        client_max_body_size 100M;
    }
}
```

Depois atualize o `.env`:

```env
S3_PUBLIC_DOMAIN=https://app.ai4learning.com.br/minio
```

### Solução 3: Configurar MinIO com SSL Nativo

1. **Gere certificados para MinIO**:

```bash
# Copie os certificados Let's Encrypt
sudo cp /etc/letsencrypt/live/app.ai4learning.com.br/fullchain.pem /data/minio/certs/public.crt
sudo cp /etc/letsencrypt/live/app.ai4learning.com.br/privkey.pem /data/minio/certs/private.key
sudo chown 1000:1000 /data/minio/certs/*
```

2. **Atualize docker-compose.yml**:

```yaml
minio:
  image: minio/minio
  ports:
    - '9000:9000'
    - '9443:9443'
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  volumes:
    - ./data/minio:/data
    - ./data/minio/certs:/root/.minio/certs
  command: server /data --console-address ":9001" --address ":9443"
```

## 🚀 Solução Rápida (Temporária)

Para teste imediato, acesse sua aplicação via HTTP em vez de HTTPS:

```
http://app.ai4learning.com.br:3210
```

Isso evitará o erro de mixed content temporariamente.

## 📋 Verificação

Após aplicar uma das soluções:

1. Teste o acesso ao MinIO:

```bash
curl -I https://app.ai4learning.com.br:9443/minio/health/live
```

2. Reinicie a aplicação:

```bash
docker-compose down
docker-compose up -d
```

3. Teste o upload de arquivos na interface

## ⚠️ Importante

- A solução 1 (Nginx proxy) é mais simples e recomendada
- Certifique-se de que os certificados SSL estão válidos
- Após configurar, atualize `S3_PUBLIC_DOMAIN` no `.env` se necessário
