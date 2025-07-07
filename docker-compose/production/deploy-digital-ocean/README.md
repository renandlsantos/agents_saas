# 🚀 Agents Chat - Deploy Digital Ocean

Esta pasta contém todos os scripts e configurações necessárias para fazer o deploy do Agents Chat em produção na Digital Ocean.

## 📁 Estrutura dos Arquivos

```
docker-compose/production/deploy-digital-ocean/
├── deploy-production.sh      # Script principal de deploy completo
├── quick-deploy.sh           # Script de deploy rápido
├── update-deploy.sh          # Script para atualizar deploy
├── docker-compose-production.yml  # Configuração Docker otimizada
├── nginx-production.conf     # Configuração Nginx para produção
├── README-DEPLOY-PROD.md     # Documentação completa
├── DEPLOY-SUMMARY.md         # Resumo dos scripts
└── README.md                 # Este arquivo
```

## 🎯 Opções de Deploy

### 1. Deploy Completo (Primeira Vez)

```bash
# No servidor Ubuntu 22.04
chmod +x deploy-production.sh
./deploy-production.sh
```

**O que faz:**

- ✅ Instala Docker, Docker Compose, Nginx
- ✅ Configura firewall e segurança
- ✅ **Build personalizado do seu código**
- ✅ Configura SSL com Let's Encrypt
- ✅ Configura backup e monitoramento

### 2. Deploy Rápido (Servidor já configurado)

```bash
# No servidor com Docker já instalado
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**O que faz:**

- ✅ Configuração básica
- ✅ **Build personalizado opcional**
- ✅ Inicia serviços

### 3. Atualização (Com suas modificações)

```bash
# No servidor de produção
chmod +x update-deploy.sh
./update-deploy.sh
```

**O que faz:**

- ✅ Backup automático
- ✅ Atualiza código do repositório
- ✅ **Build da nova versão personalizada**
- ✅ Reinicia serviços

## 🔧 Build Personalizado vs Imagem Oficial

| Aspecto           | Build Personalizado | Imagem Oficial   |
| ----------------- | ------------------- | ---------------- |
| **Seu código**    | ✅ Incluído         | ❌ Não incluído  |
| **Customizações** | ✅ Funcionam        | ❌ Não funcionam |
| **Velocidade**    | ⚠️ Mais lento       | ✅ Mais rápido   |
| **Controle**      | ✅ Total            | ⚠️ Limitado      |

## 📋 Pré-requisitos

- Droplet Ubuntu 22.04 LTS na Digital Ocean
- Domínio configurado e apontando para o IP
- Acesso SSH ao servidor
- Conhecimento básico de Linux

## 🚀 Fluxo de Trabalho

### Desenvolvimento Local

```bash
# 1. Fazer suas modificações
git add .
git commit -m "Nova funcionalidade"
git push origin main
```

### Deploy em Produção

```bash
# 2. No servidor - Primeira vez
./deploy-production.sh
# Responder "y" para build personalizado

# 3. Atualizações futuras
./update-deploy.sh
# Responder "y" para build da nova versão
```

## 📊 Monitoramento

### Comandos Úteis

```bash
# Status dos serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Backup manual
./backup.sh

# Verificar recursos
docker stats
```

### Logs Importantes

- **Aplicação:** `/opt/agents-chat/logs/app/`
- **Nginx:** `/opt/agents-chat/logs/nginx/`
- **Monitoramento:** `/opt/agents-chat/monitor.log`
- **Backup:** `/opt/agents-chat/backup.log`

## 🔒 Segurança

- ✅ Firewall UFW configurado
- ✅ Fail2ban para proteção
- ✅ SSL/TLS com Let's Encrypt
- ✅ Headers de segurança no Nginx
- ✅ Rate limiting configurado

## 📈 Escalabilidade

### Para Alta Demanda

1. **Aumentar recursos:** 4GB RAM, 4 vCPUs mínimo
2. **Load balancer:** Digital Ocean Load Balancer
3. **Banco gerenciado:** Digital Ocean Managed Databases
4. **CDN:** Cloudflare para assets

## 🚨 Troubleshooting

### Problemas Comuns

1. **Build falha:**

   ```bash
   docker system prune -a
   df -h # Verificar espaço
   ```

2. **Serviços não iniciam:**

   ```bash
   docker-compose logs
   docker-compose down && docker-compose up -d
   ```

3. **SSL não funciona:**
   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

## 📞 Suporte

- **Documentação:** `README-DEPLOY-PROD.md`
- **Resumo:** `DEPLOY-SUMMARY.md`
- **Issues:** GitHub do projeto

## 🎉 Resultado

Após o deploy, você terá:

- ✅ **Seu código personalizado** funcionando em produção
- ✅ Ambiente seguro e otimizado
- ✅ Backup automático
- ✅ Monitoramento básico
- ✅ SSL/TLS ativo
- ✅ Fácil atualização

---

**🎯 Pronto para produção com suas modificações!**
