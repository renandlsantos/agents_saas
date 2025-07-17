# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Installation

```bash
pnpm install # Install dependencies
```

### Development

```bash
pnpm dev         # Start development server (port 3010)
pnpm dev:desktop # Start desktop development server (port 3015)
```

### Build and Production

```bash
pnpm build          # Build the application
pnpm build:analyze  # Build with bundle analysis
pnpm build:docker   # Build for Docker
pnpm build:electron # Build for Electron desktop app
pnpm start          # Start production server (port 3210)
```

### Testing

```bash
pnpm test                 # Run all tests (app + server)
pnpm test-app             # Run client-side tests
pnpm test-server          # Run server-side tests
pnpm test:update          # Update test snapshots
pnpm test-app:coverage    # Run app tests with coverage
pnpm test-server:coverage # Run server tests with coverage
```

### Code Quality

```bash
pnpm lint          # Run all linting (TypeScript, style, type-check, circular deps)
pnpm lint:ts       # Lint TypeScript files with ESLint
pnpm lint:style    # Lint styles with stylelint
pnpm type-check    # TypeScript type checking with tsgo
pnpm lint:circular # Check for circular dependencies
pnpm prettier      # Format all files with Prettier
```

### Database

```bash
pnpm db:generate # Generate database schema and client
pnpm db:migrate  # Run database migrations
pnpm db:push     # Push schema to database
pnpm db:studio   # Open Drizzle Studio (database GUI)
```

### Internationalization

```bash
pnpm i18n # Generate internationalization files
```

## Project Architecture

### High-Level Structure

This is **Lobe Chat**, a modern AI chatbot framework built with Next.js 15, supporting multiple AI providers, plugins, and both local/remote databases.

### Key Technologies

- **Frontend**: Next.js 15 with React 19, Ant Design, Zustand state management
- **Backend**: tRPC for type-safe APIs, Drizzle ORM for database
- **Database**: PostgreSQL (server) or PGLite (client-side)
- **AI Integration**: Multiple providers via unified runtime interface
- **Testing**: Vitest for unit tests, separate client/server test configs
- **Deployment**: Vercel, Docker, or self-hosted options

### Core Directory Structure

#### `/src/app` - Next.js App Router

- `(backend)/` - Server-side API routes and middleware
- `[variants]/` - Main application layouts with parallel routes
- App-level configuration (manifest, sitemap, robots)

#### `/src/store` - Zustand State Management

- Modular stores for different features (agent, chat, session, user, etc.)
- Type-safe selectors and actions
- Middleware for devtools integration

#### `/src/services` - Business Logic Layer

- Client/server service implementations
- Unified API interfaces for different features
- Separation between client-side and server-side logic

#### `/src/database` - Database Layer

- Drizzle ORM schemas and models
- Migration files and database utilities
- Client-side (PGLite) and server-side (PostgreSQL) implementations

#### `/src/features` - React Components and UI Features

- Modular feature components (AgentSetting, ChatInput, etc.)
- Reusable UI components and hooks

#### `/src/libs` - External Integrations

- Model runtime abstractions for AI providers
- Authentication integrations (NextAuth, Clerk)
- External service wrappers (MCP, traces, etc.)

### Key Architectural Patterns

#### AI Provider Integration

The system uses a unified `ModelRuntime` interface to support 40+ AI providers (OpenAI, Anthropic, Google, etc.). Each provider is configured in `/src/config/modelProviders/`.

#### Database Abstraction

Supports both local (PGLite in browser) and remote (PostgreSQL) databases through a unified interface. Schemas are defined in `/src/database/schemas/`.

#### Plugin System

Extensible plugin architecture for function calling and custom tools. Plugins are managed through the `/src/tools/` directory.

#### Internationalization

Full i18n support with 20+ languages. Locale files are in `/locales/` and generated through automated workflows.

#### State Management

Uses Zustand with a modular approach. Each feature has its own store with selectors for derived state.

### Development Workflow

1. **Local Development**: Use `pnpm dev` to start the development server
2. **Database Setup**: Run `pnpm db:migrate` to set up the database schema
3. **Testing**: Both client and server tests are separated (`test-app` vs `test-server`)
4. **Type Safety**: The project uses strict TypeScript with `tsgo` for validation
5. **Code Quality**: Comprehensive linting setup with ESLint, stylelint, and Prettier

### Important Notes

- The project uses pnpm workspaces with packages in `/packages/`
- Desktop app support via Electron (build with `pnpm build:electron`)
- Docker deployment support with optimized builds
- Extensive testing infrastructure with Vitest and coverage reporting
- Automated workflows for i18n, documentation, and releases

---

## Best Practices & Development Guidelines | Boas Práticas e Diretrizes de Desenvolvimento

### 🏗️ Backend Architecture | Arquitetura Backend

**EN**: The project follows a layered architecture with clear separation of concerns:

