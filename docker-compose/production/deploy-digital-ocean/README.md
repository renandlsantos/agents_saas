# 🚀 Deploy Agents Chat - Digital Ocean

Guia completo para deploy do Agents Chat em produção no Digital Ocean.

## 📋 Pré-requisitos

- VM Ubuntu 22.04+ no Digital Ocean
- Mínimo 2GB RAM (recomendado 4GB+)
- Domínio configurado (opcional)
- Acesso SSH à VM

## 🛠️ Scripts Disponíveis

### 1. `setup-swap.sh` - Configuração de Swap e Otimização

**Execute PRIMEIRO se sua VM tem menos de 4GB de RAM:**

```bash
sudo ./setup-swap.sh
```

Este script:

- Configura swap permanente baseado na RAM disponível
- Otimiza configurações do sistema para builds Docker
- Configura Docker para usar menos memória
- Reinicia o Docker com configurações otimizadas

### 2. `deploy-production.sh` - Deploy Completo com Build Local

**Para builds personalizados (requer mais memória):**

```bash
./deploy-production.sh < dominio > [email]
```

Este script:

- ✅ Verifica memória disponível
- ✅ Configura swap temporário se necessário
- ✅ Tenta build otimizado com configurações de memória
- ✅ Fallback para build alternativo com menos recursos
- ✅ Fallback para imagem pré-construída se tudo falhar
- ✅ Configura Nginx, SSL, firewall, fail2ban

### 3. `deploy-prebuilt.sh` - Deploy com Imagem Pré-construída

**Recomendado para VMs com pouca RAM:**

```bash
./deploy-prebuilt.sh < dominio > [email]
```

Este script:

- ✅ Usa imagem oficial do Docker Hub (sem build local)
- ✅ Muito mais rápido e usa menos recursos
- ✅ Ideal para VMs com 2GB de RAM
- ✅ Configura Nginx, SSL, firewall, fail2ban

## 🔧 Solução para Erro de Memória (Exit Code 137)

Se você encontrar o erro:

```
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build:docker" did not complete successfully: exit code: 137
```

### Soluções em Ordem de Prioridade:

#### 1. **Configurar Swap (Recomendado)**

```bash
sudo ./setup-swap.sh
```

#### 2. **Usar Imagem Pré-construída**

```bash
./deploy-prebuilt.sh <seu-dominio> <seu-email>
```

#### 3. **Aumentar RAM da VM**

- No Digital Ocean Dashboard
- Resize Droplet para plano com mais RAM
- Mínimo recomendado: 4GB

#### 4. **Build Manual com Configurações Específicas**

```bash
# Configurar variáveis de ambiente para usar menos memória
export NODE_OPTIONS="--max-old-space-size=1024"
export DOCKER_BUILDKIT=1

# Build com limitações de memória
docker build --no-cache --memory=2g --memory-swap=4g -t agents-chat:latest .
```

## 📊 Requisitos de Memória

| Tipo de Deploy        | RAM Mínima | RAM Recomendada | Tempo Estimado |
| --------------------- | ---------- | --------------- | -------------- |
| Imagem Pré-construída | 1GB        | 2GB             | 5-10 min       |
| Build Local           | 2GB        | 4GB             | 15-30 min      |
| Build Local + Swap    | 1GB        | 2GB             | 20-40 min      |

## 🚀 Deploy Rápido (Recomendado)

Para a maioria dos casos, use o deploy com imagem pré-construída:

```bash
# 1. Configurar swap (se RAM < 4GB)
sudo ./setup-swap.sh

# 2. Deploy com imagem pré-construída
./deploy-prebuilt.sh meusite.com admin@meusite.com
```

## 🔍 Monitoramento e Logs

### Verificar Status dos Serviços

```bash
cd /opt/agents-chat
docker-compose ps
docker-compose logs -f
```

### Verificar Uso de Memória

```bash
free -h
docker stats
```

### Verificar Logs do Sistema

```bash
sudo journalctl -u docker -f
sudo journalctl -u nginx -f
```

## 🔧 Comandos Úteis

### Gerenciar Serviços

```bash
cd /opt/agents-chat

# Parar serviços
docker-compose down

# Iniciar serviços
docker-compose up -d

# Reiniciar serviços
docker-compose restart

# Ver logs
docker-compose logs -f
```

### Backup e Restore

```bash
# Backup
docker-compose exec db pg_dump -U postgres > backup.sql

# Restore
docker-compose exec -T db psql -U postgres < backup.sql
```

### Atualizações

```bash
# Atualizar código
cd /opt/agents-chat
git pull origin main

# Rebuild (se usando build local)
docker-compose down
docker-compose up -d --build

# Ou usar imagem pré-construída atualizada
docker pull lobehub/lobe-chat:latest
docker-compose up -d
```

## 🛡️ Segurança

O deploy inclui:

- ✅ Firewall UFW configurado
- ✅ Fail2ban para proteção contra ataques
- ✅ SSL/TLS com Let's Encrypt
- ✅ Nginx como proxy reverso
- ✅ Containers isolados

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs**: `docker-compose logs -f`
2. **Verifique memória**: `free -h`
3. **Verifique Docker**: `docker system df`
4. **Limpe cache**: `docker system prune -a`

## 🔄 Atualizações Automáticas

Para configurar atualizações automáticas:

```bash
# Criar script de atualização
sudo nano /opt/agents-chat/update.sh
```

```bash
#!/bin/bash
cd /opt/agents-chat
git pull origin main
docker-compose down
docker-compose up -d
```

```bash
# Tornar executável
chmod +x /opt/agents-chat/update.sh

# Adicionar ao crontab (atualizar diariamente às 2h)
crontab -e
# Adicionar: 0 2 * * * /opt/agents-chat/update.sh
```

## 📝 Notas Importantes

- **Backup**: Sempre faça backup antes de atualizações
- **Monitoramento**: Configure alertas de uso de memória
- **Segurança**: Mantenha o sistema atualizado
- **Performance**: Use imagem pré-construída para VMs pequenas
