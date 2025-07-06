# PRD - Agents SAAS: Plataforma Completa de Chat AI

## 📋 Visão Geral do Produto

### Objetivo Principal
Transformar o projeto atual em uma plataforma SAAS completa para chat AI, com sistema de autenticação robusto, controle de tokens, planos de assinatura, e experiência de onboarding otimizada.

### Status Atual vs. Visão Futura
- **Status Atual**: Framework open-source de chat AI (Lobe Chat)
- **Visão Futura**: Plataforma SAAS completa (Agents SAAS) com monetização e controle de usuários

---

## 🎯 Objetivos Estratégicos

### 1. **Autenticação e Gestão de Usuários**
- Sistema de cadastro e login completo
- Perfis de usuário personalizáveis
- Gestão de sessões e segurança

### 2. **Controle de Tokens e Planos**
- Sistema de cotas por plano de assinatura
- Monitoramento de uso em tempo real
- Limitações inteligentes por tipo de usuário

### 3. **Experiência de Onboarding**
- Lead page atrativa antes do acesso ao chat
- Fluxo de cadastro otimizado
- Demonstração das funcionalidades

### 4. **Documentação e APIs**
- Swagger/OpenAPI completo para todas as APIs
- Documentação interna (substituindo GitHub)
- Biblioteca própria de agentes e descoberta

### 5. **Autonomia e Branding**
- Remoção de dependências externas
- Sistema próprio de descoberta de agentes
- Branding completo "Agents SAAS"

---

## 🔐 Epic 1: Sistema de Autenticação Avançado

### Funcionalidades Principais

#### 1.1 **Cadastro de Usuários**
- **Fluxo de Registro**:
  - Email + senha
  - Verificação de email obrigatória
  - Validação de força de senha
  - Captcha para segurança
  - Termos de uso e política de privacidade

- **Campos Obrigatórios**:
  ```typescript
  interface UserRegistration {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }
  ```

#### 1.2 **Sistema de Login Otimizado**
- **Métodos de Autenticação**:
  - Email/senha tradicional
  - OAuth (Google, GitHub, Microsoft)
  - Magic Link por email
  - Remember me (30 dias)

#### 1.3 **Gestão de Perfil**
- **Informações Pessoais**:
  - Avatar customizável
  - Preferências de idioma
  - Timezone
  - Notificações

- **Configurações de Segurança**:
  - Alteração de senha
  - 2FA (opcional)
  - Sessões ativas
  - Log de atividades

#### 1.4 **Recuperação de Senha**
- Reset via email
- Validação por token temporário
- Histórico de alterações

### Implementação Técnica

#### 1.4.1 **Database Schema (Drizzle)**
```sql
-- Tabela de usuários expandida
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  avatar_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  plan_id UUID REFERENCES plans(id),
  tokens_used INTEGER DEFAULT 0,
  tokens_limit INTEGER DEFAULT 1000,
  status user_status DEFAULT 'active',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'pt-BR',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  tokens_included INTEGER NOT NULL,
  max_agents INTEGER,
  max_conversations INTEGER,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de sessões
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.4.2 **API Endpoints (tRPC)**
```typescript
// src/server/routers/auth.ts
export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementação de registro
    }),
    
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementação de login
    }),
    
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verificação de email
    }),
    
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Envio de email de recuperação
    }),
    
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      // Reset de senha
    }),
    
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      // Atualização de perfil
    })
});
```

#### 1.4.3 **Componentes React**
```typescript
// src/features/Auth/RegisterForm.tsx
export const RegisterForm: React.FC = () => {
  // Formulário de registro com validação
  // Integração com tRPC
  // Estados de loading e error
  // Redirecionamento pós-sucesso
};

