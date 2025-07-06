# Configuração do Banco de Dados e MinIO S3 - Agents SAAS

Este documento fornece um guia completo para configurar o banco de dados PostgreSQL e o MinIO S3 para o projeto Agents SAAS.

## Visão Geral

O Agents SAAS utiliza:
- **PostgreSQL** com extensão **PGVector** para armazenamento de dados e busca vetorial
- **MinIO S3** para armazenamento de arquivos e assets
- **Drizzle ORM** para migrações e gerenciamento do banco de dados

## Configuração do Banco de Dados

### Pré-requisitos

1. PostgreSQL 17+ com extensão PGVector
2. Node.js 18+ para execução das migrações
3. Variáveis de ambiente configuradas

### Variáveis de Ambiente - Banco de Dados

```env
# Configuração do PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_database
DATABASE_DRIVER=neon  # ou 'node' para PostgreSQL local

# Para ambiente de teste
DATABASE_TEST_URL=postgresql://usuario:senha@localhost:5432/nome_database_test

# Segurança - Chave para criptografia de dados sensíveis
KEY_VAULTS_SECRET=sua_chave_secreta_aqui_com_no_minimo_32_caracteres

# Configuração do serviço (server mode)
NEXT_PUBLIC_SERVICE_MODE=server
```

### Instalação e Configuração

#### 1. Configuração com Docker (Recomendado)

Use o docker-compose fornecido no projeto:

```bash
# Navegue para o diretório de configuração
cd docker-compose/local

# Copie e configure o arquivo .env
cp .env.example .env

# Edite as variáveis necessárias
nano .env
```

**Configurações importantes no .env:**

```env
# Configuração do PostgreSQL
LOBE_DB_NAME=agentssaas_db
POSTGRES_PASSWORD=sua_senha_muito_forte_aqui

# URLs e portas
LOBE_PORT=3210
APP_URL=http://localhost:3210
AUTH_URL=http://localhost:3210/api/auth
```

#### 2. Configuração Manual do PostgreSQL

```sql
-- Conecte ao PostgreSQL e crie o banco
CREATE DATABASE agentssaas_db;

-- Conecte ao banco criado
\c agentssaas_db;

-- Instale a extensão PGVector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verifique a instalação
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Execução das Migrações

#### Usando NPM Scripts

```bash
# Gerar migrações a partir do schema
npm run db:generate

# Aplicar migrações ao banco
npm run db:migrate

# Visualizar o banco (Drizzle Studio)
npm run db:studio

# Push direto das mudanças (desenvolvimento)
npm run db:push
```

#### Estrutura de Migrações

As migrações estão localizadas em:
- `src/database/migrations/` - Arquivos SQL de migração
- `src/database/schemas/` - Schemas do Drizzle ORM
- `scripts/migrateServerDB/` - Scripts de migração

#### Exemplo de Migração Manual

```bash
# Definir variável de ambiente para migração
export MIGRATION_DB=1

# Executar script de migração
tsx ./scripts/migrateServerDB/index.ts
```

### Verificação do Banco

```bash
# Verificar status de conectividade
npm run db:studio

# Ou teste direto via PostgreSQL
psql -h localhost -p 5432 -U postgres -d agentssaas_db -c "SELECT version();"
```

## Configuração do MinIO S3

### Variáveis de Ambiente - MinIO S3

```env
# MinIO S3 - Configuração básica
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=sua_senha_minio_muito_forte_aqui
MINIO_PORT=9000

# Configuração do bucket
MINIO_LOBE_BUCKET=agentssaas-files
S3_BUCKET=agentssaas-files

# URLs e endpoints
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_DOMAIN=http://localhost:9000

# Configurações de acesso
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=sua_senha_minio_muito_forte_aqui
S3_REGION=us-east-1

# Configurações específicas do MinIO
S3_ENABLE_PATH_STYLE=1
S3_SET_ACL=0
S3_PREVIEW_URL_EXPIRE_IN=7200

# Configuração de upload de arquivos
NEXT_PUBLIC_S3_FILE_PATH=files
```

### Instalação e Configuração

#### 1. Usando Docker (Recomendado)

O docker-compose já inclui o MinIO configurado:

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar logs do MinIO
docker-compose logs minio

# Acessar console do MinIO
# URL: http://localhost:9001
# Usuário: admin
# Senha: definida em MINIO_ROOT_PASSWORD
```

#### 2. Configuração Manual do MinIO

```bash
# Download e instalação do MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# Criar diretório de dados
mkdir -p ~/minio/data

# Iniciar MinIO
export MINIO_ROOT_USER=admin
export MINIO_ROOT_PASSWORD=sua_senha_minio_muito_forte_aqui
./minio server ~/minio/data --console-address ":9001"
```

### Configuração do Bucket

#### Via Console Web (http://localhost:9001)

1. Acesse o console do MinIO
2. Faça login com as credenciais definidas
3. Crie um bucket chamado `agentssaas-files`
4. Configure as políticas de acesso necessárias

#### Via MinIO Client (MC)

```bash
# Configurar alias para MinIO local
mc alias set local http://localhost:9000 admin sua_senha_minio_muito_forte_aqui

# Criar bucket
mc mb local/agentssaas-files

# Definir política pública para leitura (opcional)
mc policy set public local/agentssaas-files

# Verificar configuração
mc ls local/
```

