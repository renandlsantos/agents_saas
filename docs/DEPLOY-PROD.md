# 🚀 DEPLOY COMPLETO EM PRODUÇÃO - AGENTS CHAT

## 📋 RESUMO EXECUTIVO

Este guia fornece instruções completas para deploy em produção do **Agents Chat**, uma aplicação de chat AI baseada no Lobe Chat com todas as funcionalidades customizadas.

### 🎯 COMPONENTES INCLUÍDOS

- ✅ **Aplicação Principal** (Next.js 15 + React 19)
- ✅ **PostgreSQL 16** com pgvector para busca vetorial
- ✅ **Redis 7** para cache e sessões
- ✅ **MinIO** para armazenamento de arquivos (S3-compatible)
- ✅ **Casdoor** para autenticação SSO
- ✅ **Sistema de Login/Registro** funcionando
- ✅ **Migrações de banco automatizadas**
- ✅ **Configurações otimizadas** para produção

## 🔧 PRÉ-REQUISITOS

### Sistema Operacional

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Mínimo 8GB RAM (Recomendado: 16GB+)
- Mínimo 50GB disco (Recomendado: 100GB+)
- Docker 24.0+
- Docker Compose 2.20+

### Verificação de Dependências

```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar recursos
free -h
df -h

# Verificar portas disponíveis
netstat -tuln | grep -E ':(3210|5432|6379|9000|9001|8000)'
```

### Instalação de Dependências

```bash
# Ubuntu/Debian
apt update && apt install -y curl wget git nodejs npm

# CentOS/RHEL
yum install -y curl wget git nodejs npm

# Instalar pnpm
npm install -g pnpm

# Instalar tsx (necessário para migrações)
pnpm install -g tsx
```

## 🛠️ CONFIGURAÇÃO INICIAL

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/agents_saas.git
cd agents_saas
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo modelo:

```bash
cp .env.vm .env
```

### 3. Configurar Domínio/IP

**Para servidor com IP público:**

```bash
# Substitua pelo seu IP público
export SERVER_IP="192.168.1.100"
sed -i "s/64.23.166.36/$SERVER_IP/g" .env
```

**Para domínio personalizado:**

```bash
# Substitua pelo seu domínio
export DOMAIN="chat.suaempresa.com"
sed -i "s/http:\/\/64.23.166.36:3210/https:\/\/$DOMAIN/g" .env
```

### 4. Gerar Senhas Seguras

```bash
# Gerar senhas automáticas
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export MINIO_PASSWORD=$(openssl rand -hex 16)
export KEY_VAULTS_SECRET=$(openssl rand -hex 32)
export NEXT_AUTH_SECRET=$(openssl rand -hex 32)

# Atualizar .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
sed -i "s/MINIO_ROOT_PASSWORD=.*/MINIO_ROOT_PASSWORD=$MINIO_PASSWORD/" .env
sed -i "s/KEY_VAULTS_SECRET=.*/KEY_VAULTS_SECRET=$KEY_VAULTS_SECRET/" .env
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXT_AUTH_SECRET/" .env
```

### 5. Configurar API Keys

**Edite o arquivo .env e adicione suas chaves:**

```bash
nano .env
```

```env
# Adicione suas chaves de API
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
AZURE_API_KEY=...
AZURE_ENDPOINT=...
AZURE_API_VERSION=2024-02-01
```

## 🐳 DEPLOY COM DOCKER

### 1. Build da Aplicação

```bash
# Instalar dependências
pnpm install

# Build da aplicação
pnpm run build

# Build da imagem Docker
docker build -f Dockerfile -t agents-chat:production .
```

### 2. Iniciar Infraestrutura

```bash
# Criar diretórios de dados
mkdir -p data/{postgres,redis,minio,casdoor} logs/app

# Definir permissões
sudo chown -R 1001:1001 data/postgres
sudo chown -R 999:999 data/redis
sudo chown -R 1000:1000 data/minio
sudo chown -R 1001:1001 logs/app

# Iniciar apenas a infraestrutura primeiro
docker-compose up -d postgres redis minio casdoor
```