// src/features/Auth/LoginForm.tsx
export const LoginForm: React.FC = () => {
  // Formulário de login
  // Remember me
  // OAuth buttons
  // Forgot password link
};
```

---

## 💰 Epic 2: Sistema de Controle de Tokens e Planos

### Funcionalidades Principais

#### 2.1 **Gestão de Planos de Assinatura**

**Planos Propostos**:

1. **Free Tier**:
   - 1.000 tokens/mês
   - 3 agentes personalizados
   - 10 conversas simultâneas
   - Suporte por email

2. **Pro** (R$ 29/mês):
   - 50.000 tokens/mês
   - Agentes ilimitados
   - 100 conversas simultâneas
   - Suporte prioritário
   - API access

3. **Business** (R$ 99/mês):
   - 200.000 tokens/mês
   - Tudo do Pro +
   - White-label
   - SSO
   - Analytics avançado

4. **Enterprise** (Customizado):
   - Tokens ilimitados
   - On-premise option
   - SLA garantido
   - Suporte dedicado

#### 2.2 **Controle de Tokens**

```typescript
// src/services/tokenManager.ts
export class TokenManagerService {
  // Verificar disponibilidade antes da requisição
  async checkTokenAvailability(userId: string, estimatedTokens: number): Promise<boolean>
  
  // Consumir tokens após uso real
  async consumeTokens(userId: string, tokensUsed: number): Promise<void>
  
  // Obter estatísticas de uso
  async getUsageStats(userId: string): Promise<UsageStats>
  
  // Renovar tokens mensalmente
  async renewMonthlyTokens(): Promise<void>
}

interface UsageStats {
  tokensUsed: number;
  tokensLimit: number;
  percentageUsed: number;
  daysUntilReset: number;
  averageDaily: number;
}
```

#### 2.3 **Dashboard de Uso**
- Gráficos de consumo de tokens
- Projeção de uso mensal
- Histórico de conversas
- Alertas de limite próximo

#### 2.4 **Sistema de Billing**
- Integração com Stripe
- Faturas automáticas
- Upgrade/downgrade de planos
- Período de teste gratuito

### Implementação Técnica

#### 2.4.1 **Middleware de Token**
```typescript
// src/middleware/tokenMiddleware.ts
export const tokenMiddleware = async (
  req: NextRequest,
  userId: string,
  estimatedTokens: number
) => {
  const tokenManager = new TokenManagerService();
  
  const hasTokens = await tokenManager.checkTokenAvailability(userId, estimatedTokens);
  
  if (!hasTokens) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Token limit exceeded. Please upgrade your plan.',
    });
  }
  
  return true;
};
```

#### 2.4.2 **Hook de Monitoramento**
```typescript
// src/hooks/useTokenUsage.ts
export const useTokenUsage = () => {
  const { data: usage } = trpc.user.getTokenUsage.useQuery();
  
  const isNearLimit = usage ? usage.percentageUsed > 80 : false;
  const canMakeRequest = usage ? usage.tokensUsed < usage.tokensLimit : false;
  
  return {
    usage,
    isNearLimit,
    canMakeRequest,
    refreshUsage: () => {
      // Invalidate e refetch
    }
  };
};
```

---

## 🎨 Epic 3: Lead Page e Onboarding

### Funcionalidades Principais

#### 3.1 **Landing Page Principal**
- **Hero Section**:
  - Proposta de valor clara
  - Call-to-action principal
  - Demo interativo/vídeo

- **Features Section**:
  - Principais funcionalidades
  - Benefícios por persona
  - Comparação de planos

- **Social Proof**:
  - Testimonials
  - Case studies
  - Métricas de uso

- **Pricing**:
  - Comparativo de planos
  - FAQ sobre preços
  - Botões de CTA

#### 3.2 **Fluxo de Onboarding**
1. **Boas-vindas**: Explicação rápida
2. **Setup inicial**: Preferências básicas
3. **Primeiro agente**: Criação guiada
4. **Primeira conversa**: Tutorial interativo
5. **Recursos avançados**: Apresentação opcional

#### 3.3 **Onboarding Interativo**
```typescript
// src/features/Onboarding/OnboardingFlow.tsx
export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { id: 'welcome', component: WelcomeStep },
    { id: 'preferences', component: PreferencesStep },
    { id: 'first-agent', component: FirstAgentStep },
    { id: 'first-chat', component: FirstChatStep },
    { id: 'complete', component: CompleteStep }
  ];
  
  // Implementação do fluxo
};
```

### Implementação Técnica

#### 3.3.1 **Estrutura de Rotas**
```
src/app/
├── (marketing)/
│   ├── page.tsx              # Landing page
│   ├── pricing/
│   │   └── page.tsx          # Página de preços
│   ├── features/
│   │   └── page.tsx          # Funcionalidades
│   └── about/
│       └── page.tsx          # Sobre nós
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Login
│   ├── register/
│   │   └── page.tsx          # Cadastro
│   └── onboarding/
│       └── page.tsx          # Onboarding
└── (app)/                    # Área logada (chat atual)
    └── ...