**PT-BR**: O projeto segue uma arquitetura em camadas com clara separação de responsabilidades:

#### Data Flow | Fluxo de Dados

**Browser/PWA Mode:**

```
UI (React) → Zustand action → Client Service → Model Layer → PGLite (local DB)
```

**Server Mode:**

```
UI (React) → Zustand action → Client Service → tRPC Client → tRPC Routers → Repositories/Models → Remote PostgreSQL
```

**Electron Desktop Mode:**

```
UI (Renderer) → Zustand action → Client Service → tRPC Client → Local Node.js Service → tRPC Routers → Repositories/Models → PGLite/Remote PostgreSQL
```

#### Key Layers | Camadas Principais

**EN**:

- **Client Services** (`/src/services`): Business logic with environment adaptation (local vs remote)
- **tRPC API Layer** (`/src/server/routers`): Type-safe API endpoints organized by runtime environment
- **Repository Layer** (`/src/database/repositories`): Complex cross-table queries and data aggregation
- **Model Layer** (`/src/database/models`): Basic CRUD operations for individual tables
- **Database Layer**: PGLite (client-side) or PostgreSQL (server-side)

**PT-BR**:

- **Serviços Cliente** (`/src/services`): Lógica de negócio com adaptação de ambiente (local vs remoto)
- **Camada API tRPC** (`/src/server/routers`): Endpoints de API type-safe organizados por ambiente de execução
- **Camada Repository** (`/src/database/repositories`): Consultas complexas entre tabelas e agregação de dados
- **Camada Model** (`/src/database/models`): Operações CRUD básicas para tabelas individuais
- **Camada Database**: PGLite (client-side) ou PostgreSQL (server-side)

### 🧪 Testing Guidelines | Diretrizes de Teste

#### Test Environments | Ambientes de Teste

**EN**: The project uses two separate test configurations:

- **Client tests** (`vitest.config.ts`): Happy DOM environment, PGLite database
- **Server tests** (`vitest.config.server.ts`): Node.js environment, real PostgreSQL

**PT-BR**: O projeto usa duas configurações de teste separadas:

- **Testes cliente** (`vitest.config.ts`): Ambiente Happy DOM, banco PGLite
- **Testes servidor** (`vitest.config.server.ts`): Ambiente Node.js, PostgreSQL real

#### Running Tests | Executando Testes

```bash
# Correct way | Forma correta
npx vitest run --config vitest.config.ts        # Client tests
npx vitest run --config vitest.config.server.ts # Server tests
npx vitest run --config vitest.config.ts filename.test.ts -t "specific test"

# Avoid | Evitar
pnpm test some-file      # ❌ Invalid command
vitest test-file.test.ts # ❌ Enters watch mode
```

#### Security Testing (Database Models) | Testes de Segurança (Models de Banco)

**EN**: **All database model operations MUST include user permission checks:**

**PT-BR**: **Todas as operações de model de banco DEVEM incluir verificações de permissão do usuário:**

```typescript
// ✅ Secure implementation | Implementação segura
update = async (id: string, data: Partial<MyModel>) => {
  return this.db
    .update(myTable)
    .set(data)
    .where(
      and(
        eq(myTable.id, id),
        eq(myTable.userId, this.userId), // ✅ User permission check
      ),
    )
    .returning();
};

// ❌ Security vulnerability | Vulnerabilidade de segurança
update = async (id: string, data: Partial<MyModel>) => {
  return this.db
    .update(myTable)
    .set(data)
    .where(eq(myTable.id, id)) // ❌ Missing user check
    .returning();
};
```

### 🎨 Component Development | Desenvolvimento de Componentes

#### Technology Stack | Stack Tecnológico

**EN**:

- **Styling**: antd-style for complex styles, inline styles for simple cases
- **Layout**: react-layout-kit's Flexbox and Center components
- **Component Priority**: src/components → installed packages → @lobehub/ui → antd

**PT-BR**:

- **Estilização**: antd-style para estilos complexos, estilos inline para casos simples
- **Layout**: componentes Flexbox e Center do react-layout-kit
- **Prioridade de Componentes**: src/components → pacotes instalados → @lobehub/ui → antd

#### Theme System Usage | Uso do Sistema de Tema

