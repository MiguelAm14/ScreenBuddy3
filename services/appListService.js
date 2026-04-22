import { Platform, NativeModules, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import { MONITOREABLE_APPS_MAP } from './constants';
import React from 'react';

/**
 * DEFAULT_APPS - DESHABILITADO: usa apps del SO en lugar de ejemplos
 */
// export const DEFAULT_APPS = Object.values(MONITOREABLE_APPS_MAP).map((app, index) => ({
//   ...app,
//   selected: index < 2,
// }));

/**
 * Solicita el permiso QUERY_ALL_PACKAGES en Android
 * Retorna true si se concede el permiso
 */
export const requestQueryAppPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const result = await request(PERMISSIONS.ANDROID.QUERY_ALL_PACKAGES);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error al solicitar permiso QUERY_ALL_PACKAGES:', error);
    return false;
  }
};

/**
 * Verifica si PACKAGE_USAGE_STATS está permitido
 * En builds nativas Android, intenta usar el módulo UsageStatsModule
 * En Expo, retorna false (datos simulados)
 */
export const checkPackageUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const { UsageStatsModule } = NativeModules;
    console.log('🔍 Buscando UsageStatsModule...', UsageStatsModule ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (UsageStatsModule && typeof UsageStatsModule.getAppUsageStats === 'function') {
      console.info('✓ PACKAGE_USAGE_STATS: Módulo nativo disponible');
      return true;
    } else {
      console.warn('⚠️ UsageStatsModule existe pero getAppUsageStats no es función');
    }
  } catch (error) {
    console.warn('PACKAGE_USAGE_STATS: Módulo nativo no disponible', error.message);
  }
  
  return false;
};

/**
 * Solicita PACKAGE_USAGE_STATS y guía al usuario
 * NOTA: En Expo con React Native, esto es limitado.
 * Se muestra un alert informativo.
 */
export const requestPackageUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  return new Promise((resolve) => {
    Alert.alert(
      '📊 Monitoreo en Tiempo Real',
      'Para obtener datos REALES de uso de apps en tiempo real, ScreenBuddy necesitaría módulos nativos avanzados.\n\nPor ahora, el dashboard muestra datos simulados actualizados cada 5 segundos.\n\nEn futuras versiones implementaremos acceso a estadísticas reales.',
      [
        {
          text: 'Entendido',
          onPress: () => resolve(false),
          style: 'default',
        },
      ]
    );
  });
};

/**
 * Obtiene la lista de aplicaciones instaladas del sistema
 * Solo Android soportado. Web e iOS retornan array vacío.
 */
