# 🔍 Guía de Diagnóstico: getInstalledApps() retorna vacío

## PROBLEMA
`getInstalledApps()` retorna `[]` (array vacío) en lugar de las apps instaladas.

---

## ✅ SOLUCIÓN RÁPIDA: 3 PASOS

### Paso 1: Compilar limpio
```bash
expo run:android --clean
```
Esto recompila todo desde cero, asegurando que los permisos se incluyan correctamente.

### Paso 2: Usar botón de diagnóstico
En la app, ve a **SetBudget** y toca el botón `🔍 Diagnóstico`.

Verás un Alert con:
- `platform`: Should be `android`
- `apiLevel`: ≥30 requiere QUERY_ALL_PACKAGES
- `permission`: ✓ (otorgado) o ❌ (denegado)
- `getInstalledPackages`: ✓ X paquetes o ❌ Error

### Paso 3: Interpretar resultado

#### Escenario A: `permission: ❌ Denegado`
**Problema**: Usuario no otorgó el permiso
**Fix**: 
1. Abre **Configuración** > **Apps** > **ScreenBuddy3**
2. Toca **Permisos**
3. Activa **Leer lista de apps instaladas** (QUERY_ALL_PACKAGES)

#### Escenario B: `permission: ✓` pero `getInstalledPackages: ❌ Error`
**Problema**: Módulo nativo mal linkeado
**Fix**:
```bash
cd android && ./gradlew clean && cd ..
expo run:android
```

#### Escenario C: `permission: ✓` pero `getInstalledPackages: ✓ 0 paquetes`
**Problema**: Sistema bloquea acceso a lista de apps (Android 11+ sin permissions correctas)
**Fix**: Verificar que AndroidManifest generado por Expo contenga:
```xml
<queries>
  <intent>
    <action android:name="android.intent.action.MAIN"/>
    <category android:name="android.intent.category.LAUNCHER"/>
  </intent>
</queries>
```

---

## 🔧 DEBUG AVANZADO

### Ver logs en tiempo real
```bash
adb logcat -s ScreenBuddy
```

Busca estos patterns:
- `🔍 [DEBUG] Iniciando getInstalledApps en Android` → Se inició
- `📱 API Level: XX` → Versión Android
- `🔐 Permiso QUERY_ALL_PACKAGES` → Estado permiso
- `✓ DeviceInfo retornó: X items` → Número de paquetes

### Si ves errores
```
❌ Error en DeviceInfo.getInstalledPackages()
```

Esto significa el módulo nativo no se compiló correctamente. Intenta:
```bash
cd android
./gradlew clean
cd ..
expo prebuild --clean
expo run:android
```

---

## 📋 QUICK REFERENCE

| Resultado | Causa | Solución |
|-----------|-------|----------|
| `result: []` y `permission: true` | Linking roto | `expo run:android --clean` |
| `result: undefined` | Módulo no existe | Recompilar con `prebuild` |
| `permission: false` | Usuario no otorgó | Habilitar en Configuración |
| `error: 'Native module not found'` | Build incompleto | `gradlew clean && run:android` |

---

## 💡 NOTAS

- **Expo**: No soporta módulos nativos complejos. `DeviceInfo.getInstalledPackages()` requiere build nativo.
- **Android 11+ (API 30+)**: Requiere explícitamente `QUERY_ALL_PACKAGES` o `<queries>` en manifest.
- **Emulador vs Dispositivo**: Algunos emuladores tienen restricciones. Prueba en dispositivo físico si persiste el error.

---

## 🚀 Si todo falla

Última opción: Implementar fallback a lista de ejemplo
```javascript
// En appListService.js
if (installedPackages.length === 0) {
  console.warn('Usando DEFAULT_APPS como fallback');
  return Object.values(MONITOREABLE_APPS_MAP).map((app, idx) => ({
    ...app,
    installed: idx < 5 // Simular que algunas están instaladas
  }));
}
```