```tsx
// Using useTheme hook | Usando hook useTheme
import { useTheme } from 'antd-style';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <div
      style={{
        color: theme.colorPrimary,
        backgroundColor: theme.colorBgContainer,
        padding: theme.padding,
        borderRadius: theme.borderRadius,
      }}
    >
      Themed component | Componente com tema
    </div>
  );
};

// Using createStyles | Usando createStyles
const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background-color: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
  `,
}));
```

### 🔧 TypeScript Best Practices | Melhores Práticas TypeScript

**EN**:

- Avoid explicit type annotations when TypeScript can infer types
- Use the most accurate type possible (`Record<PropertyKey, unknown>` vs `object`)
- Prefer `interface` over `type` for React component props
- Use `as const satisfies XyzInterface` instead of plain `as const`
- Import index.ts modules like `@/db/index` instead of `@/db`

**PT-BR**:

- Evite anotações de tipo explícitas quando TypeScript pode inferir tipos
- Use o tipo mais preciso possível (`Record<PropertyKey, unknown>` vs `object`)
- Prefira `interface` em vez de `type` para props de componentes React
- Use `as const satisfies XyzInterface` em vez de `as const` simples
- Importe módulos index.ts como `@/db/index` em vez de `@/db`

### 🗃️ Database Model Guidelines | Diretrizes de Models de Banco

**EN**: When creating new database models:

1. **Reference template**: Use `src/database/models/_template.ts` as starting point
2. **User isolation**: ALWAYS implement user permission checks in operations
3. **Type safety**: Use schema-exported types (`NewXxx`, `XxxItem`)
4. **Foreign keys**: Handle constraints properly (use `null` or create referenced records)
5. **Dual environment testing**: Test in both PGLite and PostgreSQL environments

**PT-BR**: Ao criar novos models de banco:

1. **Referência template**: Use `src/database/models/_template.ts` como ponto de partida
2. **Isolamento de usuário**: SEMPRE implemente verificações de permissão do usuário nas operações
3. **Type safety**: Use tipos exportados do schema (`NewXxx`, `XxxItem`)
4. **Chaves estrangeiras**: Trate constraints adequadamente (use `null` ou crie registros referenciados)
5. **Teste ambiente duplo**: Teste nos ambientes PGLite e PostgreSQL

### 💰 Billing System | Sistema de Cobrança

**EN**: The project includes a comprehensive billing system for token usage control:

**PT-BR**: O projeto inclui um sistema completo de cobrança para controle de uso de tokens:

#### Key Components | Componentes Principais

- **Database Schema** (`/src/database/schemas/billing.ts`): Complete billing tables with TypeScript types
- **Model Layer** (`/src/database/models/billing.ts`): CRUD operations for billing entities
- **Service Layer** (`/src/services/billing.ts`): Business logic for subscriptions, usage tracking, and quota management
- **Middleware** (`/src/middleware/quota.ts`): Quota enforcement for API routes
- **UI Components** (`/src/features/BillingDashboard/`): React components for billing visualization
- **API Routes** (`/src/app/api/billing/`): REST endpoints for billing operations
- **AI Runtime Integration** (`/src/libs/model-runtime/hooks/billing.ts`): Automatic token usage tracking

#### Database Tables | Tabelas do Banco

```typescript
// Billing plans with features and pricing
billing_plans: {
  (id, name, price, features, tokensPerMonth, maxTokensPerRequest);
}

// User subscriptions to plans
user_subscriptions: {
  (id, userId, planId, status, createdAt, expiresAt);
}

// Token usage tracking
user_usage: {
  (id, userId, date, tokensUsed, requestsCount, feature);
}

// User balance and credits
user_balance: {
  (id, userId, balance, lastUpdated);
}

// Billing transactions
billing_transactions: {
  (id, userId, amount, type, description, createdAt);
}

// User quotas and limits
user_quotas: {
  (id, userId, quotaType, limit, used, resetDate);
}
```

#### Usage Examples | Exemplos de Uso

```typescript
// Check quota before API call
const quotaCheck = await billingService.checkQuota('tokens', 1000);
if (!quotaCheck.allowed) {
  throw new Error('Quota exceeded');
}

// Record token usage after API call
await billingService.recordTokenUsage({
  tokens: 1000,
  feature: 'chat',
  model: 'gpt-4',
});

// Subscribe to a plan
await billingService.subscribeToPlan('pro-monthly');
```

#### Security Features | Recursos de Segurança

- ✅ User isolation in all billing operations
- ✅ Quota enforcement middleware
- ✅ Transaction logging for audit trails
- ✅ Automatic usage tracking integration
- ✅ Plan-based access control

### 🌐 Internationalization (i18n) | Internacionalização

#### Workflow | Fluxo de Trabalho

**EN**:

1. Add new translation keys to `src/locales/default/[namespace].ts`
2. For development, manually translate `locales/zh-CN/namespace.json`
3. For production, run `npm run i18n` to auto-translate all languages

**PT-BR**:

1. Adicione novas chaves de tradução em `src/locales/default/[namespace].ts`
2. Para desenvolvimento, traduza manualmente `locales/zh-CN/namespace.json`
3. Para produção, execute `npm run i18n` para auto-traduzir todos os idiomas

#### Usage in Components | Uso em Componentes

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('newFeature.title')}</h1>
      <p>{t('newFeature.description')}</p>
      <button>{t('newFeature.button')}</button>
    </div>
  );
};
```

### 🏪 State Management (Zustand) | Gerenciamento de Estado

#### Slice Organization | Organização de Slices

