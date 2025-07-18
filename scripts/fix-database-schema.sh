#!/bin/bash

# ============================================================================
# 🔧 DATABASE SCHEMA FIX SCRIPT
# ============================================================================
# Script para corrigir problemas comuns de schema no banco de dados
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}=============================================================================="
echo -e "🔧 CORREÇÃO DE SCHEMA DO BANCO DE DADOS"
echo -e "==============================================================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto agents_saas!"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado! Execute setup-admin-environment.sh primeiro."
fi

# Extract database password from .env
DB_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
if [ -z "$DB_PASSWORD" ]; then
    error "POSTGRES_PASSWORD não encontrado no .env!"
fi

log "Conectando ao banco de dados..."

# Check if PostgreSQL is running
if ! docker ps | grep -q agents-chat-postgres; then
    error "PostgreSQL não está rodando! Execute: docker-compose up -d postgres"
fi

# Wait for PostgreSQL to be ready
for i in {1..10}; do
    if docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1; then
        success "PostgreSQL está pronto!"
        break
    fi
    if [ $i -eq 10 ]; then
        error "PostgreSQL não está respondendo!"
    fi
    echo -n "."
    sleep 2
done

log "Aplicando correções de schema..."

# Apply schema fixes
docker exec agents-chat-postgres psql -U postgres -d agents_chat << 'SQLEOF'
-- Create a function to safely add columns
CREATE OR REPLACE FUNCTION safe_add_column(
    p_table_name text,
    p_column_name text,
    p_column_definition text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = p_table_name AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_definition);
        RAISE NOTICE 'Column % added to table %', p_column_name, p_table_name;
    ELSE
        RAISE NOTICE 'Column % already exists in table %', p_column_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply fixes for all potentially missing columns
RAISE NOTICE '=== Checking and fixing database schema ===';

-- Sessions table
SELECT safe_add_column('sessions', 'group_id', 'VARCHAR(255)');
SELECT safe_add_column('sessions', 'pinned', 'BOOLEAN DEFAULT false');

-- Agents table
SELECT safe_add_column('agents', 'category', 'VARCHAR(255) DEFAULT ''general''');
SELECT safe_add_column('agents', 'is_domain', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('agents', 'sort', 'INTEGER DEFAULT 0');

-- Agents to Sessions table
SELECT safe_add_column('agents_to_sessions', 'category', 'VARCHAR(255)');

-- Users table
SELECT safe_add_column('users', 'is_admin', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('users', 'is_onboarded', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('users', 'password', 'TEXT');

-- AI Providers table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ai_providers'
    ) THEN
        PERFORM safe_add_column('ai_providers', 'key_vaults', 'TEXT');
        PERFORM safe_add_column('ai_providers', 'source', 'VARCHAR(20)');
        PERFORM safe_add_column('ai_providers', 'settings', 'JSONB DEFAULT ''{}''::jsonb');
        PERFORM safe_add_column('ai_providers', 'config', 'JSONB DEFAULT ''{}''::jsonb');
    END IF;
END$$;

-- List all tables and their columns for verification
RAISE NOTICE '';
RAISE NOTICE '=== Current Database Schema ===';
RAISE NOTICE '';

-- Show agents_to_sessions structure
RAISE NOTICE 'Table: agents_to_sessions';
FOR r IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'agents_to_sessions'
    ORDER BY ordinal_position
LOOP
    RAISE NOTICE '  - %: % (nullable: %, default: %)', 
        r.column_name, r.data_type, r.is_nullable, r.column_default;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE 'Table: sessions';
FOR r IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'sessions'
    ORDER BY ordinal_position
LOOP
    RAISE NOTICE '  - %: % (nullable: %, default: %)', 
        r.column_name, r.data_type, r.is_nullable, r.column_default;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE 'Table: agents';
FOR r IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'agents'
    ORDER BY ordinal_position
LOOP
    RAISE NOTICE '  - %: % (nullable: %, default: %)', 
        r.column_name, r.data_type, r.is_nullable, r.column_default;
END LOOP;

-- Drop the temporary function
DROP FUNCTION IF EXISTS safe_add_column;

RAISE NOTICE '';
RAISE NOTICE '=== Schema fixes completed! ===';
SQLEOF

if [ $? -eq 0 ]; then
    success "Correções de schema aplicadas com sucesso!"
else
    error "Erro ao aplicar correções de schema!"
fi

echo ""
log "Verificando se há erros pendentes..."

# Test a simple query that was failing
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "
SELECT 
    s.id,
    s.title,
    ats.category
FROM sessions s
LEFT JOIN agents_to_sessions ats ON s.id = ats.session_id
LIMIT 1;
" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    success "✅ Consulta de teste executada com sucesso!"
else
    warn "⚠️  Consulta de teste falhou. Pode haver outros problemas."
fi

echo ""
echo "=============================================================================="
success "🎉 CORREÇÕES DE SCHEMA CONCLUÍDAS!"
echo "=============================================================================="
echo ""
echo "Próximos passos:"
echo "  1. Reinicie a aplicação: docker-compose restart app"
echo "  2. Verifique os logs: docker logs -f agents-chat"
echo ""
echo "Se continuar com erros, execute:"
echo "  ./setup-admin-environment.sh --rebuild"
echo ""