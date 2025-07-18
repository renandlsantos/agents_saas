#!/bin/bash

# ============================================================================
# 🔐 CREATE ADMIN USER - AGENTS CHAT
# ============================================================================
# Script simples para criar usuário administrador após deploy
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}==============================================================================${NC}"
echo -e "${YELLOW}🔐 CRIAR USUÁRIO ADMINISTRADOR${NC}"
echo -e "${YELLOW}==============================================================================${NC}"
echo ""

# Verificar se Docker está rodando
if ! docker ps | grep -q agents-chat-postgres; then
    echo -e "${RED}❌ PostgreSQL não está rodando!${NC}"
    echo -e "${YELLOW}Execute primeiro: docker-compose up -d${NC}"
    exit 1
fi

# Perguntar email do administrador
read -p "Digite o email do administrador: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}Email é obrigatório!${NC}"
    exit 1
fi

# Perguntar nome do administrador
read -p "Digite o nome completo do administrador: " ADMIN_NAME
if [ -z "$ADMIN_NAME" ]; then
    ADMIN_NAME="Administrator"
fi

# Gerar ID único
ADMIN_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "admin-$(date +%s)")

echo ""
echo -e "${YELLOW}Criando usuário administrador...${NC}"

# Criar ou atualizar usuário no banco
docker exec agents-chat-postgres psql -U postgres -d agents_chat << EOF
-- Verificar se usuário existe
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = '${ADMIN_EMAIL}') THEN
        -- Atualizar usuário existente para admin
        UPDATE users 
        SET is_admin = true,
            full_name = '${ADMIN_NAME}',
            updated_at = NOW()
        WHERE email = '${ADMIN_EMAIL}';
        RAISE NOTICE 'Usuário existente promovido a administrador';
    ELSE
        -- Criar novo usuário admin
        INSERT INTO users (
            id,
            email,
            username,
            full_name,
            is_admin,
            is_onboarded,
            created_at,
            updated_at
        ) VALUES (
            '${ADMIN_ID}',
            '${ADMIN_EMAIL}',
            '${ADMIN_EMAIL%%@*}',
            '${ADMIN_NAME}',
            true,
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Novo usuário administrador criado';
    END IF;
END\$\$;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ USUÁRIO ADMINISTRADOR CONFIGURADO COM SUCESSO!${NC}"
    echo -e "${YELLOW}==============================================================================${NC}"
    echo ""
    echo -e "📧 Email: ${GREEN}${ADMIN_EMAIL}${NC}"
    echo -e "👤 Nome: ${GREEN}${ADMIN_NAME}${NC}"
    echo -e "🔑 Tipo: ${GREEN}Administrador${NC}"
    echo ""
    echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
    echo -e "1. Acesse: ${GREEN}http://localhost:3210${NC}"
    echo -e "2. Faça login com o email: ${GREEN}${ADMIN_EMAIL}${NC}"
    echo -e "3. Acesse o painel admin em: ${GREEN}http://localhost:3210/admin${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANTE:${NC}"
    echo -e "- Use o método de autenticação configurado no sistema"
    echo -e "- Se usar login/senha, configure a senha no primeiro acesso"
    echo -e "- Se usar OAuth (Google/GitHub), use a conta com este email"
    echo -e "${YELLOW}==============================================================================${NC}"
else
    echo -e "${RED}❌ Erro ao criar usuário administrador${NC}"
    exit 1
fi