**EN**: Each store uses modular slice architecture:

**PT-BR**: Cada store usa arquitetura de slice modular:

```
src/store/[storeName]/
├── slices/
│   └── [sliceName]/
│       ├── action.ts           # Actions definition
│       ├── initialState.ts     # State structure and initial values
│       ├── selectors.ts        # State selectors
│       └── index.ts           # Module exports
├── initialState.ts            # Aggregated initial state
├── store.ts                   # Store definition and setup
└── selectors.ts              # Unified selectors export
```

#### Selector Pattern | Padrão de Seletores

```typescript
// In slice selectors.ts | Em seletores do slice
const currentTopics = (s: ChatStoreState): ChatTopic[] => s.topicMaps[s.activeId];
const getTopicById =
  (id: string) =>
  (s: ChatStoreState): ChatTopic | undefined =>
    currentTopics(s)?.find((topic) => topic.id === id);

// Export as unified object | Exporte como objeto unificado
export const topicSelectors = {
  currentTopics,
  getTopicById,
  // ... other selectors
};
```

### 📁 Code Organization | Organização de Código

**EN**:

- **Keep related tests near source files**: Use co-location pattern (component.test.tsx next to component.tsx)
- **Use meaningful file names**: Prefer descriptive names over generic ones
- **Group by feature**: Organize components and utilities by domain/feature
- **Maintain consistent imports**: Use absolute imports with path aliases

**PT-BR**:

- **Mantenha testes relacionados próximos aos arquivos fonte**: Use padrão de co-localização (component.test.tsx próximo ao component.tsx)
- **Use nomes de arquivo significativos**: Prefira nomes descritivos em vez de genéricos
- **Agrupe por funcionalidade**: Organize componentes e utilitários por domínio/funcionalidade
- **Mantenha imports consistentes**: Use imports absolutos com aliases de caminho

### 🚨 Security Guidelines | Diretrizes de Segurança

**EN**: **Database layer is the first line of security defense. Every user data operation MUST include user permission checks.**

**PT-BR**: **A camada de banco é a primeira linha de defesa de segurança. Toda operação de dados do usuário DEVE incluir verificações de permissão do usuário.**

#### Required Security Tests | Testes de Segurança Obrigatórios

```typescript
it('should not update records of other users', async () => {
  // Create other user's record | Criar registro de outro usuário
  const [otherUserRecord] = await serverDB
    .insert(myTable)
    .values({ userId: 'other-user', data: 'original' })
    .returning();

  // Try to update other user's record | Tentar atualizar registro de outro usuário
  const result = await myModel.update(otherUserRecord.id, { data: 'hacked' });

  // Should return undefined/empty (permission check failed)
  // Deve retornar undefined/vazio (verificação de permissão falhou)
  expect(result).toBeUndefined();

  // Verify original data unchanged | Verificar que dados originais não mudaram
  const unchanged = await serverDB.query.myTable.findFirst({
    where: eq(myTable.id, otherUserRecord.id),
  });
  expect(unchanged?.data).toBe('original');
});
```

---

# =============================================================================

# 🚀 PRODUCTION DEPLOYMENT | DEPLOY DE PRODUÇÃO

# =============================================================================

## Security First | Segurança em Primeiro Lugar

**🚨 CRITICAL SECURITY NOTICE | AVISO CRÍTICO DE SEGURANÇA**

Before any deployment, run the security fix script:
Antes de qualquer deploy, execute o script de correção de segurança:

```bash
./SECURITY-FIX.sh
```

This script addresses critical security vulnerabilities:
Este script corrige vulnerabilidades críticas de segurança:

- ✅ Removes exposed API keys from repository
- ✅ Generates secure passwords automatically
- ✅ Creates secure Docker configurations
- ✅ Fixes vulnerable image versions
- ✅ Implements proper .gitignore rules

**NEVER deploy without running SECURITY-FIX.sh first!**
**NUNCA faça deploy sem executar SECURITY-FIX.sh primeiro!**

## Production Deployment Commands | Comandos de Deploy Produção

### Secure Deployment | Deploy Seguro

```bash
# 1. Fix security vulnerabilities first
./SECURITY-FIX.sh

# 2. Configure your real API keys in .env
nano .env

# 3. Deploy securely
./deploy-secure.sh
```

### Alternative Deployment | Deploy Alternativo

```bash
# Optimized production deployment
./deploy-prod-optimized.sh
```

### Troubleshooting | Solução de Problemas

```bash
# Diagnose and fix common issues
./troubleshoot.sh
```

## Docker Commands | Comandos Docker

### Secure Docker Compose | Docker Compose Seguro

```bash
# Use secure configuration with fixed image versions
docker-compose -f docker-compose.secure.yml up -d

# View logs
docker-compose -f docker-compose.secure.yml logs -f

# Stop services
docker-compose -f docker-compose.secure.yml down
```

