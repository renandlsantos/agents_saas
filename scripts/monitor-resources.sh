#!/bin/bash

# Script para monitorar recursos em tempo real

echo "📊 Monitoramento de Recursos - Lobe Chat"
echo "========================================"
echo "Pressione Ctrl+C para sair"
echo ""

while true; do
    clear
    echo "📊 MONITORAMENTO DE RECURSOS - $(date)"
    echo "========================================"
    
    # Memória do sistema
    echo ""
    echo "💾 MEMÓRIA DO SISTEMA:"
    free -h | grep -E "^(Mem|Swap)" | awk '{printf "%-10s Total: %-10s Usado: %-10s Livre: %-10s\n", $1, $2, $3, $4}'
    
    # Uso por container
    echo ""
    echo "🐳 USO POR CONTAINER:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -20
    
    # Espaço em disco
    echo ""
    echo "💿 ESPAÇO EM DISCO:"
    df -h | grep -E "(^/dev/|Filesystem)" | awk '{printf "%-30s %-10s %-10s %-10s %-10s\n", $1, $2, $3, $4, $5}'
    
    # Alertas
    echo ""
    echo "⚠️  ALERTAS:"
    
    # Verificar memória livre
    FREE_MEM=$(free -m | awk '/^Mem:/{print $7}')
    if [ "$FREE_MEM" -lt 1000 ]; then
        echo "   🚨 CRÍTICO: Menos de 1GB de memória livre!"
    elif [ "$FREE_MEM" -lt 2000 ]; then
        echo "   ⚠️  AVISO: Menos de 2GB de memória livre"
    else
        echo "   ✅ Memória OK"
    fi
    
    # Verificar swap
    SWAP_USED=$(free -m | awk '/^Swap:/{print $3}')
    if [ "$SWAP_USED" -gt 1000 ]; then
        echo "   ⚠️  AVISO: Alto uso de swap (${SWAP_USED}MB)"
    fi
    
    sleep 5
done