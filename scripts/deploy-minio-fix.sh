#!/bin/bash

echo "🚀 Aplicando correção do MinIO HTTPS no servidor..."

# Comandos para executar no servidor
SSH_COMMANDS='
cd /root/agents_saas

echo "📦 Atualizando código..."
git pull

echo "🔨 Reconstruindo aplicação com a correção..."
docker-compose build app

echo "🔄 Reiniciando aplicação..."
docker-compose stop app
docker-compose up -d app

echo "⏳ Aguardando aplicação iniciar..."
sleep 10

echo "✅ Verificando se aplicação está rodando..."
docker-compose ps app

echo "📝 Verificando logs para erros..."
docker-compose logs --tail=50 app | grep -i "error\|warn" || echo "✅ Sem erros aparentes"
'

# Executar no servidor
echo "🔗 Conectando ao servidor..."
ssh root@64.23.166.36 "$SSH_COMMANDS"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "2. Teste o upload de arquivo novamente"
echo "3. Se ainda der erro, execute:"
echo "   ssh root@64.23.166.36 'docker-compose logs -f app'"
echo ""
echo "💡 Dica: A correção substitui URLs HTTP por HTTPS automaticamente"