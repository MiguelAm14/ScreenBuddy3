import { Platform, NativeModules } from 'react-native';

/**
 * Obtiene datos reales de uso de apps desde PACKAGE_USAGE_STATS
 * Intenta usar módulo nativo UsageStatsModule
 * Fallback a datos aleatorios si no está disponible
 */
export async function getRealAppUsage(monitoredApps) {
  if (Platform.OS !== 'android') {
    console.warn('getRealAppUsage: Solo disponible en Android');
    return {};
  }

  try {
    const { UsageStatsModule } = NativeModules;
    console.log('🔍 Buscando UsageStatsModule...', UsageStatsModule ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (UsageStatsModule && typeof UsageStatsModule.getAppUsageStats === 'function') {
      const packageNames = monitoredApps.map(app => app.packageName);
      const usage = await UsageStatsModule.getAppUsageStats(packageNames);
      console.info('✓ PACKAGE_USAGE_STATS: Datos reales obtenidos', Object.keys(usage).length, 'apps');
      return usage || {};
    }
  } catch (error) {
    console.warn('Error al obtener datos reales:', error.message);
  }

  console.info('PACKAGE_USAGE_STATS: Usando fallback a datos aleatorios');
  return {};
}

/**
 * Monitorea uso de apps en tiempo real con polling
 * Retorna unsubscribe function
 * NOTA: Si no hay datos reales, retorna {} (no fallback a datos aleatorios)
 */
export function subscribeToAppUsage(monitoredApps, intervalMs = 10000, onUpdate) {
  let isSubscribed = true;
  let timeoutId = null;

  const pollUsage = async () => {
    if (!isSubscribed) return;

    try {
      const usage = await getRealAppUsage(monitoredApps);
      // Retorna datos reales o {} vacío
      // NO usa fallback a datos aleatorios
      onUpdate(usage);
    } catch (error) {
      console.error('Error en polling de uso:', error);
      onUpdate({}); // En error, retornar vacío
    }

    if (isSubscribed) {
      timeoutId = setTimeout(pollUsage, intervalMs);
    }
  };

  // Iniciar polling inmediatamente
  pollUsage();

  // Retornar función para unsubscribirse
  return () => {
    isSubscribed = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}


// Calcula el porcentaje de la meta cumplida
export function calculateUsagePercentage(currentMinutes, budgetMinutes) {
  return Math.round((currentMinutes / budgetMinutes) * 100);
}

// Determina el estado del avatar según el porcentaje
export function getAvatarState(percentage) {
  if (percentage < 50) return { state: 'happy',    emoji: '😊', color: '#4CAF50' };
  if (percentage < 80) return { state: 'normal',   emoji: '😐', color: '#FFC107' };
  if (percentage < 100) return { state: 'warning', emoji: '😰', color: '#FF9800' };
  return { state: 'critical', emoji: '😵', color: '#F44336' };
}

// Obtiene el tiempo total usado de todas las apps
export function getTotalUsageTime(usageByApp) {
  return Object.values(usageByApp).reduce((sum, minutes) => sum + minutes, 0);
}
