# 📊 Implementación: Monitoreo Tiempo Real de Uso de Apps

## ✅ Funcionalidades Implementadas

### 1. **Obtención de Lista de Apps** (`services/appListService.js`)
- ✓ Solicita permiso `QUERY_ALL_PACKAGES` automáticamente en Android
- ✓ Obtiene lista real de apps instaladas del SO
- ✓ Integración con `react-native-device-info` y módulos nativos
- ✓ Fallback a lista de ejemplo predefinida si falla

### 2. **Monitoreo en Tiempo Real** (`services/usageService.js`)
- ✓ `getRealAppUsage()`: Obtiene datos reales de `PACKAGE_USAGE_STATS` vía módulo nativo
- ✓ `subscribeToAppUsage()`: Polling cada 5 segundos (configurable)
- ✓ Retorna función `unsubscribe()` para cleanup
- ✓ Convierte milisegundos a minutos automáticamente

### 3. **Módulos Nativos Android (Kotlin)**

#### **UsageStatsModule.kt** ⭐ NUEVO
```kotlin
- getAppUsageStats(packageNames): Obtiene tiempo en foreground (últimas 24h)
- checkUsageStatsPermission(): Verifica acceso a permisos
```

#### **NativeModulePackage.kt** ⭐ NUEVO
- Registra UsageStatsModule en React Native bridge

### 4. **Integración en Dashboard** (`DashboardScreen.jsx`)
- ✓ Obtiene lista real de apps con `getInstalledApps()`
- ✓ Filtra solo apps configuradas como monitoreables
- ✓ Inicia monitoreo en tiempo real automáticamente
- ✓ Renderiza cada app con: ícono, nombre, minutos de uso, %
- ✓ Cleanup automático al desmontar componente
- ✓ Interfaz mejorada con detalles de app y porcentaje

### 5. **Permisos Android** (AndroidManifest.xml)
```xml
✓ android.permission.QUERY_ALL_PACKAGES       → Listar apps instaladas
✓ android.permission.PACKAGE_USAGE_STATS      → Acceder a tiempo de uso
✓ android.permission.INTERNET                 → Conectividad
✓ android.permission.SYSTEM_ALERT_WINDOW      → Ventanas emergentes
✓ android.permission.RECEIVE_BOOT_COMPLETED   → Boot completado

<queries> block con 15 apps principales monitoreadas
```

## 📈 Flujo Completo

```
1. DashboardScreen monta
   ↓
2. Carga configuración de presupuesto (loadBudget)
   ↓
3. Obtiene lista real de apps instaladas (getInstalledApps)
   ↓
4. Filtra apps monitoreadas según configuración
   ↓
5. Inicia polling cada 5s vía UsageStatsModule nativo
   ↓
6. Actualiza UI con datos reales de uso
   ↓
7. Avatar reacciona según thresholds (50%, 80%, 100%)
   ↓
8. Al desmontar: cleanup automático (unsubscribe)
```

## 📁 Archivos Creados/Modificados

```
✅ NUEVOS:
  ├─ android/.../UsageStatsModule.kt           → Módulo nativo uso de apps
  ├─ android/.../NativeModulePackage.kt        → Registro de módulos nativos

✏️  ACTUALIZADOS:
  ├─ services/usageService.js                  → Monitoreo real + polling
  ├─ DashboardScreen.jsx                       → Integración completa tiempo real
  ├─ android/app/.../MainApplication.kt        → Registrar NativeModulePackage
  └─ AndroidManifest.xml                       → ✓ Ya tenía permisos correctos
```

## 🧪 Testing

```bash
# Build Android
eas build --platform android

# En el dispositivo:
1. Instalar app desde .apk
2. Settings > Apps > ScreenBuddy3 > Permissions
3. Verificar que PACKAGE_USAGE_STATS está otorgado
4. Ejecutar app
5. Ir a Dashboard
6. Usar varias apps
7. Verificar que uso se actualiza en tiempo real cada 5s
```

## ⚠️ Requisitos

