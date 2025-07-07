# 🚀 Agents Chat - Resumo dos Scripts de Deploy

## 📁 Arquivos Criados

### 1. `deploy-production.sh` - Script Principal de Deploy

**Função:** Deploy completo do zero em produção

- ✅ Instalação completa do ambiente
- ✅ Configuração de segurança
- ✅ **Build personalizado do seu código**
- ✅ Configuração de SSL
- ✅ Backup e monitoramento

**Uso:**

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### 2. `quick-deploy.sh` - Deploy Rápido

**Função:** Deploy rápido em servidor já configurado

- ✅ Para servidores com Docker já instalado
- ✅ **Build personalizado opcional**
- ✅ Configuração básica

**Uso:**

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### 3. `update-deploy.sh` - Atualização de Deploy

**Função:** Atualizar deploy com novas versões

- ✅ Backup automático antes da atualização
- ✅ Atualização do código do repositório
- ✅ **Build da nova versão personalizada**
- ✅ Reinicialização dos serviços

**Uso:**

```bash
chmod +x update-deploy.sh
./update-deploy.sh
```

### 4. `docker-compose-production.yml` - Configuração Docker

**Função:** Configuração otimizada para produção

- ✅ PostgreSQL com pgvector
- ✅ MinIO para armazenamento
- ✅ Casdoor para autenticação
- ✅ **Imagem personalizada configurável**
- ✅ Redis para cache (opcional)
- ✅ Nginx como proxy reverso

### 5. `nginx-production.conf` - Configuração Nginx

**Função:** Proxy reverso otimizado

- ✅ SSL/TLS configurado
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ Cache para assets estáticos
- ✅ WebSocket support

### 6. `README-DEPLOY-PROD.md` - Documentação Completa

**Função:** Guia detalhado de deploy

- ✅ Passo a passo completo
- ✅ Configurações avançadas
- ✅ Troubleshooting
- ✅ Workflow de desenvolvimento

## 🎯 Fluxo de Deploy com Build Personalizado

### Primeira Vez (Deploy Completo)

```bash
# 1. No servidor
./deploy-production.sh

# 2. Responder perguntas:
# - "Deseja fazer build da sua versão personalizada?" → y
# - "Deseja configurar SSL?" → y
# - Digite seu domínio

# 3. Configurar API keys no .env
nano /opt/agents-chat/.env

# 4. Reiniciar serviços
cd /opt/agents-chat
docker-compose restart
```

### Atualizações (Com Suas Modificações)

```bash
# 1. Desenvolvimento local
git add .
git commit -m "Nova funcionalidade"
git push origin main

# 2. No servidor de produção
./update-deploy.sh

# 3. Responder "y" para build personalizado
```

## 🔧 Configurações Importantes

### Build Personalizado vs Imagem Oficial

| Aspecto           | Build Personalizado      | Imagem Oficial   |
| ----------------- | ------------------------ | ---------------- |
| **Seu código**    | ✅ Incluído              | ❌ Não incluído  |
| **Customizações** | ✅ Funcionam             | ❌ Não funcionam |
| **Velocidade**    | ⚠️ Mais lento            | ✅ Mais rápido   |
| **Controle**      | ✅ Total                 | ⚠️ Limitado      |
| **Estabilidade**  | ⚠️ Depende do seu código | ✅ Testada       |

### Variáveis de Ambiente Importantes

```env
# Configuração da Imagem
CUSTOM_IMAGE_NAME=agents-chat-custom:latest
USE_CUSTOM_BUILD=true

# API Keys (CONFIGURE!)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Domínio (CONFIGURE!)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

## 📊 Monitoramento e Logs

### Comandos Úteis

```bash
# Status dos serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f agents-chat

# Uso de recursos
docker stats

# Backup manual
./backup.sh
```

### Logs Importantes

- **Aplicação:** `/opt/agents-chat/logs/app/`
- **Nginx:** `/opt/agents-chat/logs/nginx/`
- **Casdoor:** `/opt/agents-chat/logs/casdoor/`
- **Monitoramento:** `/opt/agents-chat/monitor.log`
- **Backup:** `/opt/agents-chat/backup.log`

## 🚨 Troubleshooting

### Problemas Comuns

1. **Build falha:**

   ```bash
   # Verificar Docker
   docker --version
   
   # Verificar espaço em disco
   df -h
   
   # Limpar cache Docker
   docker system prune -a
   ```

2. **Serviços não iniciam:**

   ```bash
   # Verificar logs
   docker-compose logs
   
   # Verificar configuração
   docker-compose config
   
   # Reiniciar tudo
   docker-compose down && docker-compose up -d
   ```

3. **SSL não funciona:**

   ```bash
   # Verificar certificados
   sudo certbot certificates
   
   # Renovar manualmente
   sudo certbot renew
   ```

## 🎉 Benefícios do Build Personalizado

### ✅ Vantagens

- **Seu código atualizado** sempre em produção
- **Customizações funcionando** corretamente
- **Controle total** sobre a versão
- **Testes locais** refletem produção
- **Deploy consistente** com desenvolvimento

### ⚠️ Considerações

- **Tempo de build** maior
- **Espaço em disco** necessário
- **Dependência** do seu código estar estável
- **Responsabilidade** de manter funcionando

## 📞 Suporte

### Recursos

- **Documentação:** `README-DEPLOY-PROD.md`
- **Scripts:** Todos os arquivos `.sh`
- **Configurações:** `docker-compose-production.yml`
- **Logs:** Diretório `/opt/agents-chat/logs/`

### Comandos de Emergência

```bash
# Parar tudo
docker-compose down

# Voltar para imagem oficial
sed -i 's/CUSTOM_IMAGE_NAME=.*/CUSTOM_IMAGE_NAME=lobehub\/lobe-chat-database:latest/' .env
docker-compose up -d

# Restaurar backup
./backup.sh
```

---

**🎯 Resultado Final:** Deploy completo do Agents Chat com **seu código personalizado** funcionando em produção com todas as melhores práticas de segurança, monitoramento e backup implementadas.
