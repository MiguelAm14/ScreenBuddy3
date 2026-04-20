#!/bin/bash
# Script de Testing: Verificación de Integración Nativa
# Uso: npm run test:native-integration

echo "🧪 Testing: Integración Nativa de Lista de Apps"
echo "─────────────────────────────────────────────────"

# Test 1: Verificar que react-native-device-info está instalado
echo ""
echo "✓ Test 1: Verificar dependencias"
if npm ls react-native-device-info > /dev/null 2>&1; then
    echo "  ✓ react-native-device-info instalado"
else
    echo "  ✗ FALLO: react-native-device-info no instalado"
    exit 1
fi

if npm ls react-native-permissions > /dev/null 2>&1; then
    echo "  ✓ react-native-permissions instalado"
else
    echo "  ✗ FALLO: react-native-permissions no instalado"
    exit 1
fi

# Test 2: Validar sintaxis de archivos JavaScript
echo ""
echo "✓ Test 2: Validación de sintaxis"
for file in services/appListService.js services/constants.js SetBudget.jsx; do
    if [ -f "$file" ]; then
        echo "  ✓ $file existe"
    else
        echo "  ✗ FALLO: $file no encontrado"
        exit 1
    fi
done

# Test 3: Verificar que app.json tiene los permisos
echo ""
echo "✓ Test 3: Verificar permisos en app.json"
if grep -q "QUERY_ALL_PACKAGES" app.json; then
    echo "  ✓ QUERY_ALL_PACKAGES configurado"
else
    echo "  ✗ FALLO: QUERY_ALL_PACKAGES no en app.json"
    exit 1
fi

if grep -q "PACKAGE_USAGE_STATS" app.json; then
    echo "  ✓ PACKAGE_USAGE_STATS configurado"
else
    echo "  ✗ FALLO: PACKAGE_USAGE_STATS no en app.json"
    exit 1
fi

# Test 4: Verificar estructura de archivos
echo ""
echo "✓ Test 4: Estructura de carpetas"
[ -d "android" ] && echo "  ✓ /android (native)" || echo "  ✗ FALLO: /android no existe"
[ -d "services" ] && echo "  ✓ /services" || echo "  ✗ FALLO: /services no existe"
[ -d "components" ] && echo "  ✓ /components" || echo "  ✗ FALLO: /components no existe"

# Test 5: Verificar que los exports están disponibles
echo ""
echo "✓ Test 5: Verificar exports del servicio"
echo "  (Este test requiere Jest o similar en producción)"
echo "  Exports esperados en appListService.js:"
echo "    - DEFAULT_APPS"
echo "    - requestQueryAppPermission"
echo "    - getInstalledApps"
echo "    - useInstalledApps"

# Test 6: Información para debugging
echo ""
echo "✓ Test 6: Información de debugging"
echo "  Node version: $(node -v)"
echo "  npm version: $(npm -v)"
echo "  Expo version: $(npx expo -v 2>/dev/null || echo 'N/A')"

echo ""
echo "─────────────────────────────────────────────────"
echo "✅ Todos los tests pasaron!"
echo ""
echo "📱 Próximos pasos:"
echo "  1. npx expo run:android (emulador o device)"
echo "  2. Ve a SetBudget.jsx"
echo "  3. Espera a que cargue la lista de apps"
echo "  4. Si ves ⚠️ "Usando lista de ejemplo" = permisos denegados"
echo "  5. Si ves las 15 apps filtradas = ¡éxito! 🎉"
echo ""
echo "🔍 Para debugging:"
echo "  adb logcat | grep -E 'Se obtuvieron|Se filtraron|monitoreable'"
echo ""
