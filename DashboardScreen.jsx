import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  AppState,
  Linking,
} from 'react-native';
import AvatarOverlay from './components/AvatarOverlay';
import AppRow from './components/AppRow';
import { loadBudget } from './services/budgetService';
import { getInstalledApps, checkPackageUsageStatsPermission } from './services/appListService';
import {
  subscribeToAppUsage,
  calculateUsagePercentage,
  getTotalUsageTime,
} from './services/usageService';

export default function DashboardScreen() {
  const [budgetConfig, setBudgetConfig] = useState(null);
  const [installedApps, setInstalledApps] = useState([]);
  const [usageByApp, setUsageByApp] = useState({});
  const [currentPercentage, setCurrentPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usageStatsPermitted, setUsageStatsPermitted] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  // Monitor app state to pause/resume polling (battery optimization)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [unsubscribe, budgetConfig]);

  const handleAppStateChange = (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App resumed
      if (budgetConfig && usageStatsPermitted) {
        restartPolling();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App backgrounded
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    }
    setAppState(nextAppState);
  };

  const restartPolling = async () => {
    if (!budgetConfig) return;
    const apps = await getInstalledApps();
    const appsToMonitor = apps.filter(app =>
      budgetConfig.monitoredApps.includes(app.packageName)
    );
    if (appsToMonitor.length > 0) {
      const unsub = subscribeToAppUsage(appsToMonitor, 10000, handleUsageUpdate);
      setUnsubscribe(() => unsub);
    }
  };

  const handleUsageUpdate = (usage) => {
    setUsageByApp(usage);
    const totalUsed = getTotalUsageTime(usage);
    if (budgetConfig) {
      const percentage = calculateUsagePercentage(totalUsed, budgetConfig.totalMinutes);
      setCurrentPercentage(percentage);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);

        if (Platform.OS === 'android') {
          const statsPermitted = await checkPackageUsageStatsPermission();
          setUsageStatsPermitted(statsPermitted);
        }

        const config = await loadBudget();
        if (!config) {
          Alert.alert('Configuración no encontrada', 'Por favor, configura tu presupuesto primero.');
          setLoading(false);
          return;
        }
        setBudgetConfig(config);

        const apps = await getInstalledApps();
        setInstalledApps(apps);

        const appsToMonitor = apps.filter(app =>
          config.monitoredApps.includes(app.packageName)
        );

        // Only start polling if permission granted
        if (appsToMonitor.length > 0 && usageStatsPermitted) {
          const unsub = subscribeToAppUsage(appsToMonitor, 10000, handleUsageUpdate);
          setUnsubscribe(() => unsub);
        }
      } catch (error) {
        console.error('Error inicializando dashboard:', error);
        Alert.alert('Error', 'No se pudo inicializar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleOpenSettings = async () => {
    try {
      Linking.openURL('android-app://com.android.settings/');
    } catch (error) {
      Alert.alert(
        'Abrir Configuración',
        'Por favor, ve a Configuración > Aplicaciones > ScreenBuddy > Permisos\ny activa los permisos necesarios.'
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permissions missing - show disabled state
  if (!usageStatsPermitted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.disabledContent}>
          <View style={styles.disabledContainer}>
            <Text style={styles.disabledEmoji}>🔐</Text>
            <Text style={styles.disabledTitle}>Permiso requerido</Text>
            <Text style={styles.disabledText}>
              ScreenBuddy necesita permiso de estadísticas de uso para monitorear tu tiempo en apps.
            </Text>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleOpenSettings}
            >
              <Text style={styles.enableButtonText}>Habilitar permiso</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const monitoredAppsInfo = installedApps.filter(app =>
    budgetConfig?.monitoredApps.includes(app.packageName)
  );

  const totalUsed = Math.round(getTotalUsageTime(usageByApp));
  const remaining = Math.max(0, budgetConfig.totalMinutes - totalUsed);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES')}</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarOverlay usagePercent={currentPercentage} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tiempo usado</Text>
            <Text style={styles.statValue}>{totalUsed} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Meta diaria</Text>
            <Text style={styles.statValue}>{budgetConfig.totalMinutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tiempo restante</Text>
            <Text style={styles.statValue}>{remaining} min</Text>
          </View>
        </View>

        {/* Monitored Apps List */}
        <View style={styles.appsSection}>
          <Text style={styles.appsTitle}>
            Aplicaciones Monitoreadas ({monitoredAppsInfo.length})
          </Text>

          {monitoredAppsInfo.length > 0 ? (
            monitoredAppsInfo.map(app => {
              const appUsage = usageByApp[app.packageName] || 0;
              const appPercentage = calculateUsagePercentage(appUsage, budgetConfig.totalMinutes);
              return (
                <View key={app.packageName} style={styles.appUsageRow}>
                  <Text style={styles.appIcon}>{app.icon}</Text>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appPackage}>{app.packageName}</Text>
                  </View>
                  <View style={styles.appUsageInfo}>
                    <Text style={styles.appUsageMinutes}>{appUsage} min</Text>
                    <Text style={styles.appUsagePercent}>{appPercentage}%</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noAppsText}>Sin apps monitoreadas</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7A6E62',
  },
  disabledContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  disabledContainer: {
    alignItems: 'center',
  },
  disabledEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1410',
    marginBottom: 12,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 14,
    color: '#7A6E62',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: '#4CAF82',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1410',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#7A6E62',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#7A6E62',
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1410',
  },
  appsSection: {
    marginBottom: 12,
  },
  appsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1410',
    marginBottom: 12,
  },
  appUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0D8CC',
  },
  appIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1410',
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 11,
    color: '#7A6E62',
  },
  appUsageInfo: {
    alignItems: 'flex-end',
  },
  appUsageMinutes: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1410',
    marginBottom: 2,
  },
  appUsagePercent: {
    fontSize: 11,
    color: '#7A6E62',
  },
  noAppsText: {
    fontSize: 13,
    color: '#7A6E62',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});
