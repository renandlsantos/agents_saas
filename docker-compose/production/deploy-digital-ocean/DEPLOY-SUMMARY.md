# Resumo do Deploy - Agents Chat

## 🎯 Scripts Disponíveis

### 1. **`deploy-prod.sh`** - Deploy de Produção

- **Uso**: `./deploy-prod.sh <dominio> [email]`
- **Exemplo**: `./deploy-prod.sh meusite.com admin@meusite.com`
- **Características**:
  - ✅ Imagem pré-construída (rápido)
  - ✅ Nginx + SSL automático
  - ✅ Configurações de produção
  - ✅ Logs organizados
  - ✅ Reinicialização automática

### 2. **`deploy-dev.sh`** - Deploy de Desenvolvimento

- **Uso**: `./deploy-dev.sh [porta]`
- **Exemplo**: `./deploy-dev.sh 3210`
- **Características**:
  - ✅ Imagem pré-construída (rápido)
  - ✅ Configuração simplificada
  - ✅ Acesso direto via porta
  - ✅ Ideal para testes
  - ✅ Sem Nginx/SSL

## 🚀 Deploy Rápido

### Para Produção:

```bash
# Com domínio real
./deploy-prod.sh meusite.com admin@meusite.com

# Para testes locais
./deploy-prod.sh localhost
```

### Para Desenvolvimento:

```bash
# Porta padrão (3210)
./deploy-dev.sh

# Porta customizada
./deploy-dev.sh 3000
```

## 📁 Estrutura de Diretórios

### Produção: `/opt/agents-chat/`

### Desenvolvimento: `/opt/agents-chat-dev/`

## ⚡ Vantagens dos Scripts

1. **Totalmente Automatizados** - Zero configuração manual
2. **Rápidos** - Usam imagem pré-construída (2-5 minutos)
3. **Confiáveis** - Sem problemas de build local
4. **Flexíveis** - Produção ou desenvolvimento
5. **Seguros** - Configurações otimizadas

## 🔧 Pós-Deploy

1. **Configurar API Keys** no arquivo `.env`
2. **Reiniciar aplicação**: `docker-compose restart app`
3. **Verificar logs**: `docker-compose logs -f`

## 📊 Monitoramento

```bash
# Status dos serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Uso de recursos
docker stats
```

## 🆘 Troubleshooting

- **Permissões Docker**: `sudo usermod -aG docker $USER`
- **Porta ocupada**: `sudo netstat -tulpn | grep :3210`
- **Logs de erro**: `docker-compose logs app`