```

#### 3.3.2 **Componentes de Marketing**
```typescript
// src/features/Marketing/HeroSection.tsx
export const HeroSection: React.FC = () => {
  return (
    <section className="hero">
      <div className="container">
        <h1>Transforme sua produtividade com IA</h1>
        <p>Plataforma completa de agentes AI para automatizar seu trabalho</p>
        <div className="cta-buttons">
          <Button size="large" type="primary" href="/register">
            Começar Gratuitamente
          </Button>
          <Button size="large" href="/demo">
            Ver Demo
          </Button>
        </div>
      </div>
    </section>
  );
};
```

---

## 📚 Epic 4: Documentação e APIs

### Funcionalidades Principais

#### 4.1 **Swagger/OpenAPI Integration**
```typescript
// src/lib/swagger.ts
import { createOpenApiDocument } from '@trpc/openapi';
import { appRouter } from '@/server/routers/_app';

export const openApiDocument = createOpenApiDocument(appRouter, {
  title: 'Agents SAAS API',
  description: 'API completa para a plataforma Agents SAAS',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_API_URL + '/api',
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticação' },
    { name: 'Users', description: 'Gestão de usuários' },
    { name: 'Agents', description: 'Gestão de agentes' },
    { name: 'Chat', description: 'Funcionalidades de chat' },
    { name: 'Billing', description: 'Cobrança e planos' }
  ]
});
```

#### 4.2 **Documentação Interna**
- **API Reference**: Substituir links do GitHub
- **Guias de Desenvolvimento**: Versões em PT-BR
- **Examples**: Casos de uso práticos
- **SDK Documentation**: Para diferentes linguagens

#### 4.3 **Página de Documentação**
```typescript
// src/app/(docs)/layout.tsx
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="docs-layout">
      <DocsSidebar />
      <main className="docs-content">
        {children}
      </main>
    </div>
  );
}
```

### Implementação Técnica

#### 4.3.1 **Estrutura de Documentação**
```
docs/
├── api/
│   ├── authentication.md
│   ├── users.md
│   ├── agents.md
│   ├── chat.md
│   └── billing.md
├── guides/
│   ├── getting-started.md
│   ├── creating-agents.md
│   ├── integration.md
│   └── deployment.md
├── examples/
│   ├── javascript-sdk.md
│   ├── python-sdk.md
│   └── curl-examples.md
└── reference/
    ├── rate-limits.md
    ├── webhooks.md
    └── errors.md
```

---

## 🔍 Epic 5: Biblioteca Própria de Descoberta

### Funcionalidades Principais

#### 5.1 **Sistema de Agentes Próprio**
- **Catálogo Interno**: Substituir dependência externa
- **Categorização**: Por área, funcionalidade, popularidade
- **Sistema de Avaliação**: Reviews e ratings
- **Agentes Verificados**: Seleção curada pela equipe

#### 5.2 **Marketplace de Agentes**
```typescript
// src/features/AgentMarketplace/
interface Agent {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  tags: string[];
  rating: number;
  downloads: number;
  verified: boolean;
  author: {
    name: string;
    verified: boolean;
  };
  config: AgentConfig;
  pricing: AgentPricing;
}

interface AgentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}
```

#### 5.3 **Sistema de Recomendação**
- **Baseado em Uso**: Agentes mais utilizados
- **Personalizado**: Por perfil e histórico
- **Trending**: Agentes em alta
- **Similares**: "Quem usou isso também usou"

### Implementação Técnica

#### 5.3.1 **Database Schema**
```sql
-- Tabela de agentes
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES agent_categories(id),
  config JSONB NOT NULL,
  author_id UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE agent_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id UUID REFERENCES agent_categories(id),
  sort_order INTEGER DEFAULT 0
);

