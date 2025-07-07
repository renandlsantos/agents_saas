#!/bin/bash

# Script para corrigir o build do Docker em ambientes CI/CD
# Aplica patches necessários para contornar o bug do webpack
# Referência: https://github.com/vercel/next.js/issues/41690

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[FIX]${NC} Aplicando correções para Docker build..."

# Verificar se o arquivo next.config.ts existe
if [ ! -f "next.config.ts" ]; then
    echo -e "${RED}[ERROR]${NC} next.config.ts não encontrado!"
    exit 1
fi

# Fazer backup do next.config.ts original
if [ ! -f "next.config.ts.original.backup" ]; then
    cp next.config.ts next.config.ts.original.backup
    echo -e "${BLUE}[INFO]${NC} Backup criado: next.config.ts.original.backup"
fi

# Criar versão modificada que desabilita completamente webpack no Docker
cat > next.config.ts << 'EOF'
import { defineConfig } from "./src/config/next";

const config = defineConfig({
  webpack: (config, { isServer }) => {
    // Fornecer WebpackError diretamente quando no Docker
    if (process.env.DOCKER === 'true' && typeof config.optimization !== 'undefined') {
      const webpack = require('webpack');
      
      // Criar classe WebpackError se não existir
      if (!webpack.WebpackError) {
        class WebpackError extends Error {
          constructor(message) {
            super(message);
            this.name = 'WebpackError';
          }
        }
        webpack.WebpackError = WebpackError;
      }
      
      // Desabilitar TODAS as otimizações
      config.optimization = {
        minimize: false,
        minimizer: [],
        splitChunks: false,
        runtimeChunk: false,
        moduleIds: 'named',
        chunkIds: 'named',
        nodeEnv: 'production',
        sideEffects: false,
        usedExports: false,
        providedExports: false,
        concatenateModules: false,
        mangleExports: false,
        innerGraph: false,
        realContentHash: false,
      };
      
      // Desabilitar minificação completamente
      config.mode = 'development';
      
      // Garantir que não há plugins de minificação
      if (config.plugins) {
        config.plugins = config.plugins.filter(
          (plugin) => !plugin.constructor.name.includes('Terser') && 
                      !plugin.constructor.name.includes('Css') &&
                      !plugin.constructor.name.includes('Minimize')
        );
      }
    }
    
    return config;
  },
  
  // Desabilitar minificação do servidor no Docker
  serverMinification: process.env.DOCKER !== 'true',
  
  // Configurações adicionais para Docker
  ...(process.env.DOCKER === 'true' ? {
    compress: false,
    optimizeFonts: false,
    swcMinify: false,
    productionBrowserSourceMaps: false,
    experimental: {
      ...defineConfig({}).experimental,
      optimizeCss: false,
      serverMinification: false,
      optimizePackageImports: [],
    },
  } : {}),
});

export default config;
EOF

echo -e "${GREEN}[SUCCESS]${NC} next.config.ts modificado para contornar bug do webpack!"

# Criar também um Dockerfile.fix alternativo
echo -e "${BLUE}[INFO]${NC} Criando Dockerfile.fix alternativo..."

cat > Dockerfile.fix << 'EOF'
# ========== Base Stage ==========
FROM node:22-slim AS base

WORKDIR /app

# Instalar certificados CA
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ========== Builder Stage ==========
FROM base AS builder

ARG USE_CN_MIRROR

# Configurar npm registry se usar mirror chinês
RUN if [ "${USE_CN_MIRROR:-false}" = "true" ]; then \
        npm config set registry "https://registry.npmmirror.com/"; \
    fi

# Instalar pnpm
RUN npm i -g corepack@latest && \
    corepack enable

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json pnpm-workspace.yaml ./
COPY .npmrc ./
COPY packages ./packages

# Instalar dependências
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Definir variável DOCKER e aplicar fix
ENV DOCKER=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Aplicar fix do webpack antes do build
RUN chmod +x ./scripts/fix-docker-build.sh && \
    ./scripts/fix-docker-build.sh

# Build com configurações mínimas
RUN pnpm run build:docker || \
    (echo "Build falhou, tentando sem otimizações..." && \
     NODE_OPTIONS="--max-old-space-size=8192" \
     NEXT_TELEMETRY_DISABLED=1 \
     npm run build)

# ========== Runtime Stage ==========
FROM base AS runtime

# Criar usuário não-root
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 nextjs

WORKDIR /app

# Copiar arquivos necessários
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/serverLauncher/startServer.js ./startServer.js

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

# Configurações de runtime
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3210

USER nextjs

EXPOSE 3210/tcp

CMD ["node", "startServer.js"]
EOF

echo -e "${GREEN}[SUCCESS]${NC} Dockerfile.fix criado!"
echo -e "${BLUE}[INFO]${NC} Para usar: docker build -f Dockerfile.fix -t app:latest ."
echo -e "${BLUE}[INFO]${NC} Para reverter: mv next.config.ts.original.backup next.config.ts"