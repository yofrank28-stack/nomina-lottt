#!/bin/bash
# Script para descargar y configurar Nómina LOTTT desde tu terminal local

echo "📦 Clonando el proyecto desde Kilo Builder..."
git clone https://builder.kiloapps.io/apps/5b1fd883-204e-47e0-8c01-dfdeed27ef16.git nomina-lottt

cd nomina-lottt

echo "🔗 Cambiando remote a GitHub..."
git remote set-url origin https://github.com/kuilo/nomina-lottt.git

echo ""
echo "=========================================="
echo "⚠️  PASOS PARA COMPLETAR EN GITHUB:"
echo "=========================================="
echo ""
echo "1. Crea un repositorio vacío en GitHub:"
echo "   https://github.com/new"
echo "   - Nombre: nomina-lottt"
echo "   - NO inicialices con README"
echo ""
echo "2. Desde tu terminal local, ejecuta:"
echo ""
echo "   cd nomina-lottt"
echo "   git push -u origin main"
echo ""
echo "3. Instala dependencias:"
echo "   npm install"
echo ""
echo "4. Inicia el servidor local:"
echo "   npm run dev"
echo ""
echo "5. Abre en tu navegador:"
echo "   http://localhost:3000"
echo ""
echo "=========================================="
echo "👤 USUARIOS DE DEMO:"
echo "=========================================="
echo "Admin Maestro: admin / Admin123!"
echo "Contador:      contador / Contador123!"
echo "=========================================="
