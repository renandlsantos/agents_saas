# Guia de Configuração e Uso do Sentry

## 🚀 Configuração Inicial

### 1. Criar conta no Sentry

1. Acesse <https://sentry.io> e crie uma conta
2. Crie um novo projeto do tipo "Next.js"
3. Copie o DSN do projeto

### 2. Configurar variáveis de ambiente

Adicione ao seu arquivo `.env.local`:

```env
# Sentry DSN (obrigatório)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@o000000.ingest.sentry.io/0000000

# Organização e projeto (para upload de source maps)
SENTRY_ORG=sua-organizacao
SENTRY_PROJECT=agents-saas

# Taxas de amostragem (opcional)
SENTRY_TRACES_SAMPLE_RATE=0.1         # 10% das transações em produção
SENTRY_REPLAY_SESSION_SAMPLE_RATE=0.1 # 10% das sessões em produção
```

## 📊 Arquitetura da Integração

O Sentry está configurado em 3 camadas:

1. **Cliente** (`sentry.client.config.ts`)
   - Captura erros do navegador
   - Session replay
   - Performance monitoring de frontend

2. **Servidor** (`sentry.server.config.ts`)
   - Captura erros do servidor Node.js
   - Performance monitoring de APIs
   - Profiling de código

3. **Edge** (`sentry.edge.config.ts`)
   - Captura erros em middleware
   - Edge functions e rotas

## 🛠️ Uso no Código

### Captura Manual de Erros

```typescript
import { captureException, captureMessage } from '@/utils/sentry';

// Capturar exceção com contexto
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    userId: session.userId,
    operation: 'riskyOperation',
    tags: {
      feature: 'chat',
      severity: 'high',
    },
    metadata: {
      chatId: '123',
      messageCount: 42,
    },
  });
}

// Capturar mensagem informativa
captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  metadata: { step: 'final' },
});
```

### Wrapper para Rotas API

```typescript
import { withSentryHandler } from '@/utils/api-handler';

export const GET = withSentryHandler(
  async (request) => {
    // Sua lógica aqui
    const data = await fetchData();
    return NextResponse.json(data);
  },
  {
    operationName: 'fetch-user-data',
    requireAuth: true,
  },
);
```

### Performance Monitoring

```typescript
import { startTransaction } from '@/utils/sentry';

async function complexOperation() {
  const transaction = startTransaction('process-large-dataset', 'task');

  try {
    // Operação complexa
    const result = await processData();

    transaction?.setData('recordsProcessed', result.count);
    return result;
  } finally {
    transaction?.finish();
  }
}
```

## 🔍 Integração Automática

### tRPC

Todos os erros em routers tRPC são capturados automaticamente:

- Lambda routes: `/src/libs/trpc/lambda/init.ts`
- Edge routes: `/src/libs/trpc/edge/init.ts`
- Async routes: `/src/libs/trpc/async/init.ts`

### Rotas API

Use o wrapper `withSentryHandler` para captura automática em rotas API.

## 🎯 Boas Práticas

### 1. Contexto Útil

Sempre adicione contexto relevante aos erros:

```typescript
captureException(error, {
  userId: user.id,
  operation: 'uploadFile',
  tags: {
    fileType: 'image',
    size: 'large',
  },
  metadata: {
    fileName: file.name,
    fileSize: file.size,
  },
});
```

### 2. Filtragem de Erros

Os arquivos de configuração já filtram:

- Erros de health checks
- Erros de conexão em desenvolvimento
- Erros de extensões do navegador

### 3. Performance

- Use taxas de amostragem baixas em produção (10%)
- Não capture dados sensíveis (senhas, tokens)
- Use `beforeSend` para filtrar erros desnecessários

## 📈 Dashboard do Sentry

### Alertas Recomendados

1. **Error Rate Alert**: > 1% de taxa de erro
2. **Performance Alert**: P95 latency > 3s
3. **Crash Free Rate**: < 99.5%

### Dashboards Úteis

1. **Release Health**: Monitore cada deploy
2. **Performance**: Identifique gargalos
3. **User Feedback**: Colete feedback em erros

## 🔐 Segurança

### Dados Sensíveis

- Nunca envie senhas, tokens ou PII
- Use `maskAllText: true` no replay
- Configure `denyUrls` para APIs externas

### Exemplo de Sanitização

```typescript
captureException(error, {
  userId: hashUserId(user.id), // Hash do ID
  metadata: {
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mascara email
  },
});
```

## 🚨 Troubleshooting

### Sentry não está capturando erros

1. Verifique se `NEXT_PUBLIC_SENTRY_DSN` está definido
2. Confirme que o DSN está correto
3. Verifique o console para erros de inicialização

### Performance degradada

1. Reduza `tracesSampleRate` para 0.01 (1%)
2. Desative replay em produção
3. Use `ignoreTransactions` para rotas frequentes

### Source maps não funcionam

1. Configure `SENTRY_AUTH_TOKEN` no CI/CD
2. Verifique `sentry-cli` está instalado
3. Confirme upload no build do Next.js
