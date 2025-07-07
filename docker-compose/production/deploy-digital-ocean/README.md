# Agents Chat - Deploy Digital Ocean

Scripts automatizados para deploy do Agents Chat em servidores Ubuntu/Digital Ocean.

## 📋 Pré-requisitos

- Ubuntu 20.04+ ou Digital Ocean Droplet
- Docker e Docker Compose instalados
- Usuário com permissões sudo
- Usuário adicionado ao grupo docker

### Instalação do Docker (se necessário)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🚀 Scripts Disponíveis

### 1. Deploy Produção (`deploy-prod.sh`)

Deploy completo para produção com Nginx, SSL e configurações otimizadas.

**Uso:**

```bash
# Com domínio real
./deploy-prod.sh meusite.com admin@meusite.com

# Para testes locais
./deploy-prod.sh localhost
```

**Características:**

- ✅ Imagem pré-construída (rápido)
- ✅ Nginx configurado
- ✅ SSL automático com Let's Encrypt
- ✅ Configurações de produção
- ✅ Logs organizados
- ✅ Reinicialização automática

### 2. Deploy Desenvolvimento (`deploy-dev.sh`)

Deploy simplificado para testes e desenvolvimento.

**Uso:**

```bash
# Porta padrão (3210)
./deploy-dev.sh

# Porta customizada
./deploy-dev.sh 3000
```

**Características:**

- ✅ Imagem pré-construída (rápido)
- ✅ Configuração simplificada
- ✅ Acesso direto via porta
- ✅ Ideal para testes
- ✅ Sem Nginx/SSL

## 📁 Estrutura de Diretórios

### Produção

```
/opt/agents-chat/
├── docker-compose.yml
├── .env
├── data/
│   ├── postgres/
│   ├── minio/
│   └── redis/
└── logs/
    ├── app/
    ├── casdoor/
    └── nginx/
```

### Desenvolvimento

```
/opt/agents-chat-dev/
├── docker-compose.yml
├── data/
│   ├── postgres/
│   ├── minio/
│   ├── redis/
│   └── casdoor/
└── logs/
    └── app/
```

## 🔧 Configuração Pós-Deploy

### 1. Configurar API Keys

Edite o arquivo `.env` no diretório do projeto:

```bash
# Produção
sudo nano /opt/agents-chat/.env

# Desenvolvimento
sudo nano /opt/agents-chat-dev/.env
```

Adicione suas chaves de API:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
AZURE_API_KEY=...
```

### 2. Reiniciar Serviços

```bash
# Produção
cd /opt/agents-chat
docker-compose restart app

# Desenvolvimento
cd /opt/agents-chat-dev
docker-compose restart app
```

## 📊 Monitoramento

### Verificar Status dos Serviços

```bash
# Produção
cd /opt/agents-chat
docker-compose ps

# Desenvolvimento
cd /opt/agents-chat-dev
docker-compose ps
```

### Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas aplicação
docker-compose logs -f app

# Apenas banco de dados
docker-compose logs -f postgres
```

## 🛠️ Comandos Úteis

### Gerenciamento de Serviços

```bash
# Parar todos os serviços
docker-compose down

# Iniciar serviços
docker-compose up -d

# Reiniciar serviços
docker-compose restart

# Reconstruir e iniciar
docker-compose up -d --build
```

### Backup e Restore

```bash
# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres agents_chat_prod > backup.sql

# Restore do banco de dados
docker-compose exec -T postgres psql -U postgres agents_chat_prod < backup.sql
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpeza completa
docker system prune -a
```

## 🔒 Segurança

### Firewall (UFW)

```bash
# Instalar UFW
sudo apt install ufw

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
```

### Atualizações Automáticas

```bash
# Instalar unattended-upgrades
sudo apt install unattended-upgrades

# Configurar
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro de permissão Docker**

   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Porta já em uso**

   ```bash
   # Verificar o que está usando a porta
   sudo netstat -tulpn | grep :3210

   # Parar processo
   sudo kill -9 <PID>
   ```

3. **SSL não funciona**

   ```bash
   # Verificar se o domínio aponta para o servidor
   nslookup meusite.com
   
   # Verificar logs do certbot
   sudo certbot certificates
   ```

4. **Aplicação não inicia**

   ```bash
   # Verificar logs
   docker-compose logs app
   
   # Verificar variáveis de ambiente
   docker-compose config
   ```

### Logs de Diagnóstico

```bash
# Status do sistema
systemctl status docker
systemctl status nginx

# Uso de recursos
df -h
free -h
docker system df
```

## 📞 Suporte

Para problemas específicos:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status: `docker-compose ps`
3. Verifique recursos: `htop` ou `top`
4. Verifique conectividade: `ping` e `curl`

## 🔄 Atualizações

Para atualizar o Agents Chat:

```bash
# Produção
cd /opt/agents-chat
git pull origin main
docker-compose down
docker-compose up -d

# Desenvolvimento
cd /opt/agents-chat-dev
git pull origin main
docker-compose down
docker-compose up -d
```