export const getInstalledApps = async () => {
  // En web no hay acceso a apps nativas
  if (Platform.OS === 'web') {
    console.log('Plataforma web: no hay acceso a apps');
    return [];
  }

  // En iOS, no hay acceso a lista de apps instaladas
  if (Platform.OS === 'ios') {
    console.log('Plataforma iOS: no hay acceso a apps instaladas');
    return [];
  }

  // En Android, intentamos obtener la lista real de apps
  if (Platform.OS === 'android') {
    try {
      console.log('🔍 [DEBUG] Iniciando getInstalledApps en Android...');
      
      // PASO 1: Verificar versión Android
      const androidVersion = await DeviceInfo.getApiLevel();
      console.log(`📱 API Level: ${androidVersion}`);
      
      // PASO 2: Solicitar permiso PROACTIVAMENTE (no esperar a que falle)
      console.log('📋 Solicitando QUERY_ALL_PACKAGES...');
      const permissionGranted = await requestQueryAppPermission();
      console.log(`🔐 Permiso QUERY_ALL_PACKAGES: ${permissionGranted ? 'OTORGADO ✓' : 'DENEGADO ✗'}`);
      
      // PASO 3: Obtener packages
      let installedPackages = [];
      try {
        console.log('🚀 Llamando DeviceInfo.getInstalledPackages()...');
        installedPackages = await DeviceInfo.getInstalledPackages();
        console.log(`✓ DeviceInfo retornó: ${Array.isArray(installedPackages) ? installedPackages.length : 'NO ARRAY'} items`);
        
        // DEBUG: mostrar primeras 5 apps
        if (installedPackages.length > 0) {
          console.log('📦 Primeras 5 apps:', installedPackages.slice(0, 5));
        }
      } catch (deviceInfoError) {
        console.warn('❌ Error en DeviceInfo.getInstalledPackages():', deviceInfoError);
        console.warn('   Message:', deviceInfoError.message);
        console.warn('   Stack:', deviceInfoError.stack);
      }

      if (!installedPackages || installedPackages.length === 0) {
        console.warn('⚠️  PROBLEMA: getInstalledPackages retornó vacío');
        console.warn('   Si permiso=true y result=[], es problema de linking/build');
        console.warn('   Si permiso=false, usuario no otorgó permiso');
        return [];
      }

      // DeviceInfo.getInstalledPackages retorna array de strings (packageNames)
      const packageNames = installedPackages.map(pkg => 
        typeof pkg === 'string' ? pkg : (pkg.packageName || pkg)
      ).filter(Boolean);

      // Mapear todas las apps instaladas y agregar la información de MONITOREABLE_APPS si coincide
      const allInstalledApps = packageNames.map(pkgName => {
        const defaultApp = MONITOREABLE_APPS_MAP[pkgName];
        return defaultApp ? { ...defaultApp, installed: true } : { 
          name: pkgName, // Usar el nombre del paquete si no está en MONITOREABLE_APPS
          packageName: pkgName, 
          icon: '📱', // Icono genérico
          color: '#CCCCCC', // Color genérico
          installed: true 
        };
      });

      // También agregar las MONITOREABLE_APPS que no estaban instaladas pero son monitoreables
      const finalApps = [...allInstalledApps];
      Object.values(MONITOREABLE_APPS_MAP).forEach(defaultApp => {
        if (!finalApps.some(app => app.packageName === defaultApp.packageName)) {
          finalApps.push({ ...defaultApp, installed: false });
        }
      });

      console.log(`✓ Se obtuvieron ${finalApps.length} apps disponibles (instaladas o monitoreables por defecto)`);
      return finalApps.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente

    } catch (error) {
      console.error('Error inesperado al obtener apps instaladas:', error);
      return [];
    }
  }

  // Plataforma desconocida
  return [];
};

/**
 * Hook para obtener la lista de apps con estado de carga
 * Uso: const { apps, loading, error } = useInstalledApps();
 */
export const useInstalledApps = () => {
  const [apps, setApps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);
        const loadedApps = await getInstalledApps();
        setApps(loadedApps);
      } catch (err) {
        setError(err);
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  return { apps, loading, error };
};

/**
 * DIAGNÓSTICO: Prueba completa del estado del módulo DeviceInfo
 * Útil para debugging
 */
export const diagnoseDeviceInfo = async () => {
  const diagnosis = {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  if (Platform.OS !== 'android') {
    diagnosis.checks.platform = '❌ No es Android';
    return diagnosis;
  }

  try {
    // Check 1: Módulo existe
    const hasGetInstalledPackages = typeof DeviceInfo.getInstalledPackages === 'function';
    diagnosis.checks.moduleLoaded = hasGetInstalledPackages ? '✓' : '❌ Módulo no cargado';
    
    // Check 2: API Level
    const apiLevel = await DeviceInfo.getApiLevel();
    diagnosis.checks.apiLevel = `${apiLevel} (${apiLevel >= 30 ? 'Android 11+' : 'Android <11'})`;
    
    // Check 3: Permiso
    const permGranted = await requestQueryAppPermission();
    diagnosis.checks.permission = permGranted ? '✓ Otorgado' : '❌ Denegado';
    
    // Check 4: Llamada a getInstalledPackages
    try {
      const packages = await DeviceInfo.getInstalledPackages();
      diagnosis.checks.getInstalledPackages = Array.isArray(packages) ? 
        `✓ Retornó ${packages.length} paquetes` : 
        `❌ Retornó tipo ${typeof packages}`;
    } catch (e) {
      diagnosis.checks.getInstalledPackages = `❌ Error: ${e.message}`;
    }
    
  } catch (error) {
    diagnosis.checks.error = error.message;
  }

  return diagnosis;
};

export default {
  getInstalledApps,
  requestQueryAppPermission,
  checkPackageUsageStatsPermission,
  requestPackageUsageStatsPermission,
};
