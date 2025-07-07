# 📋 Resumo dos Scripts de Deploy - Agents Chat

## 🎯 Visão Geral

Esta pasta contém todos os scripts necessários para deploy do Agents Chat em produção no Digital Ocean, com soluções específicas para problemas de memória durante builds Docker.

## 📁 Estrutura dos Arquivos

```
docker-compose/production/deploy-digital-ocean/
├── deploy-production.sh      # Deploy completo com build local otimizado
├── deploy-prebuilt.sh        # Deploy rápido com imagem pré-construída
├── setup-swap.sh            # Configuração de swap e otimização
├── diagnose.sh              # Diagnóstico completo do sistema
├── README.md                # Documentação principal
└── DEPLOY-SUMMARY.md        # Este arquivo
```

## 🚀 Fluxo de Deploy Recomendado

### Para VMs com 2GB RAM (Recomendado)

```bash
# 1. Diagnóstico inicial
./diagnose.sh

# 2. Configurar swap (se necessário)
sudo ./setup-swap.sh

# 3. Deploy com imagem pré-construída
./deploy-prebuilt.sh meusite.com admin@meusite.com
```

### Para VMs com 4GB+ RAM

```bash
# 1. Diagnóstico inicial
./diagnose.sh

# 2. Deploy completo com build local
./deploy-production.sh meusite.com admin@meusite.com
```

## 🔧 Scripts Detalhados

### 1. `diagnose.sh` - Diagnóstico do Sistema

**Uso:** `./diagnose.sh`

**O que faz:**

- ✅ Verifica sistema operacional e recursos
- ✅ Analisa memória, CPU, disco e swap
- ✅ Verifica Docker e permissões
- ✅ Testa conectividade de rede
- ✅ Verifica serviços do sistema
- ✅ Analisa logs recentes
- ✅ Fornece recomendações específicas

**Quando usar:** Sempre antes de qualquer deploy

### 2. `setup-swap.sh` - Configuração de Swap

**Uso:** `sudo ./setup-swap.sh`

**O que faz:**

- ✅ Configura swap permanente baseado na RAM
- ✅ Otimiza configurações do sistema (swappiness, cache pressure)
- ✅ Configura Docker para usar menos memória
- ✅ Reinicia Docker com configurações otimizadas

**Quando usar:** Se RAM < 4GB ou se `diagnose.sh` recomendar

### 3. `deploy-prebuilt.sh` - Deploy Rápido

**Uso:** `./deploy-prebuilt.sh <dominio> [email]`

**O que faz:**

- ✅ Usa imagem oficial do Docker Hub (sem build local)
- ✅ Configura Nginx, SSL, firewall, fail2ban
- ✅ Muito mais rápido e usa menos recursos
- ✅ Ideal para VMs com 2GB de RAM

**Vantagens:**

- ⚡ Muito rápido (5-10 minutos)
- 💾 Usa pouca memória
- 🔧 Configuração completa
- 🛡️ Segurança incluída

**Desvantagens:**

- ❌ Não inclui suas modificações personalizadas
- ❌ Usa versão oficial do projeto

### 4. `deploy-production.sh` - Deploy Completo

**Uso:** `./deploy-production.sh <dominio> [email]`

**O que faz:**

- ✅ Verifica memória disponível
- ✅ Configura swap temporário se necessário
- ✅ Tenta build otimizado com configurações de memória
- ✅ Fallback para build alternativo com menos recursos
- ✅ Fallback para imagem pré-construída se tudo falhar
- ✅ Configura Nginx, SSL, firewall, fail2ban

**Vantagens:**

- ✅ Inclui suas modificações personalizadas
- ✅ Controle total sobre o código
- ✅ Configuração completa
- 🛡️ Segurança incluída

**Desvantagens:**

- ⏱️ Mais lento (15-30 minutos)
- 💾 Usa mais memória
- 🔧 Pode falhar em VMs pequenas

## 🛠️ Solução para Erro de Memória (Exit Code 137)

### Problema

```
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build:docker" did not complete successfully: exit code: 137
```

### Soluções (em ordem de prioridade)

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
export NODE_OPTIONS="--max-old-space-size=1024"
export DOCKER_BUILDKIT=1
docker build --no-cache --memory=2g --memory-swap=4g -t agents-chat:latest .
```

## 📊 Comparação de Requisitos

| Aspecto             | Imagem Pré-construída | Build Local | Build Local + Swap |
| ------------------- | --------------------- | ----------- | ------------------ |
| **RAM Mínima**      | 1GB                   | 2GB         | 1GB                |
| **RAM Recomendada** | 2GB                   | 4GB         | 2GB                |
| **Tempo**           | 5-10 min              | 15-30 min   | 20-40 min          |
| **Seu Código**      | ❌ Não                | ✅ Sim      | ✅ Sim             |
| **Velocidade**      | ⚡ Muito rápido       | 🐌 Lento    | 🐌 Muito lento     |
| **Confiabilidade**  | ✅ Alta               | ⚠️ Média    | ⚠️ Baixa           |

## 🎯 Recomendação Final

### Para Produção com Modificações Personalizadas

1. **Use VM com 4GB+ RAM**
2. **Execute:** `./deploy-production.sh <dominio> <email>`

### Para Produção Rápida ou VMs Pequenas

1. **Execute:** `./diagnose.sh`
2. **Se necessário:** `sudo ./setup-swap.sh`
3. **Execute:** `./deploy-prebuilt.sh <dominio> <email>`

### Para Desenvolvimento/Teste

1. **Execute:** `./deploy-prebuilt.sh localhost`

## 🔍 Monitoramento Pós-Deploy

### Comandos Úteis

```bash
# Status dos serviços
cd /opt/agents-chat
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Verificar recursos
free -h
docker stats

# Backup
docker-compose exec db pg_dump -U postgres > backup.sql
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

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro de permissão Docker:**

   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Pouca memória:**

   ```bash
   sudo ./setup-swap.sh
   ```

3. **Build falha:**

   ```bash
   ./deploy-prebuilt.sh <dominio> <email>
   ```

4. **Serviços não iniciam:**
   ```bash
   cd /opt/agents-chat
   docker-compose logs
   docker-compose down && docker-compose up -d
   ```

## 📞 Suporte

- **Diagnóstico:** `./diagnose.sh`
- **Documentação:** `README.md`
- **Logs:** `docker-compose logs -f`
- **Sistema:** `sudo journalctl -u docker -f`

---

**🎉 Pronto para deploy em produção!**
