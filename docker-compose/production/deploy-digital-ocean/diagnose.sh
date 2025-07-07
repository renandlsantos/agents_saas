#!/bin/bash

# ==============================================================================
# DIAGNÓSTICO DE SISTEMA - AGENTS CHAT
# ==============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=============================================================================="
echo "DIAGNÓSTICO DE SISTEMA - AGENTS CHAT"
echo "=============================================================================="

# Função para verificar sistema operacional
check_os() {
    log "Verificando sistema operacional..."
    echo "Distribuição: $(lsb_release -d | cut -f2)"
    echo "Versão: $(lsb_release -r | cut -f2)"
    echo "Arquitetura: $(uname -m)"
    echo "Kernel: $(uname -r)"
    echo
}

# Função para verificar recursos do sistema
check_resources() {
    log "Verificando recursos do sistema..."

    # CPU
    echo "=== CPU ==="
    echo "Processadores: $(nproc)"
    echo "Modelo: $(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo "Uso atual: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo

    # Memória
    echo "=== MEMÓRIA ==="
    free -h
    echo

    # Swap
    echo "=== SWAP ==="
    if swapon --show | grep -q "/swapfile"; then
        swapon --show
        success "Swap configurado"
    else
        warning "Swap não configurado"
    fi
    echo

    # Disco
    echo "=== DISCO ==="
    df -h
    echo

    # Verificar se há espaço suficiente
    available_space=$(df / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        error "Pouco espaço em disco: ${available_space}G disponível"
        warning "Recomendado: pelo menos 10GB livres"
    else
        success "Espaço em disco adequado: ${available_space}G disponível"
    fi
    echo
}

# Função para verificar Docker
check_docker() {
    log "Verificando Docker..."

    if command -v docker &> /dev/null; then
        echo "Versão Docker: $(docker --version)"
        echo "Status: $(systemctl is-active docker)"

        # Verificar se usuário está no grupo docker
        if groups | grep -q docker; then
            success "Usuário no grupo docker"
        else
            error "Usuário NÃO está no grupo docker"
            echo "Execute: sudo usermod -aG docker $USER"
        fi

        # Verificar daemon
        if docker info &> /dev/null; then
            success "Docker daemon funcionando"
        else
            error "Docker daemon não responde"
        fi

        # Verificar uso de recursos
        echo "=== USO DO DOCKER ==="
        docker system df
        echo

    else
        error "Docker não instalado"
    fi
    echo
}

# Função para verificar serviços
check_services() {
    log "Verificando serviços..."

    services=("docker" "nginx" "fail2ban" "ufw")

    for service in "${services[@]}"; do
        if systemctl list-unit-files | grep -q "$service.service"; then
            status=$(systemctl is-active "$service")
            if [ "$status" = "active" ]; then
                success "$service: ativo"
            else
                warning "$service: $status"
            fi
        else
            warning "$service: não instalado"
        fi
    done
    echo
}

# Função para verificar rede
check_network() {
    log "Verificando rede..."

    echo "=== INTERFACES DE REDE ==="
    ip addr show | grep -E "inet.*global" | awk '{print $2, $7}'
    echo

    echo "=== CONECTIVIDADE ==="
    if ping -c 1 8.8.8.8 &> /dev/null; then
        success "Conectividade com internet: OK"
    else
        error "Sem conectividade com internet"
    fi

    if ping -c 1 google.com &> /dev/null; then
        success "DNS funcionando: OK"
    else
        error "Problemas com DNS"
    fi
    echo

    echo "=== PORTAS ABERTAS ==="
    ss -tlnp | grep -E ":(80|443|22|3000)" || echo "Nenhuma porta relevante encontrada"
    echo
}

# Função para verificar projeto
check_project() {
    log "Verificando projeto Agents Chat..."

    PROJECT_DIR="/opt/agents-chat"

    if [ -d "$PROJECT_DIR" ]; then
        success "Diretório do projeto existe: $PROJECT_DIR"

        cd "$PROJECT_DIR"

        # Verificar se é um repositório git
        if [ -d ".git" ]; then
            echo "Branch atual: $(git branch --show-current)"
            echo "Último commit: $(git log -1 --oneline)"
            success "Repositório Git configurado"
        else
            warning "Não é um repositório Git"
        fi

        # Verificar Docker Compose
        if [ -f "docker-compose.yml" ]; then
            success "Docker Compose configurado"

            # Verificar status dos containers
            if command -v docker-compose &> /dev/null; then
                echo "=== STATUS DOS CONTAINERS ==="
                docker-compose ps 2>/dev/null || echo "Erro ao verificar containers"
            fi
        else
            warning "Docker Compose não configurado"
        fi

    else
        warning "Diretório do projeto não existe: $PROJECT_DIR"
    fi
    echo
}

# Função para verificar logs
check_logs() {
    log "Verificando logs recentes..."

    echo "=== LOGS DO SISTEMA (últimas 10 linhas) ==="

    # Docker logs
    if systemctl is-active docker &> /dev/null; then
        echo "--- Docker ---"
        sudo journalctl -u docker --no-pager -n 10
    fi

    # Nginx logs
    if systemctl is-active nginx &> /dev/null; then
        echo "--- Nginx ---"
        sudo journalctl -u nginx --no-pager -n 10
    fi

    echo
}

# Função para recomendações
provide_recommendations() {
    log "Recomendações baseadas no diagnóstico:"
    echo

    # Verificar memória
    total_ram=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$total_ram" -lt 2048 ]; then
        echo "🔴 RAM insuficiente (${total_ram}MB):"
        echo "   - Recomendado: 4GB+ para builds Docker"
        echo "   - Solução: Execute 'sudo ./setup-swap.sh'"
        echo "   - Ou use: './deploy-prebuilt.sh'"
        echo
    fi

    # Verificar swap
    if ! swapon --show | grep -q "/swapfile"; then
        echo "🟡 Swap não configurado:"
        echo "   - Recomendado para VMs com pouca RAM"
        echo "   - Execute: 'sudo ./setup-swap.sh'"
        echo
    fi

    # Verificar Docker
    if ! groups | grep -q docker; then
        echo "🔴 Usuário não está no grupo docker:"
        echo "   - Execute: 'sudo usermod -aG docker $USER'"
        echo "   - Depois: 'newgrp docker'"
        echo
    fi

    # Verificar espaço em disco
    available_space=$(df / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        echo "🟡 Pouco espaço em disco (${available_space}G):"
        echo "   - Limpe: 'docker system prune -a'"
        echo "   - Verifique: 'df -h'"
        echo
    fi

    echo "✅ Próximos passos recomendados:"
    echo "   1. Se RAM < 4GB: sudo ./setup-swap.sh"
    echo "   2. Deploy rápido: ./deploy-prebuilt.sh <dominio> <email>"
    echo "   3. Deploy completo: ./deploy-production.sh <dominio> <email>"
    echo
}

# Função principal
main() {
    check_os
    check_resources
    check_docker
    check_services
    check_network
    check_project
    check_logs
    provide_recommendations

    success "Diagnóstico concluído!"
}

# Executar diagnóstico
main
