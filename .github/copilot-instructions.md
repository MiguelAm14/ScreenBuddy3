# App de Monitoreo de Tiempo en Pantalla

## ¿Qué es este proyecto?
Aplicación móvil que permite a los usuarios definir un presupuesto de tiempo diario para apps de redes sociales. La app monitorea el uso en tiempo real y reacciona visualmente según el consumo: muestra un avatar animado que cambia de estado emocional conforme el usuario se acerca o supera su límite definido.

---

## Equipo
- Somos 3 desarrolladores trabajando sobre el mismo repositorio

---

## Stack Técnico
- **Framework:** React Native con Expo
- **Plataforma objetivo:** Android primero, luego iOS
- **Animaciones:** Lottie (`lottie-react-native`) con archivos JSON — por confirmar
- **Almacenamiento local:** AsyncStorage
- **Base de datos remota:** Firebase Realtime Database
- **API nativa Android:** UsageStatsManager (vía módulo nativo o librería)
- **Monitoreo en background:** La app sigue recolectando tiempo de uso aunque esté cerrada, usando un servicio en segundo plano con UsageStatsManager
- **Notificaciones:** Expo Notifications

---

## Estructura de Carpetas
Esta es la estructura actual del proyecto. Respetarla y extenderla, no reorganizarla.

```
/assets                 → Íconos y recursos estáticos de la app
/components             → Componentes reutilizables de UI
  AppRow.jsx            → Fila de una app en la lista de selección
  BudgetSlider.jsx      → Slider para definir el presupuesto de tiempo
/services               → Lógica de negocio
  budgetService.js      → onSet_Budget() y cálculo de umbrales
/.github
  copilot-instructions.md
App.js                  → Punto de entrada de la app
SetBudget.jsx           → Pantalla de configuración inicial
index.js                → Entry point de Expo
```

Conforme crezca el proyecto, agregar nuevas pantallas como archivos `.jsx` en la raíz o dentro de una carpeta `/screens`, y nuevos servicios dentro de `/services`.

---

## Funcionalidad Principal: onSet_Budget()

Esta es la función central de la pantalla de configuración.

**Firma:**
```js
onSet_Budget(totalMinutes, selectedApps[]) → budgetConfig{}
```

**Lógica de umbrales:**
```js
budgetConfig = {
  totalMinutes: 120,
  thresholds: {
    warn:  totalMinutes * 0.50,   // 50% → Aviso
    alert: totalMinutes * 0.80,   // 80% → Alerta
    limit: totalMinutes * 1.00,   // 100% → Límite
  },
  monitoredApps: ["com.instagram.android", "com.zhiliaoapp.tiktok"],
  savedAt: new Date().toISOString()
}
```

Se persiste en AsyncStorage con la clave `"budgetConfig"`. El dashboard la lee constantemente para saber en qué estado mostrar el avatar o las gráficas.

---

## Eventos del Sistema a Implementar

| Evento | Descripción |
|--------|-------------|
| `ON_APP_OPENED` | El usuario abre una app de la lista negra → actualizar estado del avatar |
| `ON_THRESHOLD_REACHED` | Se llega al 50%, 80% o 100% → cambiar archivo Lottie |
| `ON_DATA_SYNC` | Se cierra la app de monitoreo → hacer POST a Firebase |
| `onSet_Budget` | Usuario guarda su configuración → calcular umbrales y guardar en AsyncStorage |
| `onUsageIncrement` | Cada 5 minutos de uso → el avatar cambia de expresión |
| `onTouchAvatar` | Usuario toca el avatar → mostrar speech bubble con frase |
| `onLimitReached` | Se llega al 100% dentro de una app prohibida → lanzar overlay |
| `onSyncData` | Usuario abre pantalla de historial → POST a Firebase con resumen del día |
| `onExportLog` | Botón oculto → exportar CSV local si falla la red |
| `BroadcastReceiver` | Pantalla encendida → consultar tiempo acumulado y actualizar estado |

---

## Lógica de Estados del Avatar 

```
(tiempoActual / meta) * 100 → porcentaje

< 50%    → avatar_happy.json    | fondo verde/azul
50–79%   → avatar_happy.json    | fondo verde (sin cambio aún)
80–99%   → avatar_warning.json  | fondo naranja | avatar suda y mira el reloj
≥ 100%   → avatar_dead.json     | fondo rojo vibrante | avatar cae y se pone gris
```

