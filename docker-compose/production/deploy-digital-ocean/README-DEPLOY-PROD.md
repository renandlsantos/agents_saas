# 🚀 Agents Chat - Deploy em Produção Digital Ocean

Este guia fornece instruções completas para fazer o deploy do Agents Chat em produção na Digital Ocean, incluindo configurações de segurança, monitoramento e backup automático.

## 📋 Pré-requisitos

- Droplet Ubuntu 22.04 LTS na Digital Ocean (mínimo 2GB RAM, 2 vCPUs)
- Domínio configurado e apontando para o IP do servidor
- Acesso SSH ao servidor
- Conhecimento básico de Linux e Docker

## 🎯 Arquitetura de Produção

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (SSL)   │    │   Agents Chat   │    │   PostgreSQL    │
│   Porta 80/443  │───▶│   Porta 3210    │───▶│   Porta 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     MinIO       │    │    Casdoor      │
                       │   Porta 9000    │    │   Porta 8000    │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Passo a Passo do Deploy

### 1. Preparação do Servidor

```bash
# Conectar ao servidor via SSH
ssh root@seu-ip-do-servidor

# Criar usuário não-root (recomendado)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 2. Executar Script de Deploy

```bash
# Baixar o script de deploy
wget https://raw.githubusercontent.com/seu-repo/agents_saas/main/deploy-production.sh

# Tornar executável
chmod +x deploy-production.sh

# Executar o script
./deploy-production.sh
```

O script irá:

- ✅ Atualizar o sistema
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar firewall (UFW) e Fail2ban
- ✅ Configurar Nginx como proxy reverso
- ✅ **Perguntar se você quer fazer build da sua versão personalizada**
- ✅ Configurar SSL com Let's Encrypt
- ✅ Configurar backup automático
- ✅ Configurar monitoramento básico

### 3. Opções de Build

Durante o deploy, você terá duas opções:

#### 3.1 Build Personalizado (Recomendado)

- ✅ Usa **seu código atualizado** do repositório
- ✅ Inclui suas modificações e customizações
- ✅ Build local da imagem Docker
- ✅ Controle total sobre a versão

#### 3.2 Imagem Oficial

- ✅ Usa a imagem oficial do Docker Hub
- ✅ Mais rápido para deploy
- ✅ Versão estável e testada
- ❌ Não inclui suas modificações

### 4. Configuração Manual Pós-Deploy

Após o deploy, você precisa configurar manualmente:

#### 4.1 Configurar API Keys

Edite o arquivo `.env` em `/opt/agents-chat/`:

```bash
cd /opt/agents-chat
nano .env
```

Configure suas API keys:

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Outras APIs conforme necessário
GOOGLE_API_KEY=your-google-key-here
AZURE_API_KEY=your-azure-key-here
```

#### 4.2 Configurar Domínio

Atualize o domínio no arquivo `.env`:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

#### 4.3 Configurar Email (Opcional)

Para notificações por email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### 5. Reiniciar Serviços

```bash
cd /opt/agents-chat
docker-compose down
docker-compose up -d
```

## 🔧 Configurações Avançadas

### Configuração de Proxy

Se você estiver atrás de um proxy corporativo:

```env
OPENAI_PROXY_URL=https://seu-proxy.com/v1
ANTHROPIC_PROXY_URL=https://seu-proxy.com/v1
```

### Configuração de Monitoramento

O script configura monitoramento básico que verifica:

- Status dos containers
- Uso de disco e memória
- Logs de erro

Para monitoramento avançado, considere:

- Prometheus + Grafana
- Sentry para logs de erro
- Uptime Robot para monitoramento externo

### Configuração de Backup

Backups automáticos são configurados para:

- Banco de dados PostgreSQL
- Arquivos do MinIO
- Configurações (.env)

Backups são mantidos por 7 dias e executados diariamente às 2h da manhã.

## 🔒 Segurança

### Firewall Configurado

O script configura UFW com as seguintes regras:

- SSH (porta 22)
- HTTP (porta 80)
- HTTPS (porta 443)
- Agents Chat (porta 3210)

### Fail2ban

Configurado para proteger contra:

- Tentativas de login SSH
- Ataques de força bruta
- Spam de requisições

### SSL/TLS

- Certificados Let's Encrypt automáticos
- Renovação automática
- Configurações de segurança SSL modernas

## 📊 Monitoramento e Logs

### Verificar Status dos Serviços

```bash
# Status dos containers
cd /opt/agents-chat
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f agents-chat
```

### Verificar Recursos do Sistema

```bash
# Uso de CPU e memória
htop

# Uso de disco
df -h

# Logs do sistema
sudo journalctl -f
```

### Logs de Monitoramento

```bash
# Logs do monitoramento
tail -f /opt/agents-chat/monitor.log

# Logs de backup
tail -f /opt/agents-chat/backup.log
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Containers não iniciam

```bash
# Verificar logs detalhados
docker-compose logs

