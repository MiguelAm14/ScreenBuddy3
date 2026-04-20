# 📱 Guía de Integración Nativa: Acceso a Lista de Apps

## Estado Actual

La app implementa la funcionalidad de acceso a lista de aplicaciones con:
- ✅ Manejo de permisos Android (`QUERY_ALL_PACKAGES`)
- ✅ Lista de apps de ejemplo como fallback
- ✅ Indicador de carga visual
- ✅ Mensajes de estado si se usa lista de ejemplo
- ✅ Soporte multiplataforma (iOS y Web usan fallback)

## Próximos Pasos: Integración Completa con Módulo Nativo

### Opción 1: Usar `react-native-device-info` (Recomendado para Expo)

1. **Instalar dependencia:**
   ```bash
   expo install react-native-device-info
   npx expo prebuild --clean
   ```

2. **Actualizar `appListService.js`:**
   ```js
   import DeviceInfo from 'react-native-device-info';
   
   // Dentro de getInstalledApps(), en Android:
   const installedPackages = await DeviceInfo.getInstalledPackages();
   ```

### Opción 2: Crear Módulo Nativo personalizado

#### Paso 1: Estructura del Módulo
```
android/
  app/
    src/
      main/
        java/
          com/
            anonymous/
              screenbuddy3/
                modules/
                  RNInstalledAppsModule.java
                  RNInstalledAppsPackage.java
```

#### Paso 2: `RNInstalledAppsModule.java`
```java
package com.anonymous.screenbuddy3.modules;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import java.util.List;

public class RNInstalledAppsModule extends ReactContextBaseJavaModule {

  public RNInstalledAppsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "RNInstalledApps";
  }

  @ReactMethod
  public void getInstalledApps(Promise promise) {
    try {
      WritableArray appsArray = new WritableNativeArray();
      PackageManager pm = getReactApplicationContext().getPackageManager();
      
      List<ApplicationInfo> packages = pm.getInstalledApplications(
        PackageManager.GET_META_DATA
      );

      for (ApplicationInfo packageInfo : packages) {
        // Filtrar solo apps de usuario, no del sistema
        if ((packageInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
          appsArray.pushString(packageInfo.packageName);
        }
      }

      promise.resolve(appsArray);
    } catch (Exception e) {
      promise.reject("ERR_INSTALLED_APPS", e.getMessage());
    }
  }
}
```

#### Paso 3: `RNInstalledAppsPackage.java`
```java
package com.anonymous.screenbuddy3.modules;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RNInstalledAppsPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new RNInstalledAppsModule(reactContext));
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
```

#### Paso 4: Registrar en `MainApplication.java`
```java
// En el método getPackages()
new RNInstalledAppsPackage(),
```

### Opción 3: Usar Expo Go con EAS Build

```bash
# Prebuild la app nativa
npx expo prebuild --clean

# Compilar para Android específicamente
eas build --platform android --local
```

---

## Testing de la Integración

1. **Verificar permisos:**
   - Ir a Configuración > Apps > ScreenBuddy3 > Permisos
   - Habilitar "Acceso a todas las apps" o "QUERY_ALL_PACKAGES"

2. **Debug:**
   ```bash
   adb logcat | grep RNInstalledApps
   ```

3. **En la app:**
   - La lista debe cargar la primera vez que entra a la pantalla SetBudget
   - Si no hay módulo nativo, mostrará el mensaje "⚠️ Usando lista de ejemplo"

---

## Manifesto Android Required

Ya está configurado en `app.json`:
```json
"permissions": [
  "android.permission.QUERY_ALL_PACKAGES",
  "android.permission.PACKAGE_USAGE_STATS",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.INTERNET",
  "android.permission.RECEIVE_BOOT_COMPLETED"
]
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `RNInstalledApps is undefined` | El módulo nativo no está registrado. Verificar `MainApplication.java` |
| Permiso no concedido en Android 12+ | Usar `requestQueryAppPermission()` antes de llamar a `getInstalledApps()` |
| Lista vacía | Asegurarse de que solo se filtren apps de usuario, no del sistema |
| App se congela al cargar | Las apps son muchas. Considerar paginación o virtualización |

---

## Arquitectura Actual

```
SetBudget.jsx
    ↓
useEffect → requestQueryAppPermission()
    ↓
getInstalledApps()
    ├─ Platform.OS === 'android' → intenta RNInstalledApps.getInstalledApps()
    ├─ Result → filtra monitorables de MONITOREABLE_APPS
    └─ Error → fallback a DEFAULT_APPS
    ↓
setApps() → render lista visual
```

---

## Siguiente Fase: Integración con UsageStatsManager

Una vez que se obtiene la lista de apps instaladas, el siguiente paso es:
1. Usar `UsageStatsManager` para obtener tiempo de uso por app
2. Crear servicio `usageService.js` para queries de uso
3. Integrar en pantalla Dashboard

Ver: `services/usageService.js` para la estructura base.
