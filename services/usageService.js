import { Platform } from 'react-native';

/**
 * Obtiene datos reales de uso de apps desde PACKAGE_USAGE_STATS
 * NOTA: No disponible en Expo sin módulo nativo compilado
 * Retorna vacío para permitir fallback a datos aleatorios
 */
export async function getRealAppUsage(monitoredApps) {
  if (Platform.OS !== 'android') {
    console.warn('getRealAppUsage: Solo disponible en Android');
    return {};
  }

  // En Expo, PACKAGE_USAGE_STATS requiere módulo nativo preconstruido
  // Por ahora retornamos vacío para activar fallback
  console.info('PACKAGE_USAGE_STATS: Usando fallback a datos aleatorios');
  return {};
}

/**
 * Monitorea uso de apps en tiempo real con polling
 * Retorna unsubscribe function
 * Si no hay datos reales, usa fallback aleatorio
 */
export function subscribeToAppUsage(monitoredApps, intervalMs = 5000, onUpdate) {
  let isSubscribed = true;
  let timeoutId = null;

  const pollUsage = async () => {
    if (!isSubscribed) return;

    try {
      let usage = await getRealAppUsage(monitoredApps);
      
      // Si no hay datos reales (vacío), usar fallback aleatorio
      if (Object.keys(usage).length === 0) {
        console.warn('Sin datos reales, usando fallback aleatorio');
        usage = generateRandomUsage(monitoredApps, 120);
      }
      
      onUpdate(usage);
    } catch (error) {
      console.error('Error en polling de uso:', error);
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

// Genera datos aleatorios de uso por app (solo para testing/fallback)
export function generateRandomUsage(monitoredApps, totalMinutes) {
  const usage = {};
  
  // Generar un tiempo total aleatorio entre 0% y 100% de la meta
  const minTotalTime = 0;
  const maxTotalTime = totalMinutes;
  const randomTotal = Math.floor(Math.random() * (maxTotalTime - minTotalTime + 1)) + minTotalTime;
  
  let remaining = randomTotal;
  const appsCount = monitoredApps.length;

  // Distribuir el tiempo random entre las apps seleccionadas
  monitoredApps.forEach((app, index) => {
    if (index === appsCount - 1) {
      // La última app obtiene exactamente lo que queda del tiempo aleatorio
      usage[app.packageName] = Math.max(0, remaining);
    } else {
      if (remaining <= 0) {
        usage[app.packageName] = 0;
      } else {
        // Calcula el máximo que puede tomar esta app (50% del tiempo restante)
        const maxForThisApp = Math.max(1, Math.floor(remaining / 2));
        
        // Minuto aleatorio entre 1 y el máximo calculado
        const randomMinutes = Math.floor(Math.random() * maxForThisApp) + 1;
        
        usage[app.packageName] = randomMinutes;
        remaining -= randomMinutes;
      }
    }
  });

  return usage;
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
