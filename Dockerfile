# Build stage
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instalar dependências
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm build:docker || pnpm build

# Production stage
FROM node:20-alpine AS runner

# Instalar pnpm no runner também
RUN npm install -g pnpm

WORKDIR /app

# Instalar apenas dependências de produção
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod --no-frozen-lockfile

# Copiar arquivos necessários do build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Se houver standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Criar diretório de logs
RUN mkdir -p /app/logs

EXPOSE 3210

ENV NODE_ENV=production
ENV PORT=3210
ENV HOSTNAME=0.0.0.0

# Tentar usar server.js primeiro, senão usar pnpm start
CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; else pnpm start; fi"]