### 3. Aguardar Serviços

```bash
# Aguardar PostgreSQL
echo "Aguardando PostgreSQL..."
while ! docker exec agents-chat-postgres pg_isready -U postgres; do
  sleep 2
done
echo "PostgreSQL pronto!"

# Aguardar Redis
echo "Aguardando Redis..."
while ! docker exec agents-chat-redis redis-cli ping; do
  sleep 2
done
echo "Redis pronto!"

# Aguardar MinIO
echo "Aguardando MinIO..."
while ! curl -f http://localhost:9000/minio/health/live; do
  sleep 2
done
echo "MinIO pronto!"
```

### 4. Configurar MinIO

```bash
# Criar bucket necessário
docker exec agents-chat-minio mc alias set myminio http://localhost:9000 minioadmin $MINIO_PASSWORD
docker exec agents-chat-minio mc mb myminio/lobe
docker exec agents-chat-minio mc anonymous set download myminio/lobe
```

### 5. Executar Migrações

```bash
# Executar migrações do banco
MIGRATION_DB=1 DATABASE_URL="postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/agents_chat" tsx ./scripts/migrateServerDB/index.ts

# Verificar se extensão pgvector foi instalada
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 6. Iniciar Aplicação

```bash
# Iniciar a aplicação
docker-compose up -d app

# Verificar logs
docker logs -f agents-chat
```

## 🔒 CONFIGURAÇÃO DE SEGURANÇA

### 1. Firewall

```bash
# Ubuntu/Debian
ufw allow 22/tcp
ufw allow 3210/tcp
ufw allow 9000/tcp
ufw allow 9001/tcp
ufw allow 8000/tcp
ufw --force enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=3210/tcp
firewall-cmd --permanent --add-port=9000/tcp
firewall-cmd --permanent --add-port=9001/tcp
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --reload
```

### 2. SSL/TLS (Nginx + Let's Encrypt)

```bash
# Instalar Nginx
apt install -y nginx certbot python3-certbot-nginx