# Verificar se as portas estão livres
sudo netstat -tulpn | grep :3210

# Reiniciar serviços
docker-compose restart
```

#### 2. Problemas de SSL

```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew

# Verificar configuração do Nginx
sudo nginx -t
```

#### 3. Problemas de Banco de Dados

```bash
# Conectar ao banco
docker exec -it agents-postgres psql -U postgres -d agents_chat_prod

# Verificar logs do PostgreSQL
docker-compose logs postgresql
```

#### 4. Problemas de S3/MinIO

```bash
# Acessar console do MinIO
# http://seu-ip:9001
# Usuário: admin
# Senha: (definida no .env)

# Verificar logs do MinIO
docker-compose logs minio
```

### Comandos Úteis

```bash
# Reiniciar todos os serviços
cd /opt/agents-chat && docker-compose restart

# Parar todos os serviços
cd /opt/agents-chat && docker-compose down

# Atualizar para nova versão
cd /opt/agents-chat && docker-compose pull && docker-compose up -d

# Backup manual
/opt/agents-chat/backup.sh

# Verificar uso de recursos
docker stats
```

## 📈 Escalabilidade

### Para Alta Demanda

1. **Aumentar recursos do servidor:**
   - Mínimo recomendado: 4GB RAM, 4 vCPUs
   - Para produção: 8GB RAM, 8 vCPUs

2. **Configurar load balancer:**
   - Usar Digital Ocean Load Balancer
   - Configurar múltiplas instâncias

3. **Otimizar banco de dados:**
   - Configurar PostgreSQL com mais recursos
   - Considerar banco gerenciado (Digital Ocean Managed Databases)

4. **Configurar CDN:**
   - Cloudflare para assets estáticos
   - Otimizar cache do Nginx

## 🔄 Atualizações

### Atualização com Build Personalizado

Para atualizar com suas modificações mais recentes:

```bash
# No servidor de produção
cd /opt/agents-chat

# Executar script de atualização
./update-deploy.sh
```

O script irá:

- ✅ Fazer backup automático antes da atualização
- ✅ Atualizar código do repositório
- ✅ Perguntar se quer fazer build da nova versão
- ✅ Build da nova imagem personalizada
- ✅ Reiniciar serviços com nova versão
- ✅ Verificar se tudo está funcionando

### Atualização Automática

O script de deploy configura atualização automática via crontab:

```bash
# Verificar atualizações disponíveis
cd /opt/agents-chat
docker-compose pull

# Aplicar atualizações
docker-compose up -d
```

### Atualização Manual

```bash
cd /opt/agents-chat

# Fazer backup antes da atualização
./backup.sh

# Atualizar imagens
docker-compose pull

# Reiniciar com novas imagens
docker-compose up -d

# Verificar se tudo está funcionando
docker-compose ps
```

### Workflow de Desenvolvimento

Para um workflow eficiente de desenvolvimento:

1. **Desenvolvimento Local:**

   ```bash
   # Fazer suas modificações
   git add .
   git commit -m "Nova funcionalidade"
   git push origin main
   ```

2. **Deploy em Produção:**

   ```bash
   # No servidor
   ./update-deploy.sh
   # Responder 'y' para build personalizado
   ```

3. **Verificação:**
   ```bash
   # Verificar se está funcionando
   docker-compose ps
   docker-compose logs -f
   ```

## 📞 Suporte

### Logs Importantes

- **Aplicação:** `/opt/agents-chat/logs/`
- **Nginx:** `/var/log/nginx/`
- **Sistema:** `/var/log/syslog`
- **Docker:** `docker-compose logs`

### Contatos

- **Documentação:** <https://lobehub.com/docs>
- **Issues:** <https://github.com/lobehub/lobe-chat/issues>
- **Discord:** <https://discord.gg/lobehub>

## 📝 Checklist de Deploy

- [ ] Servidor Ubuntu 22.04 configurado
- [ ] Domínio apontando para o IP do servidor
- [ ] Script de deploy executado com sucesso
- [ ] API keys configuradas no .env
- [ ] Domínio configurado no .env
- [ ] SSL configurado e funcionando
- [ ] Backup automático funcionando
- [ ] Monitoramento configurado
- [ ] Aplicação acessível via HTTPS
- [ ] Testes de funcionalidade realizados
- [ ] Documentação de acesso criada

## 🎉 Conclusão

Após seguir este guia, você terá um ambiente de produção completo do Agents Chat com:

- ✅ Segurança configurada
- ✅ SSL/TLS ativo
- ✅ Backup automático
- ✅ Monitoramento básico
- ✅ Alta disponibilidade
- ✅ Fácil manutenção

O sistema estará pronto para uso em produção com todas as melhores práticas implementadas.
