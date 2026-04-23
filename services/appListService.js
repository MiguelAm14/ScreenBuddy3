import { Platform, NativeModules, Alert } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

let InstalledAppsModule;
try {
  InstalledAppsModule = requireNativeModule('InstalledAppsModule');
} catch (e) {
  InstalledAppsModule = null;
}

import { enrichAppsMetadata } from './appMetadataService';
import React from 'react';


export const DEFAULT_APPS = [];

/**
 * Obtiene la lista de aplicaciones instaladas usando módulo nativo propio
 */
export const getInstalledApps = async () => {
  if (Platform.OS !== 'android') {
    console.log('Solo disponible en Android');
    return [];
  }

  try {
    if (!InstalledAppsModule) {
      console.error('❌ InstalledAppsModule no encontrado — ¿hiciste rebuild?');
      return [];
    }

    console.log('🚀 Llamando InstalledAppsModule.getInstalledApps()...');
    const rawApps = await InstalledAppsModule.getInstalledApps();
    console.log(`✓ Módulo nativo retornó ${rawApps.length} apps`);

    const appObjects = rawApps.map(app => ({
      packageName: app.packageName,
      name: app.name,
      selected: false,
    }));

    const enrichedApps = enrichAppsMetadata(appObjects);
    return enrichedApps.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('❌ Error en getInstalledApps:', error);
    return [];
  }
};

/**
 * Verifica si PACKAGE_USAGE_STATS está permitido
 */
export const checkPackageUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') return false;

  try {
    const { UsageStatsModule } = NativeModules;
    if (UsageStatsModule && typeof UsageStatsModule.getAppUsageStats === 'function') {
      return true;
    }
  } catch (error) {
    console.warn('UsageStatsModule no disponible:', error.message);
  }
  return false;
};

/**
 * Solicita PACKAGE_USAGE_STATS y guía al usuario
 */
export const requestPackageUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') return true;

  return new Promise((resolve) => {
    Alert.alert(
      '📊 Monitoreo en Tiempo Real',
      'Para obtener datos REALES de uso de apps, activa el permiso de Acceso a Datos de Uso en Configuración.',
      [{ text: 'Entendido', onPress: () => resolve(false) }]
    );
  });
};

/**
 * Hook para obtener la lista de apps con estado de carga
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

export default {
  getInstalledApps,
  checkPackageUsageStatsPermission,
  requestPackageUsageStatsPermission,
};