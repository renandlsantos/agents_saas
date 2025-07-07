# Configuração do Casdoor para Autenticação

## 1. Acessar o Casdoor

Acesse: <http://161.35.227.30:8000>

Login padrão:

- Username: `admin`
- Password: `123`

## 2. Criar uma Nova Aplicação

1. Vá em **Applications** → **Add**

2. Configure:
   - **Name**: `lobe-chat`
   - **Display name**: `Lobe Chat`
   - **Logo**: (opcional)
   - **Home page**: `http://161.35.227.30:3210`
   - **Callback URL**: `http://161.35.227.30:3210/api/auth/callback/casdoor`
   - **Organization**: `built-in`

3. Em **Grant types**, selecione:
   - `authorization_code`
   - `refresh_token`

4. Clique em **Save**

## 3. Obter as Credenciais

Após salvar, você verá:

- **Client ID**: Copie este valor
- **Client secret**: Clique em **Show** e copie

## 4. Obter o Certificado

1. Vá em **Certs**
2. Encontre o certificado da organização `built-in`
3. Clique em **Edit**
4. Copie todo o conteúdo do certificado (incluindo BEGIN/END)

## 5. Atualizar o .env

No seu arquivo `/opt/agents-chat/.env`, adicione/atualize:

```env
# Credenciais do Casdoor (use os valores que você copiou)
AUTH_CASDOOR_ID=seu-client-id-aqui
AUTH_CASDOOR_SECRET=seu-client-secret-aqui
AUTH_CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----
MIIEowIBAAKCAQEA...cole-seu-certificado-completo-aqui
-----END CERTIFICATE-----
```

## 6. Configurar Usuários no Casdoor

1. Vá em **Users** → **Add**
2. Crie usuários com:
   - Username
   - Display name
   - Email
   - Password
   - Organization: `built-in`

## 7. Testar a Autenticação

1. Reinicie o Lobe Chat:

   ```bash
   cd /opt/agents-chat
   docker-compose down
   docker-compose up -d
   ```

2. Acesse: <http://161.35.227.30:3210>

3. Clique em "Login"

4. Você será redirecionado para o Casdoor

5. Faça login com um dos usuários criados

6. Será redirecionado de volta ao Lobe Chat autenticado!

## Troubleshooting

Se o login não funcionar:

1. **Verifique os logs**:

   ```bash
   docker logs lobe-chat
   docker logs casdoor
   ```

2. **Confirme as URLs**:
   - O Casdoor deve estar acessível em `http://161.35.227.30:8000`
   - O Lobe Chat deve estar em `http://161.35.227.30:3210`

3. **Teste a conectividade entre containers**:

   ```bash
   docker exec lobe-chat ping casdoor
   ```

4. **Verifique o certificado**:
   - Certifique-se de copiar TODO o certificado
   - Inclua as linhas BEGIN e END
   - Não deve haver espaços extras
