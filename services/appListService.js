import { Platform, NativeModules, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import { MONITOREABLE_APPS_MAP } from './constants';
import React from 'react';

/**
 * Lista de ejemplo de apps monitoreables
 * Se usa como fallback si no se pueden obtener las apps instaladas del sistema
 */
export const DEFAULT_APPS = Object.values(MONITOREABLE_APPS_MAP).map((app, index) => ({
  ...app,
  selected: index < 2,
}));

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
 * NOTA: En Expo, requiere módulo nativo. Por ahora retorna true.
 * El usuario debe habilitar manualmente en Settings si quiere datos reales.
 */
export const checkPackageUsageStatsPermission = async () => {
  // En Expo sin módulo nativo, no podemos verificar
  // Retornamos false para mostrar el warning al usuario
  console.info('PACKAGE_USAGE_STATS: Requiere módulo nativo (no disponible en Expo)');
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
 * Si no es posible acceder, retorna la lista de ejemplo predefinida
 */
export const getInstalledApps = async () => {
  // En web no hay acceso a apps nativas
  if (Platform.OS === 'web') {
    console.log('Plataforma web: usando lista de ejemplo');
    return DEFAULT_APPS;
  }

  // En iOS, usamos la lista de ejemplo (no hay acceso a lista de apps instaladas)
  if (Platform.OS === 'ios') {
    console.log('Plataforma iOS: usando lista de ejemplo');
    return DEFAULT_APPS;
  }

  // En Android, intentamos obtener la lista real de apps
  if (Platform.OS === 'android') {
    try {
      // Intentar obtener apps instaladas directamente
      // QUERY_ALL_PACKAGES es de "Especial acceso" y react-native-permissions
      // puede no manejarlo como un permiso normal de runtime en todas las versiones.
      // Con las <queries> en el Manifest, getInstalledPackages debería ver las apps listadas.
      
      let installedPackages = [];
      
      try {
        installedPackages = await DeviceInfo.getInstalledPackages();
        console.log(`✓ Se obtuvieron ${installedPackages.length} apps instaladas via DeviceInfo`);
      } catch (deviceInfoError) {
        console.warn('Error en DeviceInfo.getInstalledPackages():', deviceInfoError.message);
      }

      // Si falló DeviceInfo o regresó vacío, intentar con el permiso si es necesario
      if (installedPackages.length === 0) {
        console.log('Intentando solicitar permiso QUERY_ALL_PACKAGES...');
        const permissionGranted = await requestQueryAppPermission();
        
        if (permissionGranted) {
           try {
             installedPackages = await DeviceInfo.getInstalledPackages();
           } catch (e) {
             console.warn('Re-intento tras permiso falló');
           }
        }
      }
      
      // Fallback a NativeModules si sigue vacío
      if (installedPackages.length === 0) {
        try {
          const { RNInstalledApps } = NativeModules;
          if (RNInstalledApps && typeof RNInstalledApps.getInstalledApps === 'function') {
            installedPackages = await RNInstalledApps.getInstalledApps();
            console.log(`✓ Obtenidas apps vía RNInstalledApps: ${installedPackages.length}`);
          }
        } catch (nativeError) {
          console.warn('Fallback a módulo nativo falló:', nativeError.message);
        }
      }

      if (!installedPackages || installedPackages.length === 0) {
        console.warn('No se obtuvieron apps instaladas, usando lista de ejemplo');
        return DEFAULT_APPS;
      }

      // El resultado de getInstalledPackages puede ser un array de strings (nombres de paquetes)
      // o un array de objetos dependiendo de la versión/implementación.
      // Normalizamos a strings.
      const packageNames = installedPackages.map(pkg => 
        typeof pkg === 'string' ? pkg : pkg.packageName || pkg.bundleId
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
      console.log('Usando lista de ejemplo como fallback');
      return DEFAULT_APPS;
    }
  }

  // Fallback para plataformas desconocidas
  return DEFAULT_APPS;
};

/**
 * Hook para obtener la lista de apps con estado de carga
 * Uso: const { apps, loading, error } = useInstalledApps();
 */
export const useInstalledApps = () => {
  const [apps, setApps] = React.useState(DEFAULT_APPS);
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
        setApps(DEFAULT_APPS);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  return { apps, loading, error };
};

export default {
  getInstalledApps,
  requestQueryAppPermission,
  checkPackageUsageStatsPermission,
  requestPackageUsageStatsPermission,
  DEFAULT_APPS,
};