### Database Operations | Operações de Banco

```bash
# Run migrations manually
MIGRATION_DB=1 DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/agents_chat" tsx ./scripts/migrateServerDB/index.ts

# Install pgvector extension
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Backup database
docker exec agents-chat-postgres pg_dump -U postgres agents_chat > backup.sql
```

## Production Architecture | Arquitetura de Produção

### Services | Serviços

- **PostgreSQL 16** with pgvector (port 5432) - Database with vector search
- **Redis 7** (port 6379) - Cache and sessions
- **MinIO** (ports 9000/9001) - S3-compatible file storage
- **Casdoor** (port 8000) - SSO authentication service
- **Next.js App** (port 3210) - Main application

### Security Features | Recursos de Segurança

- ✅ Secure password generation
- ✅ No exposed secrets in repository
- ✅ Specific Docker image versions (no 'latest')
- ✅ Network isolation between services
- ✅ Health checks for all services
- ✅ Automated backup scripts
- ✅ Monitoring and alerting

### Environment Variables | Variáveis de Ambiente

**Critical Variables | Variáveis Críticas:**

```env
# Database
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@localhost:5432/agents_chat
DATABASE_DRIVER=node

# Security
KEY_VAULTS_SECRET=64_CHARACTER_HEX_KEY
NEXTAUTH_SECRET=64_CHARACTER_HEX_KEY

# MinIO
MINIO_ROOT_PASSWORD=SECURE_PASSWORD
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true

# API Keys (configure with your real keys)
OPENAI_API_KEY=sk-proj-YOUR_REAL_KEY
ANTHROPIC_API_KEY=sk-ant-YOUR_REAL_KEY
```

## Monitoring | Monitoramento

### Health Checks | Verificações de Saúde

```bash
# Automated health check
/usr/local/bin/agents-chat-health.sh

# Manual service checks
curl -f http://localhost:3210                           # Application
curl -f http://localhost:9000/minio/health/live         # MinIO
docker exec agents-chat-postgres pg_isready -U postgres # PostgreSQL
docker exec agents-chat-redis redis-cli ping            # Redis
```

### Backup Operations | Operações de Backup

```bash
# Automated backup
/usr/local/bin/agents-chat-backup.sh

# Manual backup
docker exec agents-chat-postgres pg_dump -U postgres agents_chat > backup_$(date +%Y%m%d).sql
tar -czf data_backup_$(date +%Y%m%d).tar.gz data/
```

## Common Issues | Problemas Comuns

### pgvector Extension Error | Erro da Extensão pgvector

```bash
# Ensure using correct PostgreSQL image
# Garanta que está usando a imagem correta do PostgreSQL
docker-compose ps postgres # Should show: pgvector/pgvector:pg16

# Install extension manually if needed
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Build Memory Issues | Problemas de Memória no Build

```bash
# Increase Docker memory limit to 8GB+
# Configure swap if needed
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Network Connectivity | Conectividade de Rede

```bash
# Check Docker network
docker network ls | grep agents-chat

# Test container connectivity
docker exec agents-chat ping agents-chat-postgres
```

## Performance Optimization | Otimização de Performance

### PostgreSQL Tuning | Otimização do PostgreSQL

```sql
-- For servers with 8GB+ RAM
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '32MB';
SELECT pg_reload_conf();
```

### Redis Configuration | Configuração do Redis

```bash
# Configure Redis for production
docker exec agents-chat-redis redis-cli CONFIG SET maxmemory 512mb
docker exec agents-chat-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Documentation References | Referências de Documentação

- **Complete Deploy Guide**: `DEPLOY-PROD.md`
- **Security Fixes**: `SECURITY-FIX.sh`
- **Troubleshooting**: `troubleshoot.sh`
- **Deploy Summary**: `RESUMO-DEPLOY.md`

## Support | Suporte

### Log Locations | Localizações de Logs

```bash
# Application logs
docker logs agents-chat

# PostgreSQL logs
docker logs agents-chat-postgres

# All services
docker-compose logs -f
```

### Emergency Procedures | Procedimentos de Emergência

```bash
# Complete restart
docker-compose down && docker-compose up -d

# Rebuild application only
docker-compose up -d --build app

