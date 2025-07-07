#!/bin/bash

# ==============================================================================
# CONFIGURAÇÃO DE SWAP E OTIMIZAÇÃO PARA BUILD DOCKER
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

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

echo "=============================================================================="
echo "CONFIGURAÇÃO DE SWAP E OTIMIZAÇÃO PARA BUILD DOCKER"
echo "=============================================================================="

# Verificar memória atual
log "Verificando memória atual..."
free -h

# Verificar se já existe swap
if swapon --show | grep -q "/swapfile"; then
    warning "Swap já está configurado:"
    swapon --show
    read -p "Deseja reconfigurar o swap? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Mantendo configuração atual"
        exit 0
    fi

    # Desativar swap atual
    log "Desativando swap atual..."
    swapoff /swapfile
    rm -f /swapfile
fi

# Calcular tamanho do swap baseado na RAM
total_ram=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$total_ram" -lt 2048 ]; then
    swap_size="4G"
    log "RAM baixa (${total_ram}MB), configurando swap de 4GB"
elif [ "$total_ram" -lt 4096 ]; then
    swap_size="2G"
    log "RAM moderada (${total_ram}MB), configurando swap de 2GB"
else
    swap_size="1G"
    log "RAM adequada (${total_ram}MB), configurando swap de 1GB"
fi

# Criar arquivo de swap
log "Criando arquivo de swap de $swap_size..."
fallocate -l $swap_size /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Configurar swap permanente
log "Configurando swap permanente..."
if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    success "Swap adicionado ao /etc/fstab"
else
    warning "Swap já está no /etc/fstab"
fi

# Otimizar configurações do sistema
log "Otimizando configurações do sistema..."

# Configurar swappiness
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness = 10" >> /etc/sysctl.conf
    sysctl vm.swappiness=10
    success "Swappiness configurado para 10"
else
    warning "Swappiness já está configurado"
fi

# Configurar vfs_cache_pressure
if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
    echo "vm.vfs_cache_pressure = 50" >> /etc/sysctl.conf
    sysctl vm.vfs_cache_pressure=50
    success "VFS cache pressure configurado"
else
    warning "VFS cache pressure já está configurado"
fi

# Configurar Docker para usar menos memória
log "Configurando Docker..."
mkdir -p /etc/docker

# Criar ou atualizar daemon.json
cat > /etc/docker/daemon.json << EOF
{
  "default-ulimits": {
    "nofile": {
      "Hard": 64000,
      "Name": "nofile",
      "Soft": 64000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF

# Reiniciar Docker
log "Reiniciando Docker..."
systemctl restart docker

# Verificar configuração final
log "Verificando configuração final..."
echo
echo "=== MEMÓRIA E SWAP ==="
free -h
echo
echo "=== SWAP ATIVO ==="
swapon --show
echo
echo "=== CONFIGURAÇÕES DO SISTEMA ==="
echo "Swappiness: $(sysctl -n vm.swappiness)"
echo "VFS Cache Pressure: $(sysctl -n vm.vfs_cache_pressure)"
echo
echo "=== DOCKER STATUS ==="
systemctl status docker --no-pager -l

success "Configuração concluída!"
echo
log "Próximos passos:"
log "1. Execute o script de deploy: ./deploy-production.sh"
log "2. Se ainda houver problemas de memória, considere:"
log "   - Aumentar a RAM da VM"
log "   - Usar imagem pré-construída"
log "   - Fazer build em uma máquina mais potente"
