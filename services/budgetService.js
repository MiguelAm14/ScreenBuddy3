import AsyncStorage from '@react-native-async-storage/async-storage';

// Calcula los 3 umbrales a partir del presupuesto elegido
export function calcThresholds(totalMinutes) {
  return {
    warn:  Math.round(totalMinutes * 0.50),  // 50%  → aviso
    alert: Math.round(totalMinutes * 0.80),  // 80%  → alerta
    limit: totalMinutes,                      // 100% → límite
  };
}

// Formatea minutos → { big: "2h", unit: "30m" }
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return { big: `${m}min`, unit: '' };
  if (m === 0) return { big: `${h}h`,   unit: '00m' };
  return { big: `${h}h`, unit: `${m}m` };
}

// Guarda la configuración en AsyncStorage
export async function saveBudget(totalMinutes, selectedApps) {
  const config = {
    totalMinutes,
    thresholds: calcThresholds(totalMinutes),
    monitoredApps: selectedApps
      .filter(a => a.selected)
      .map(a => a.packageName),
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem('budgetConfig', JSON.stringify(config));
  return config;
}

// Carga la configuración guardada
export async function loadBudget() {
  const raw = await AsyncStorage.getItem('budgetConfig');
  return raw ? JSON.parse(raw) : null;
}