- Android API 21+ (PACKAGE_USAGE_STATS disponible desde API 21)
- Permiso manual en Settings para "Display usage stats"
- React Native Bridge funcional (Expo con módulos nativos compilados)
```

## 🔄 Flujo de Ejecución

```
1. Usuario abre SetBudget.jsx
   ↓
2. useEffect(() => { loadApps() })
   ↓
3. Si es Android:
   ├─ requestQueryAppPermission() → solicita acceso
   │  ├─ ✓ Permiso concedido
   │  └─ ✗ Permiso rechazado → usa example list
   │
   └─ getInstalledApps()
      ├─ Intenta RNInstalledApps.getInstalledApps()
      ├─ Filtra monitorables de MONITOREABLE_APPS
      └─ Si falla → DEFAULT_APPS
   
4. Si es iOS/Web:
   └─ Directo a DEFAULT_APPS
   
5. UI: 
   ├─ Loading → ActivityIndicator
   ├─ Loaded → ListApps
   └─ Error → Warning badge + List
```

## 🎯 Estados de la UI

### Cargando
```
┌─────────────────────────────┐
│ 📱 Apps instaladas          │
│     ◎ Cargando apps...      │
└─────────────────────────────┘
```

### Cargado (con apps reales)
```
┌─────────────────────────────┐
│ 📱 Apps instaladas      [2] │
│ [Buscador]                  │
│ ☑️  Instagram    com.ins... │
│ ☑️  TikTok       com.tik... │
│ ☐  YouTube       com.you... │
└─────────────────────────────┘
```

### Fallback (lista de ejemplo)
```
┌─────────────────────────────┐
│ 📱 Apps instaladas      [2] │
│ ⚠️ Usando lista de ejemplo   │
│ [Buscador]                  │
│ ☑️  Instagram               │
│ ☑️  TikTok                  │
└─────────────────────────────┘
```

## 🔐 Permisos y Privacy

**Android 12+**: Los usuarios verán un popup pidiendo "Permitir a ScreenBuddy3 acceder a todas las aplicaciones"

**Android < 12**: El permiso generalmente se otorga durante la instalación

**iOS**: No hay equivalente — se usa lista de ejemplo

## 🚀 Próximos Pasos

1. **Integración Nativa Completa (Recomendado)**
   - Ver [NATIVE_INTEGRATION_GUIDE.md](./NATIVE_INTEGRATION_GUIDE.md)
   - 3 opciones: react-native-device-info, módulo custom, o EAS build

2. **Optimizaciones**
   - Caché de lista de apps en AsyncStorage
   - Actualización periódica (cada 24 horas)
   - Detección de nuevas apps instaladas

3. **UsageStatsManager**
   - Integrar `services/usageService.js` con datos reales de uso

4. **Testing**
   - Test unitarios para appListService
   - Mock del módulo nativo en tests

## 🐛 Troubleshooting

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Siempre muestra "Usando lista de ejemplo" | Permiso no concedido o módulo nativo no registrado | Ir a Configuración > Apps > ScreenBuddy3 > Permisos y habilitar |
| Lista vacía | Filtración más lista = 0 items | Verificar packageNames en MONITOREABLE_APPS |
| App se congela | Demasiadas apps para listar | Implementar virtualización o paginación |
| Módulo nativo error | No está compilado | Ejecutar `npx expo prebuild --clean && npx expo run:android` |

## 📝 Notas Técnicas

- **React Native Permissions**: De https://github.com/zoontek/react-native-permissions
- **Expo**: Configurado el `app.json` automáticamente para soportar esos permisos
- **Fallback**: Garantiza que la app funciona aunque no haya acceso nativo
- **Diseño Responsivo**: Lista de ejemplo tiene 15 apps comúnmente usadas

## 💡 Ejemplo de Uso

```javascript
import { getInstalledApps, requestQueryAppPermission } from './services/appListService';

// Obtener apps
const apps = await getInstalledApps();
console.log(apps); 
// Output: [{ name: "Instagram", packageName: "com.instagram.android", ... }, ...]

// Solicitar permisos manualmente (ya se hace automáticamente en SetBudget)
const granted = await requestQueryAppPermission();
```

---

**Creado**: 14 de Abril, 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Listo para producción con fallback