### Verificação do MinIO

```bash
# Testar conectividade
curl http://localhost:9000/minio/health/live

# Verificar bucket
curl http://localhost:9000/agentssaas-files/

# Teste de upload (via aplicação)
# A aplicação deve conseguir fazer upload de arquivos
```

## Configuração Completa - Exemplo de .env

```env
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================
DATABASE_URL=postgresql://postgres:sua_senha_postgres@localhost:5432/agentssaas_db
DATABASE_DRIVER=node
KEY_VAULTS_SECRET=sua_chave_secreta_com_no_minimo_32_caracteres_aqui

# ============================================
# CONFIGURAÇÃO DO MINIO S3
# ============================================
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=sua_senha_minio_muito_forte_aqui
MINIO_PORT=9000
MINIO_LOBE_BUCKET=agentssaas-files

S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_DOMAIN=http://localhost:9000
S3_BUCKET=agentssaas-files
S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=sua_senha_minio_muito_forte_aqui
S3_REGION=us-east-1
S3_ENABLE_PATH_STYLE=1
S3_SET_ACL=0
S3_PREVIEW_URL_EXPIRE_IN=7200

# ============================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================
NEXT_PUBLIC_SERVICE_MODE=server
LOBE_PORT=3210
APP_URL=http://localhost:3210
AUTH_URL=http://localhost:3210/api/auth

# ============================================
# CONFIGURAÇÃO DE AUTENTICAÇÃO (CASDOOR)
# ============================================
CASDOOR_PORT=8000
AUTH_CASDOOR_ISSUER=http://localhost:8000
AUTH_CASDOOR_ID=seu_casdoor_client_id
AUTH_CASDOOR_SECRET=seu_casdoor_client_secret
NEXT_AUTH_SSO_PROVIDERS=casdoor
NEXT_AUTH_SECRET=sua_chave_nextauth_secreta
```

## Comandos de Administração

### Backup do Banco de Dados

```bash
# Backup completo
pg_dump -h localhost -p 5432 -U postgres agentssaas_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup com compressão
pg_dump -h localhost -p 5432 -U postgres agentssaas_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restauração do Banco

```bash
# Restaurar backup
psql -h localhost -p 5432 -U postgres agentssaas_db < backup_20240101_120000.sql

# Restaurar backup comprimido
gunzip -c backup_20240101_120000.sql.gz | psql -h localhost -p 5432 -U postgres agentssaas_db
```

### Backup do MinIO

```bash
# Backup via MinIO Client
mc mirror local/agentssaas-files/ ./backup-minio/

# Backup via rsync (se usando instalação local)
rsync -av ~/minio/data/ ./backup-minio-$(date +%Y%m%d_%H%M%S)/
```

## Monitoramento e Logs

### Verificação de Saúde

```bash
# Status do PostgreSQL
pg_isready -h localhost -p 5432

# Status do MinIO
curl http://localhost:9000/minio/health/live

# Logs da aplicação
tail -f /var/log/agentssaas/app.log
```

### Monitoramento de Performance

```bash
# Verificar conexões ativas no PostgreSQL
psql -h localhost -p 5432 -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar uso de disco do MinIO
du -sh ~/minio/data/

# Verificar métricas do MinIO
curl http://localhost:9000/minio/prometheus/metrics
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com PostgreSQL**
   - Verificar se o serviço está rodando
   - Verificar credenciais no .env
   - Verificar se a extensão PGVector está instalada

2. **Erro de migração**
   - Verificar se DATABASE_URL está correto
   - Executar migrações manualmente
   - Verificar logs de erro

3. **Erro de conexão com MinIO**
   - Verificar se o serviço está rodando
   - Verificar credenciais S3
   - Verificar se o bucket existe

4. **Erro de upload de arquivos**
   - Verificar políticas do bucket
   - Verificar configurações de CORS
   - Verificar logs do MinIO

### Comandos de Debug

```bash
# Debug do banco
npm run db:studio

# Debug do MinIO
mc admin info local/

# Debug da aplicação
npm run dev

# Logs detalhados
DEBUG=* npm run dev
```

## Segurança

### Recomendações de Segurança

1. **Senhas Fortes**: Use senhas com pelo menos 32 caracteres
2. **Backup Regular**: Configure backups automáticos
3. **Firewall**: Restrinja acesso às portas do banco e MinIO
4. **SSL/TLS**: Use HTTPS em produção
5. **Logs**: Monitore logs de acesso e erro

### Configuração de Produção

```env
# Use valores únicos e seguros para produção
DATABASE_URL=postgresql://usuario:senha_super_forte@host:5432/db_producao
KEY_VAULTS_SECRET=chave_unica_producao_com_64_caracteres_ou_mais_para_seguranca
MINIO_ROOT_PASSWORD=senha_minio_producao_muito_forte_e_unica
NEXT_AUTH_SECRET=chave_nextauth_producao_unica_e_secreta
```

---

Este documento cobre a configuração completa do banco de dados e MinIO S3 para o projeto Agents SAAS. Para questões específicas, consulte os logs da aplicação ou a documentação técnica do projeto.