# Configurar Nginx
cat > /etc/nginx/sites-available/agents-chat << 'EOF'
server {
    listen 80;
    server_name chat.suaempresa.com;
    
    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/agents-chat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Configurar SSL
certbot --nginx -d chat.suaempresa.com
```

### 3. Backup Automático

```bash
# Criar script de backup
cat > /usr/local/bin/backup-agents-chat.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/agents-chat"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup do banco
docker exec agents-chat-postgres pg_dump -U postgres agents_chat > "$BACKUP_DIR/db_$DATE.sql"

# Backup dos dados
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" -C /path/to/agents_saas data/

# Manter apenas últimos 7 dias
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-agents-chat.sh

# Configurar cron para backup diário
echo "0 2 * * * /usr/local/bin/backup-agents-chat.sh" | crontab -
```

## 📊 MONITORAMENTO E LOGS

### 1. Logs Centralizados

```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs específicos
docker logs -f agents-chat          # Aplicação
docker logs -f agents-chat-postgres # Banco
docker logs -f agents-chat-redis    # Redis
docker logs -f agents-chat-minio    # MinIO
docker logs -f agents-chat-casdoor  # Casdoor
```

### 2. Métricas de Sistema

```bash
# Monitorar recursos
docker stats

# Espaço em disco
df -h

# Memória
free -h

# Processamento
top -p $(docker inspect -f '{{.State.Pid}}' agents-chat)
```

### 3. Health Checks

```bash
# Script de verificação
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
echo "=== HEALTH CHECK AGENTS CHAT ==="
echo "$(date)"

# Verificar aplicação
if curl -f http://localhost:3210/api/health &>/dev/null; then
    echo "✅ App: OK"
else
    echo "❌ App: ERRO"
fi

# Verificar banco
if docker exec agents-chat-postgres pg_isready -U postgres &>/dev/null; then
    echo "✅ PostgreSQL: OK"
else
    echo "❌ PostgreSQL: ERRO"
fi

# Verificar Redis
if docker exec agents-chat-redis redis-cli ping &>/dev/null; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: ERRO"
fi

# Verificar MinIO
if curl -f http://localhost:9000/minio/health/live &>/dev/null; then
    echo "✅ MinIO: OK"
else
    echo "❌ MinIO: ERRO"
fi

echo "=============================="
EOF

chmod +x /usr/local/bin/health-check.sh
```

## 🔄 OPERAÇÕES DE MANUTENÇÃO

### 1. Atualização da Aplicação

```bash
# Fazer backup antes
/usr/local/bin/backup-agents-chat.sh

# Atualizar código
git pull origin main

# Reinstalar dependências
pnpm install

# Rebuild
pnpm run build
docker build -f Dockerfile -t agents-chat:production .

# Executar migrações se necessário
MIGRATION_DB=1 DATABASE_URL="postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/agents_chat" tsx ./scripts/migrateServerDB/index.ts

# Reiniciar aplicação
docker-compose restart app
```

### 2. Backup Manual

```bash
# Backup completo
/usr/local/bin/backup-agents-chat.sh

# Restaurar backup
docker exec -i agents-chat-postgres psql -U postgres agents_chat < /backup/agents-chat/db_20240101_120000.sql
```

### 3. Reinicialização Completa

```bash
# Parar tudo
docker-compose down

# Limpar containers órfãos
docker container prune -f

# Iniciar novamente
docker-compose up -d
```

## 🚨 SOLUÇÃO DE PROBLEMAS

### Erro: "extension vector is not available"

**Solução:**

```bash
# Verificar se a imagem correta está sendo usada
docker-compose ps postgres
# Deve mostrar: pgvector/pgvector:pg16

# Se necessário, recriar container
docker-compose down postgres
docker-compose up -d postgres
```

### Erro: Build falha por falta de memória

**Solução:**

```bash
# Aumentar memória do Docker
# Em Docker Desktop: Settings > Resources > Memory > 8GB+

# Ou usar swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Erro: MinIO não consegue criar bucket

**Solução:**

```bash
# Verificar permissões
ls -la data/minio/
sudo chown -R 1000:1000 data/minio/

# Recriar bucket manualmente
docker exec -it agents-chat-minio mc mb /data/lobe
```

### Erro: Aplicação não conecta ao banco

**Solução:**

```bash
# Verificar network
docker network ls | grep agents-chat

# Verificar conectividade
docker exec agents-chat ping agents-chat-postgres

# Verificar variáveis de ambiente
docker exec agents-chat env | grep DATABASE_URL
```

## 📞 SUPORTE

### Logs Importantes

- **Aplicação**: `docker logs agents-chat`
- **Banco**: `docker logs agents-chat-postgres`
- **Migrações**: `/var/log/agents-chat-migrations.log`

### Comandos Úteis

```bash
# Status completo
docker-compose ps

# Restart específico
docker-compose restart app

# Logs em tempo real
docker-compose logs -f app

# Entrar no container
docker exec -it agents-chat bash

# Verificar banco
docker exec -it agents-chat-postgres psql -U postgres -d agents_chat
```

### Contato

- **GitHub Issues**: <https://github.com/seu-usuario/agents_saas/issues>
- **Email**: <contato@agentssaas.com>

---

## 🎉 DEPLOY CONCLUÍDO!

Após seguir todos os passos, você terá:

- ✅ **Aplicação rodando** em `http://seu-dominio.com`
- ✅ **MinIO Console** em `http://seu-dominio.com:9001`
- ✅ **Casdoor Admin** em `http://seu-dominio.com:8000`
- ✅ **Backups automáticos** configurados
- ✅ **Monitoramento** ativo
- ✅ **SSL/TLS** configurado
- ✅ **Todos os serviços** funcionando

**Credenciais salvas em**: `deploy-info.txt`

**Próximos passos:**

1. Configurar usuários no Casdoor
2. Personalizar interface da aplicação
3. Configurar modelos de IA adicionais
4. Implementar monitoramento avançado
