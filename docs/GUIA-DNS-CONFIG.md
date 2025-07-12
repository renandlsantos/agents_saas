# Guia de Configuração DNS - app.ai4learning.com.br

## 🚨 Problema Identificado

O DNS do domínio `app.ai4learning.com.br` está apontando para o IP incorreto:

- **IP Atual:** 161.35.227.30 ❌
- **IP Correto:** 64.23.166.36 ✅

## 📋 O que você precisa fazer

### 1. Acessar seu Provedor de Domínio

Acesse o painel de controle onde você registrou o domínio `ai4learning.com.br`. Pode ser:

- Registro.br
- GoDaddy
- Cloudflare
- HostGator
- UOL Host
- Ou outro provedor

### 2. Configurar o Registro DNS

No painel de DNS/Zona DNS, você precisa criar ou editar um registro tipo A:

```
Tipo: A
Nome/Host: app
Valor/IP: 64.23.166.36
TTL: 3600 (ou 1 hora)
```

### 3. Exemplos por Provedor

#### Registro.br

1. Acesse sua conta no Registro.br
2. Vá em "Domínios" → Selecione `ai4learning.com.br`
3. Clique em "Editar DNS"
4. Adicione um novo registro:
   - Tipo: A
   - Nome: app
   - Dados: 64.23.166.36

#### Cloudflare

1. Login no Cloudflare
2. Selecione o domínio `ai4learning.com.br`
3. Vá em "DNS"
4. Clique em "Add record"
5. Configure:
   - Type: A
   - Name: app
   - IPv4 address: 64.23.166.36
   - Proxy status: DNS only (nuvem cinza)

#### GoDaddy

1. Faça login na GoDaddy
2. Vá em "Meus Produtos" → DNS
3. Encontre `ai4learning.com.br` e clique em "Gerenciar"
4. Adicione registro:
   - Tipo: A
   - Host: app
   - Pontos para: 64.23.166.36
   - TTL: 1 hora

### 4. Verificar a Propagação

Após configurar, aguarde de 5 a 30 minutos para a propagação do DNS. Você pode verificar usando:

```bash
# No terminal
dig app.ai4learning.com.br

# Ou online
https://www.whatsmydns.net/#A/app.ai4learning.com.br
```

### 5. Executar o Script Novamente

Depois que o DNS estiver propagado e apontando para 64.23.166.36, execute:

```bash
./fix-dns-setup.sh
```

O script vai:

- Verificar se o DNS está correto ✅
- Configurar o servidor automaticamente
- Instalar certificado SSL
- Configurar Nginx
- Reiniciar a aplicação

## ⚠️ Importante

- **Não delete** registros DNS existentes sem ter certeza
- Se você usa **Cloudflare**, certifique-se de que o proxy está **desativado** (nuvem cinza)
- O TTL baixo (3600 segundos = 1 hora) permite correções mais rápidas se necessário

## 🆘 Precisa de Ajuda?

Se não souber qual é seu provedor de DNS:

1. Acesse <https://registro.br/tecnologia/ferramentas/whois/>
2. Digite: ai4learning.com.br
3. Procure por "Servidor DNS" para identificar onde está hospedado

## 📱 Contatos de Suporte dos Principais Provedores

- **Registro.br**: <https://registro.br/ajuda/>
- **Cloudflare**: <https://support.cloudflare.com/>
- **GoDaddy**: 0800 891 5372
- **HostGator**: 0800 878 3100
