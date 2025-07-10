-- =============================================================================
-- AGENTS CHAT - INICIALIZAÇÃO DE DATABASES
-- =============================================================================

-- Criar database para Agents Chat (Lobe Chat)
CREATE DATABASE agents_chat;

-- Criar database para Casdoor
CREATE DATABASE casdoor;

-- Conectar ao database agents_chat e instalar extensões necessárias
\c agents_chat;

-- Instalar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Instalar outras extensões que podem ser úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Conectar ao database casdoor para preparar para o Casdoor
\c casdoor;

-- Instalar extensões básicas para Casdoor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log de inicialização
\c postgres;
SELECT 'Databases agents_chat e casdoor criados com sucesso!' as status;