-- Tabela de avaliações
CREATE TABLE agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);
```

---

## 🚀 Plano de Implementação

### Fase 1: Fundação (Semanas 1-4)
- [ ] **Sistema de Autenticação Básico**
  - [ ] Registro e login
  - [ ] Verificação de email
  - [ ] Gestão de sessões
- [ ] **Database Schema**
  - [ ] Tabelas de usuários e planos
  - [ ] Migrações do Drizzle
- [ ] **Branding Update**
  - [ ] Alterar todas as referências LobeHub → Agents SAAS

### Fase 2: Controle de Recursos (Semanas 5-8)
- [ ] **Sistema de Tokens**
  - [ ] Middleware de verificação
  - [ ] Dashboard de uso
  - [ ] Alertas de limite
- [ ] **Planos de Assinatura**
  - [ ] Definição de planos
  - [ ] Interface de upgrade
- [ ] **Billing Integration**
  - [ ] Integração Stripe
  - [ ] Fluxo de pagamento

### Fase 3: Experiência do Usuário (Semanas 9-12)
- [ ] **Landing Page**
  - [ ] Design e desenvolvimento
  - [ ] SEO optimization
- [ ] **Onboarding Flow**
  - [ ] Tutorial interativo
  - [ ] Configuração inicial
- [ ] **Dashboard Principal**
  - [ ] Overview de uso
  - [ ] Gestão de agentes

### Fase 4: Documentação e APIs (Semanas 13-16)
- [ ] **Swagger/OpenAPI**
  - [ ] Documentação completa
  - [ ] Interface interativa
- [ ] **Biblioteca de Agentes**
  - [ ] Catálogo próprio
  - [ ] Sistema de descoberta
- [ ] **Documentação Interna**
  - [ ] Migração do GitHub
  - [ ] Tradução PT-BR

### Fase 5: Polimento e Launch (Semanas 17-20)
- [ ] **Testes Integrados**
  - [ ] E2E testing
  - [ ] Performance testing
- [ ] **Security Audit**
  - [ ] Penetration testing
  - [ ] Compliance check
- [ ] **Launch Preparation**
  - [ ] Beta testing
  - [ ] Marketing materials

---

## 📊 Métricas de Sucesso

### KPIs Principais
1. **Conversão de Registro**: >15% (visitantes → cadastros)
2. **Ativação**: >70% (cadastros → primeiro uso)
3. **Retenção D7**: >40%
4. **Retenção D30**: >25%
5. **Conversão Paid**: >5% (free → paid)
6. **Churn Mensal**: <10%

### Métricas Operacionais
- **Tempo de Resposta API**: <200ms (p95)
- **Uptime**: >99.9%
- **Uso de Tokens**: Monitoramento em tempo real
- **Satisfação do Cliente**: >4.5/5.0

---

## 🔒 Considerações de Segurança

### Autenticação e Autorização
- [ ] JWT tokens com refresh
- [ ] Rate limiting por usuário
- [ ] 2FA opcional
- [ ] Logout em todos os dispositivos

### Proteção de Dados
- [ ] Criptografia de dados sensíveis
- [ ] LGPD compliance
- [ ] Backup automatizado
- [ ] Auditoria de acesso

### API Security
- [ ] Input validation (Zod)
- [ ] SQL injection protection
- [ ] CORS configurado
- [ ] Headers de segurança

---

## 🎯 Conclusão

Este PRD estabelece a base para transformar o projeto atual em uma plataforma SAAS robusta e escalável. A implementação seguirá as melhores práticas já estabelecidas no projeto, mantendo a arquitetura modular e aproveitando as tecnologias já em uso.

### Próximos Passos Imediatos:
1. **Aprovação do PRD**: Review e ajustes necessários
2. **Setup de Projeto**: Configuração de repositórios e ambientes
3. **Design System**: Criação do novo branding
4. **Sprint Planning**: Detalhamento das primeiras semanas

### Riscos e Mitigações:
- **Complexidade de Migração**: Implementação incremental
- **Performance com Scale**: Monitoramento desde o início
- **Experiência do Usuário**: Testes constantes com usuários reais

Este PRD serve como roadmap vivo que será atualizado conforme o projeto evolui e novos requisitos surgem.