# 🚀 Quick Start: Testing Integración Nativa

## 5 Pasos para Ver la Funcionalidad en Android

### Paso 1️⃣ — Valida la Instalación Localmente
```bash
npm run test:native
```
**Resultado esperado:** Todos los tests pasan ✓

---

### Paso 2️⃣ — Abre la App en Android
```bash
npx expo run:android
```

**Requisitos:**
- Emulador Android corriendo o device conectado
- `adb devices` muestra tu device

**Si falla:**
- Emulador: Abre Android Studio → AVD Manager → Start emulator
- Device: Conecta con USB cable y habilita USB Debugging

---

### Paso 3️⃣ — Navega a SetBudget
Cuando la app cargue:
1. Ve a la pantalla de configuración (SetBudget)
2. Deberías ver un indicador de carga: 
   ```
   ◎ Cargando apps del sistema...
   ```

---

### Paso 4️⃣ — Otorga Permisos (si es Android 12+)
Aparecerá un popup:
```
¿Permitir a ScreenBuddy3 acceder a todas 
las aplicaciones?

┌─────────┐  ┌──────┐
│ RECHAZAR│  │PERMITIR│  ← TAP AQUÍ
└─────────┘  └──────┘
```

**TAP "PERMITIR"** para que funcione

---

### Paso 5️⃣ — Verifica el Resultado

#### ✅ Éxito (tienes apps instaladas)
```
┌─────────────────────────────────┐
│ 📱 Apps instaladas          [8] │
│ [Buscador]                      │
│ ☑ Instagram    com.instagram... │
│ ☑ TikTok       com.tiktok...    │
│ ☐ YouTube      com.youtube...   │
│ ☐ WhatsApp     com.whatsapp...  │
│ ☐ X (Twitter)  com.twitter...   │
│ ☑ Telegram     org.telegram...  │
│ ...                             │
└─────────────────────────────────┘
```

**Indica que:**
- ✓ Se obtuvo la lista real del sistema
- ✓ Se filtraron solo las instaladas
- ✓ La funcionalidad está working ✨

---

#### ⚠️ Fallback (permiso denegado o sin módulo)
```
┌─────────────────────────────────┐
│ 📱 Apps instaladas         [15] │
│ ⚠️ Usando lista de ejemplo       │
│ [Buscador]                      │
│ ☑ Instagram                     │
│ ☑ TikTok                        │
│ ☐ YouTube                       │
│ ☐ WhatsApp                      │
│ ...                             │
└─────────────────────────────────┘
```

**Indica que:**
- No se pudo acceder a lista nativa
- Se usa la lista de ejemplo (15 apps fijas)
- **Solución:** Ve a Settings → Apps → ScreenBuddy3 → Permisos → Permitir "Acceso a todas las aplicaciones"

---

## 🔍 Debug en Logcat

Para ver los logs internos:

```bash
adb logcat | grep -E "Se obtuvieron|Se filtraron|monitoreable|DeviceInfo"
```

**Ejemplos de logs:**
```
✓ Se obtuvieron 245 apps instaladas
✓ Se filtraron 8 apps monitoreables instaladas

o

⚠️ Permiso QUERY_ALL_PACKAGES no concedido, usando lista de ejemplo
```

---

## 📋 Checklist de Validación

- [ ] `npm run test:native` pasa
- [ ] `npx expo run:android` inicia sin errores
- [ ] SetBudget carga y muestra indicador
- [ ] No hay crash cuando se carga la lista
- [ ] Ve apps filtradasO fallback message
- [ ] Puede buscar y seleccionar apps
- [ ] Botón "Guardar presupuesto" funciona
- [ ] Guardó la configuración sin errores

---

## ⚡ Troubleshooting Rápido

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "Cargando..." infinito | DeviceInfo lento | Espera 5 seg o reinicia app |
| Muestra lista de ejemplo | Permiso denegado | Settings → Apps → ScreenBuddy3 → Permisos |
| App crashea | Error en código | Ver logcat: `adb logcat` |
| No se ven cambios | Caché | Haz: `npm run android` nuevamente |
| "No Android connected" | Device no detectado | Activa USB Debugging o inicia emulador |

---

## 💡 Qué Comprobar Si Todo Falla

1. **Emulador funciona:**
   ```bash
   adb shell pm list packages | head -20
   ```
   Debería mostrar apps del sistema

2. **Permisos en app.json:**
   ```bash
   grep -A 6 "permissions" app.json
   ```
   Debería mostrar `QUERY_ALL_PACKAGES`

3. **DeviceInfo instalado:**
   ```bash
   npm ls react-native-device-info
   ```
   Debería estar en node_modules

4. **Limpia todo y recompila:**
   ```bash
   rm -rf android .expo
   npx expo prebuild --clean
   npx expo run:android
   ```

---

## 📱 Datos Técnicos

- **API usada:** `react-native-device-info` (v15.0.2)
- **Permiso:** `android.permission.QUERY_ALL_PACKAGES`
- **Plataformas:** Android (DeviceInfo), iOS/Web (example list)
- **Fallback:** Automático si falla

---

## 🎯 Qué Esperar Después

1. Tienes la **lista de apps reales** (no ejemplo)
2. Puedes **seleccionar cuáles monitorear**
3. Puedes **configurar presupuesto de tiempo**
4. La app **guarda la configuración** en AsyncStorage
5. Próximo paso: Integrar `usageService.js` para obtener stats reales

---

## ✅ Éxito

Si ves las apps instaladas en tu emulador/device **sin la advertencia de fallback**, ¡la integración nativa está funcionando correctamente! 🎉

---

**Última actualización:** 14 de Abril, 2026  
**Para soporte:** Ver `NATIVE_IMPLEMENTATION_COMPLETE.md` o `SUMMARY.md`
