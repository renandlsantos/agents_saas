# Como Obter o Certificado do Casdoor

O certificado **NÃO É GERADO** por você - ele já existe no Casdoor e você precisa copiá-lo.

## 📋 Passos para Obter o Certificado:

### 1. Acesse o Painel do Casdoor

```
http://161.35.227.30:8000
```

Login padrão:

- Username: `admin`
- Password: `123`

### 2. Navegue até os Certificados

1. No menu lateral, clique em **Certs** (Certificados)
2. Você verá uma lista de certificados

### 3. Encontre o Certificado Correto

Procure pelo certificado com estas características:

- **Name**: `cert-built-in` (geralmente)
- **Organization**: `built-in`
- **Type**: `x509`

### 4. Copie o Certificado

1. Clique no botão **Edit** (📝) do certificado
2. Você verá um campo grande com o certificado
3. **COPIE TODO O CONTEÚDO**, incluindo:
   - `-----BEGIN CERTIFICATE-----`
   - Todo o conteúdo do meio (várias linhas de caracteres)
   - `-----END CERTIFICATE-----`

### 5. Formato Correto no .env

⚠️ **IMPORTANTE**: O certificado deve ser colocado em uma única linha no .env!

```env
AUTH_CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----\nMIIEowIBAAKCAQEA...(todo o conteúdo)...XYZ\n-----END CERTIFICATE-----
```

Ou use aspas para múltiplas linhas:

```env
AUTH_CASDOOR_CERTIFICATE="-----BEGIN CERTIFICATE-----
MIIEowIBAAKCAQEA...
...(várias linhas)...
...XYZ
-----END CERTIFICATE-----"
```

## 🔍 Alternativa: Via API do Casdoor

Se preferir, pode obter via comando:

```bash
# Obter o certificado via API
curl -s http://161.35.227.30:8000/api/get-certs | jq -r '.data[] | select(.name=="cert-built-in") | .certificate'
```

## 🐳 Ou Direto do Container

Se tiver acesso ao container do Casdoor:

```bash
# Entrar no container
docker exec -it casdoor bash

# Ver certificados
cat /etc/casdoor/certs/cert-built-in.pem
```

## ❌ Erros Comuns

1. **Copiar certificado incompleto** - sempre copie BEGIN e END
2. **Espaços extras** - não adicione espaços antes/depois
3. **Quebras de linha** - no .env, use \n ou aspas para múltiplas linhas
4. **Certificado errado** - certifique-se que é da organização `built-in`

## 🧪 Testar se Está Correto

Após configurar, você pode testar:

```bash
# No servidor
echo $AUTH_CASDOOR_CERTIFICATE | openssl x509 -noout -text
```

Se mostrar informações do certificado, está correto!

## 📝 Exemplo de Certificado (NÃO USE ESTE!)

```
-----BEGIN CERTIFICATE-----
MIIDkzCCAnugAwIBAgIUFwqVYcTwR8rRdaGGFCLLqzarS+0wDQYJKoZIhvcNAQEL
BQAwWTELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkNBMRYwFAYDVQQHDA1TYW4gRnJh
bmNpc2NvMRAwDgYDVQQKDAdDYXNkb29yMRMwEQYDVQQDDApjYXNkb29yLmlvMB4X
...
-----END CERTIFICATE-----
```

⚠️ **NUNCA** use exemplos - sempre copie o certificado real do seu Casdoor!
