#!/bin/bash

# Script para corrigir o build do Docker em ambientes CI/CD
# Aplica patches necessários para contornar o bug do webpack

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[FIX]${NC} Aplicando correções para Docker build..."

# Verificar se o arquivo next.config.ts existe
if [ ! -f "next.config.ts" ]; then
    echo "Erro: next.config.ts não encontrado!"
    exit 1
fi

# Fazer backup do next.config.ts
cp next.config.ts next.config.ts.backup

# Aplicar patch temporário para o build
cat > next.config.patch.ts << 'EOF'
// Patch temporário para corrigir webpack.WebpackError no Docker
const originalConfig = require('./next.config.ts.backup');

module.exports = {
    ...originalConfig,
    webpack: (config, options) => {
        // Aplicar configuração original se existir
        if (originalConfig.webpack) {
            config = originalConfig.webpack(config, options);
        }
        
        // Forçar desabilitar todas otimizações no Docker
        if (process.env.DOCKER === 'true') {
            config.optimization = {
                minimize: false,
                minimizer: [],
                splitChunks: false,
                runtimeChunk: false,
            };
        }
        
        return config;
    }
};
EOF

# Substituir temporariamente
mv next.config.ts next.config.ts.original
mv next.config.patch.ts next.config.ts

echo -e "${GREEN}[SUCCESS]${NC} Correções aplicadas!"
echo -e "${BLUE}[INFO]${NC} Para reverter: mv next.config.ts.original next.config.ts"