El avatar también es **cliqueable** → al tocarlo muestra un speech bubble con frases como:
- "¡Me siento genial, sigue así!"
- "¿De verdad necesitas ver otro reel? Me duele la cabeza."
- "Por favor cierra esa app, ya no aguanto."

---

## Pantallas de la App

### 1. Configuración Inicial (Onboarding)
- Slider circular para definir presupuesto de tiempo diario
- Lista de apps instaladas con checkboxes (muestra packageName)
- Botón para abrir el menú de Usage Access en Android
- Avatar en estado de meditación mientras el usuario configura
- Al guardar → ejecuta `onSet_Budget()` y muestra confirmación con umbrales calculados

### 2. Dashboard Principal
- **Header:** nombre de la app + selector de fecha
- **Zona central:** avatar Lottie ocupando el 50% de pantalla, cliqueable
- **Zona alternativa:** gráfica de barras (uso por hora) + gráfica de pastel (por app)
- **Panel inferior:** tiempo transcurrido vs. tiempo restante + botón de "Refrescar"
- El fondo de pantalla cambia de color según el estado actual

### 3. Overlay de Crisis
- Se activa cuando el usuario está dentro de una app prohibida y llega al límite
- Muestra el avatar llorando o "muriendo" en esquina de pantalla
- Alternativamente puede mostrar un banner con texto "Límite de tiempo alcanzado: X/X min"

### 4. Historial y Logros
- Calendario con cara del avatar por día (feliz = cumplió meta, calavera = falló)
- Al abrir esta pantalla → dispara `onSyncData` → POST a Firebase
- Botón oculto → `onExportLog` → exporta CSV local

---

## Firebase — Estructura de Datos

```json
{
  "usuarios": {
    "userID": {
      "grupo": "A" | "B",
      "logs": {
        "2026-03-23": {
          "totalMinutos": 95,
          "meta": 120,
          "porcentaje": 79.2,
          "nivelDolor": 1,
          "appsUsadas": {
            "com.instagram.android": 60,
            "com.zhiliaoapp.tiktok": 35
          }
        }
      }
    }
  }
}
```

---

## Apps Monitoreables (packageNames)

```js
const APPS_MONITOREABLES = [
  { nombre: "Instagram",  packageName: "com.instagram.android" },
  { nombre: "TikTok",     packageName: "com.zhiliaoapp.tiktok" },
  { nombre: "YouTube",    packageName: "com.google.android.youtube" },
  { nombre: "WhatsApp",   packageName: "com.whatsapp" },
  { nombre: "X (Twitter)",packageName: "com.twitter.android" },
  { nombre: "Snapchat",   packageName: "com.snapchat.android" },
  { nombre: "Facebook",   packageName: "com.facebook.katana" },
  { nombre: "Netflix",    packageName: "com.netflix.mediaclient" },
  { nombre: "Pinterest",  packageName: "com.pinterest" },
  { nombre: "Telegram",   packageName: "org.telegram.messenger" },
  { nombre: "BeReal",     packageName: "com.bereal.ft" },
]
```

---

## Convenciones de Código

- Idioma del código: **inglés** para variables y funciones, **español** para comentarios y UI
- Componentes en **PascalCase** → `AvatarDisplay.jsx`
- Funciones y variables en **camelCase** → `onSetBudget`, `budgetConfig`
- Archivos de pantalla con sufijo `Screen` → `ConfigScreen.jsx`, `DashboardScreen.jsx`
- Un componente por archivo, sin mezclar lógica y UI en el mismo archivo
- Extraer lógica de negocio a `/services` o `/hooks`, nunca dentro del componente
- Commits en español con formato: `tipo: descripción` (ej. `feat: agregar slider de presupuesto`)

---

## Lo que NO queremos

- No meter toda la lógica dentro de los componentes de pantalla
- No hardcodear packageNames ni umbrales fuera de `/constants`
- No omitir el manejo de errores en llamadas a Firebase o AsyncStorage
- No hacer un solo archivo enorme con todo — cada función en su lugar

---

## Estado Actual del Proyecto

El proyecto ya tiene código avanzado. **Antes de crear o modificar cualquier cosa, explora la estructura de carpetas y lee los archivos relevantes para entender qué ya está implementado.** No asumas que algo no existe — búscalo primero.

Si te piden implementar una feature, sigue este orden:
1. Revisa si ya existe algo relacionado en el proyecto
2. Si existe, extiéndelo o corrígelo
3. Si no existe, créalo siguiendo la estructura de carpetas definida arriba

---

## Permisos Android Necesarios

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```