# Reset to clean state
docker-compose down -v && ./deploy-secure.sh
```

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

---

# =============================================================================

# 📋 RECENT UPDATES | ATUALIZAÇÕES RECENTES

# =============================================================================

## Authentication Routes Fix | Correção de Rotas de Autenticação

### Problem Solved | Problema Resolvido

- Fixed 404 errors on `/next-auth/signin` routes
- Removed URL variants (pt-BR\_\_0\_\_dark) from visible URLs
- Maintained internal routing system compatibility

### Changes Made | Alterações Realizadas

1. **Clean URLs**:
   - Removed visible route variants from URLs
   - Now using clean paths: `/login`, `/signup`, `/chat`, `/next-auth/signin`
   - Internal middleware still uses variants for proper routing

2. **New Authentication Pages**:
   - Created `/app/next-auth/signin/page.tsx`
   - Created `/app/next-auth/signup/page.tsx`
   - Created `/app/next-auth/error/page.tsx`
   - Created `/app/next-auth/layout.tsx`

3. **Middleware Updates**:
   - Added `/next-auth/(.*)` to middleware matcher
   - Updated redirect logic to use clean URLs
   - Maintained backward compatibility

## Landing Page Improvements | Melhorias na Landing Page

### Theme Integration | Integração de Tema

- Full dark/light theme support using `useTheme()` from antd-style
- Dynamic colors that adjust based on system preferences
- Smooth transitions between themes

### Waitlist Feature | Funcionalidade de Lista de Espera

- Replaced pricing section with waitlist signup
- Email capture form with validation
- Smooth scroll to waitlist section
- Success feedback on submission

### Components Updated | Componentes Atualizados

1. **Hero Section**:
   - "Começar Agora" → "Entrar na Fila de Espera"
   - Login button remains active
   - Theme-aware styling

2. **Waitlist Section** (New):
   - Email input with validation
   - Loading states
   - Success messages
   - Privacy notice

3. **CTA Section**:
   - Updated to direct to waitlist
   - "Solicitar Demonstração" option maintained

4. **All Sections**:
   - Theme-aware backgrounds and colors
   - Consistent styling across light/dark modes

## Build Error Fix | Correção de Erro de Build

### Next.js 15 useSearchParams Error

Fixed the build error: `useSearchParams() should be wrapped in a suspense boundary`

**Solution Applied**:

```tsx
// /app/next-auth/error/page.tsx
import { Suspense } from 'react';

// Force dynamic rendering to avoid build errors with useSearchParams
export const dynamic = 'force-dynamic';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthErrorPage />
  </Suspense>
);
```

**Key Points**:

- Next.js 15 requires Suspense boundaries for components using `useSearchParams()`
- Added `export const dynamic = 'force-dynamic'` to force dynamic rendering
- Wrapped component in Suspense with Loading fallback
- This prevents static generation errors during build

## Admin API Key Management System | Sistema de Gerenciamento de API Keys do Admin

### Overview | Visão Geral

**EN**: The admin panel now includes a comprehensive API key management system that allows administrators to configure AI provider credentials centrally, eliminating the need to manage API keys through environment variables.

**PT-BR**: O painel administrativo agora inclui um sistema abrangente de gerenciamento de chaves API que permite aos administradores configurar credenciais de provedores de IA centralmente, eliminando a necessidade de gerenciar chaves API através de variáveis de ambiente.

### Key Features | Principais Funcionalidades

- ✅ **Centralized API Key Management**: Configure all AI provider keys from admin panel
- ✅ **Encrypted Storage**: All API keys are encrypted using AES-GCM with KEY_VAULTS_SECRET
- ✅ **Priority System**: User keys → Admin keys → Environment variables
- ✅ **Provider-Specific Forms**: Tailored forms for each AI provider (OpenAI, Azure, AWS, etc.)
- ✅ **Real-time Configuration**: Changes take effect immediately without restart
- ✅ **Visual Indicators**: Show which providers are configured and enabled
- ✅ **Secure Caching**: 5-minute cache for performance with automatic invalidation

### Architecture | Arquitetura

#### Database Schema | Schema do Banco

```sql
-- AI providers table with encrypted keyVaults
CREATE TABLE ai_providers (
  id VARCHAR(64) NOT NULL,
  name TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sort INTEGER,
  enabled BOOLEAN,
  fetch_on_client BOOLEAN,
  check_model TEXT,
  logo TEXT,
  description TEXT,
  key_vaults TEXT,  -- Encrypted API keys and credentials
  source VARCHAR(20) CHECK (source IN ('builtin', 'custom')),
  settings JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);
```

#### Key Components | Componentes Principais

1. **Admin Models Page** (`/src/features/Admin/Models/index.tsx`):
   - Provider listing with configuration forms
   - Provider-specific API key forms (OpenAI, Azure, AWS Bedrock, etc.)
   - Real-time enable/disable toggle
   - Visual indicators for configured providers

2. **Server-side API** (`/src/server/routers/lambda/admin.ts`):
   - `getModelConfig`: Fetch and decrypt provider configurations
   - `updateProviderConfig`: Save and encrypt provider settings
   - Automatic cache invalidation on updates

3. **Global Configuration** (`/src/server/globalConfig/adminProviderConfig.ts`):
   - Load admin-configured settings with caching
   - Decrypt API keys securely
   - Provide fallback to environment variables

4. **Runtime Integration** (`/src/server/modules/AgentRuntime/index.ts`):
   - Priority-based API key resolution
   - Support for all 40+ AI providers
   - Seamless fallback system

### Supported Providers | Provedores Suportados

The system supports all major AI providers with provider-specific forms:

- **OpenAI Compatible**: OpenAI, DeepSeek, Perplexity, Moonshot, Mistral, Groq, etc.
- **Azure OpenAI**: Full Azure integration with endpoint and API version
- **AWS Bedrock**: Complete AWS credentials management
- **Google**: Vertex AI and standard Google AI
- **Anthropic**: Claude API integration
- **Cloudflare**: Workers AI support
- **Local Models**: Ollama and LMStudio
- **And 30+ more providers**

### Security Implementation | Implementação de Segurança

#### Encryption | Criptografia

```typescript
// Encryption using AES-GCM with KEY_VAULTS_SECRET
const { KeyVaultsEncrypt } = await import('@/server/modules/KeyVaultsEncrypt');
const encrypt = new KeyVaultsEncrypt();

// Encrypt API keys before storing
const encryptedKeyVaults = await encrypt.encrypt(JSON.stringify(keyVaults));

// Decrypt when loading
const decrypted = await encrypt.decrypt(provider.keyVaults);
const keyVaults = JSON.parse(decrypted);
```

#### Priority System | Sistema de Prioridade

```typescript
// Priority: 1. User payload, 2. Admin config, 3. Environment variables
const apiKey = apiKeyManager.pick(
  payload?.apiKey || adminSettings?.apiKey || llmConfig[`${upperProvider}_API_KEY`],
);
```

### Usage Examples | Exemplos de Uso

#### Configuring OpenAI Provider | Configurando Provedor OpenAI

```typescript
// Admin configures OpenAI through UI
const openAIConfig = {
  apiKey: 'sk-proj-...',
  baseURL: 'https://api.openai.com/v1', // optional
};

// System automatically uses admin config for all users
const runtime = await initAgentRuntimeWithUserPayload('openai', userPayload);
```

#### AWS Bedrock Configuration | Configuração AWS Bedrock

```typescript
// Admin configures AWS Bedrock
const bedrockConfig = {
  accessKeyId: 'AKIA...',
  secretAccessKey: 'wJalrXUtnFEMI...',
  region: 'us-east-1',
  sessionToken: 'optional-session-token',
};
```

#### Azure OpenAI Setup | Configuração Azure OpenAI

```typescript
// Admin configures Azure OpenAI
const azureConfig = {
  apiKey: 'your-azure-api-key',
  endpoint: 'https://your-resource.openai.azure.com',
  apiVersion: '2024-10-21',
};
```

### Migration Guide | Guia de Migração

#### From Environment Variables | De Variáveis de Ambiente

1. **Before**: API keys in `.env`

```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
AZURE_API_KEY=your-azure-key
```

2. **After**: Configure through admin panel
   - Access `/admin/models`
   - Configure each provider individually
   - Enable/disable providers as needed
   - Environment variables serve as fallback

#### Database Migration | Migração do Banco

The system uses existing `ai_providers` table structure:

```bash
# Generate new schema
pnpm db:generate

# Apply migrations
pnpm db:migrate

# The setup script handles schema updates automatically
./setup-admin-environment.sh --rebuild
```

### Performance Optimization | Otimização de Performance

#### Caching Strategy | Estratégia de Cache

```typescript
// 5-minute cache for admin provider configurations
let adminProviderCache: Record<string, any> | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache invalidation on updates
export function clearAdminProviderCache() {
  adminProviderCache = null;
  cacheExpiry = 0;
}
```

#### Lazy Loading | Carregamento Sob Demanda

- Provider configurations loaded only when needed
- Automatic cache warming on first request
- Graceful fallback to environment variables

### Troubleshooting | Solução de Problemas

#### Common Issues | Problemas Comuns

1. **Missing KEY_VAULTS_SECRET**:

```bash
# Generate secure key
openssl rand -hex 32

# Add to .env
KEY_VAULTS_SECRET=your-generated-key
```

2. **Provider Not Working**:
   - Check admin panel for configuration
   - Verify API key format
   - Check provider-specific requirements

3. **Cache Issues**:
   - Cache auto-invalidates on updates
   - Manual cache clear available in admin panel

### Deployment Notes | Notas de Deploy

#### Setup Script Updates | Atualizações do Script de Setup

The `setup-admin-environment.sh` script includes:

- Automatic KEY_VAULTS_SECRET generation
- Database schema fixes for missing columns
- Admin user creation with proper permissions
- Provider configuration verification

#### Environment Variables | Variáveis de Ambiente

```bash
# Required for encryption
KEY_VAULTS_SECRET=64_character_hex_key

# Optional fallback keys (admin panel takes priority)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

#### Database Requirements | Requisitos do Banco

- PostgreSQL 12+ with pgvector extension
- Proper user permissions for admin operations
- Encrypted storage support

### Setup Script Integration | Integração do Script de Setup

The `setup-admin-environment.sh` script has been updated to fully support the API key management system:

#### Key Features | Funcionalidades Principais

```bash
# Complete setup with API key management
./setup-admin-environment.sh

# Rebuild existing environment with latest schema fixes
./setup-admin-environment.sh --rebuild

# Force all migrations (use with caution)
./setup-admin-environment.sh --force-migration

# Clean environment and start fresh
./setup-admin-environment.sh --clean
```

#### Automatic Database Schema Fixes | Correções Automáticas do Schema

The script includes comprehensive schema fixes for common issues:

```sql
-- Safe column addition function
CREATE OR REPLACE FUNCTION safe_add_column(
    p_table_name text,
    p_column_name text,
    p_column_definition text
) RETURNS void AS $$;

-- Applied fixes
SELECT safe_add_column('sessions', 'group_id', 'VARCHAR(255)');
SELECT safe_add_column('sessions', 'pinned', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('agents', 'category', 'VARCHAR(255) DEFAULT ''general''');
SELECT safe_add_column('agents', 'is_domain', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('agents', 'sort', 'INTEGER DEFAULT 0');
SELECT safe_add_column('agents_to_sessions', 'category', 'VARCHAR(255)');
```

#### Environment Configuration | Configuração do Ambiente

The script automatically generates secure keys:

```bash
# Auto-generated secure keys
KEY_VAULTS_SECRET=$(openssl rand -hex 32) # For API key encryption
NEXTAUTH_SECRET=$(openssl rand -hex 32)   # For authentication
POSTGRES_PASSWORD=$(openssl rand -hex 32) # For database
MINIO_PASSWORD=$(openssl rand -hex 16)    # For file storage
```

#### Admin User Creation | Criação do Usuário Admin

Automatic admin user creation with proper permissions:

```typescript
// Generated admin user script
const adminUser = {
  email: 'admin@your-domain.com',
  password: 'auto-generated-password',
  isAdmin: true,
  isOnboarded: true,
};
```

#### Rebuild Process | Processo de Rebuild

For existing deployments, use the rebuild flag:

```bash
# Rebuild with latest schema fixes
./setup-admin-environment.sh --rebuild

# Rebuild without admin user creation (recommended for existing deployments)
./setup-admin-environment.sh --rebuild --skip-admin

# This will:
# 1. Update dependencies
# 2. Regenerate database schema
# 3. Apply missing column fixes
# 4. Rebuild application
# 5. Preserve existing data
# 6. Skip admin user creation if --skip-admin is used
```

#### Admin User Management | Gerenciamento de Usuário Admin

The script provides flexible admin user management with enhanced security:

```bash
# Interactive setup with custom admin credentials
./setup-admin-environment.sh
# - REQUIRES custom admin email (no automatic IP-based defaults)
# - Prompts for custom admin password (min 8 chars)
# - Auto-generates secure password if not provided

# Skip admin user creation for rebuilds
./setup-admin-environment.sh --skip-admin

# Rebuild mode automatically skips admin creation
./setup-admin-environment.sh --rebuild

# Automatic admin user detection
# - Checks if admin user already exists
# - Only creates if none exists
# - Uses SQL UPSERT for safe updates
```

#### Custom Admin Configuration | Configuração Personalizada do Admin

During interactive setup, you can configure:

1. **Custom Admin Email**: **REQUIRED** - no IP-based defaults (e.g., admin\@64.23.237.16)
2. **Custom Admin Password**: Set a secure password (minimum 8 characters)
3. **Auto-generated Password**: Leave empty for secure random password
4. **Admin User Detection**: Automatically skips if admin already exists
5. **Rebuild Safety**: Rebuild mode automatically skips admin creation

#### Migration Safety | Segurança das Migrações

The script includes safety measures:

- ✅ **Existing data preservation**: Never drops existing tables
- ✅ **Safe column addition**: Only adds missing columns
- ✅ **Graceful error handling**: Continues on non-critical errors
- ✅ **Backup recommendations**: Suggests backing up before major changes
- ✅ **Rollback support**: Maintains .env.backup for quick recovery

#### Post-Setup Verification | Verificação Pós-Setup

The script provides verification steps:

```bash
# Service health checks
✅ PostgreSQL: Ready
✅ MinIO: Ready
✅ API Health: OK
✅ Admin Panel: Accessible

# Access information
📊 Admin Panel: http://your-host:3210/admin
👤 Admin Email: admin@your-domain.com
🔑 Admin Password: auto-generated-password
```

#### Integration with CI/CD | Integração com CI/CD

The script is designed for automated deployments:

```yaml
# Example GitHub Actions workflow
- name: Setup Admin Environment
  run: |
    chmod +x setup-admin-environment.sh
    ./setup-admin-environment.sh --rebuild

- name: Verify Setup
  run: |
    docker ps | grep agents-chat
    curl -f http://localhost:3210/api/health
```

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
