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
} from 'react-native';
import AvatarOverlay from './components/AvatarOverlay';
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
  const [usageStatsPermitted, setUsageStatsPermitted] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Cargar budget y apps, iniciar monitoreo en tiempo real (con datos simulados)
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        
        // Verificar si PACKAGE_USAGE_STATS está disponible
        if (Platform.OS === 'android') {
          const statsPermitted = await checkPackageUsageStatsPermission();
          setUsageStatsPermitted(statsPermitted);
          if (!statsPermitted) {
            console.info('Usando datos simulados actualizados cada 5 segundos');
          } else {
            console.info('✓ Usando datos reales de uso del sistema');
          }
        }
        
        // Obtener configuración de presupuesto
        const config = await loadBudget();
        if (!config) {
          Alert.alert('Configuración no encontrada', 'Por favor, configura tu presupuesto primero.');
          setLoading(false);
          return;
        }
        setBudgetConfig(config);

        // Obtener lista real de apps instaladas
        const apps = await getInstalledApps();
        setInstalledApps(apps);
        console.log(`✓ Dashboard: ${apps.length} apps disponibles`);

        // Crear array de apps a monitorear
        const appsToMonitor = apps.filter(app =>
          config.monitoredApps.includes(app.packageName)
        );

        // Iniciar monitoreo con datos simulados (polling cada 5 segundos)
        if (appsToMonitor.length > 0) {
          const unsub = subscribeToAppUsage(
            appsToMonitor,
            5000, // 5 segundos
            (usage) => {
              setUsageByApp(usage);
              const totalUsed = getTotalUsageTime(usage);
              const percentage = calculateUsagePercentage(totalUsed, config.totalMinutes);
              setCurrentPercentage(percentage);
            }
          );
          setUnsubscribe(() => unsub);
          console.log('✓ Monitoreo de simulación iniciado (datos aleatorios cada 5s)');
        }
      } catch (error) {
        console.error('Error inicializando dashboard:', error);
        Alert.alert('Error', 'No se pudo inicializar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();

    // Cleanup - detener polling al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Botón manual para refrescar (opcional)
  const handleRefresh = () => {
    if (!budgetConfig) return;
    console.log('Datos actualizados manualmente');
    // El monitoreo ya está activo, este botón es solo para UI feedback
  };

  // onTouchAvatar — solo propagar el evento (el avatar maneja el globo de texto internamente)
  const handleAvatarPress = () => {
    // El AvatarOverlay maneja el speech bubble automáticamente
  };

  if (!budgetConfig || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  // Obtener apps monitoreadas con su información
  const monitoredAppsInfo = installedApps.filter(app =>
    budgetConfig.monitoredApps.includes(app.packageName)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES')}</Text>
        </View>

        {/* Advertencia - Datos Simulados en Expo */}
        {!usageStatsPermitted && Platform.OS === 'android' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>ℹ️ Datos Simulados</Text>
            <Text style={styles.warningText}>El dashboard muestra datos simulados actualizados cada 5 segundos. En una versión compilada nativa, mostrarías datos reales de uso.</Text>
          </View>
        )}

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarOverlay
            usagePercent={currentPercentage}
            onPress={handleAvatarPress}
          />
        </View>

        {/* Time Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tiempo usado</Text>
            <Text style={styles.statValue}>
              {Math.round(getTotalUsageTime(usageByApp))} min
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Meta diaria</Text>
            <Text style={styles.statValue}>{budgetConfig.totalMinutes} min</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tiempo restante</Text>
            <Text style={styles.statValue}>
              {Math.max(0, budgetConfig.totalMinutes - Math.round(getTotalUsageTime(usageByApp)))} min
            </Text>
          </View>
        </View>

        {/* Apps Usage List - Real time data */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Aplicaciones Monitoreadas ({monitoredAppsInfo.length})</Text>
          {monitoredAppsInfo.length > 0 ? (
            monitoredAppsInfo.map((app) => {
              const minutes = usageByApp[app.packageName] || 0;
              const percentage = Math.round((minutes / budgetConfig.totalMinutes) * 100);
              return (
                <View key={app.packageName} style={styles.appRow}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appEmoji}>{app.icon || '📱'}</Text>
                    <View style={styles.appDetails}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appPackage}>{app.packageName}</Text>
                    </View>
                  </View>
                  <View style={styles.appUsage}>
                    <Text style={styles.appMinutes}>{Math.round(minutes)} min</Text>
                    <Text style={styles.appPercent}>{percentage}%</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Sin apps monitoreadas</Text>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  avatarSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  appEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 11,
    color: '#999',
  },
  appUsage: {
    alignItems: 'flex-end',
  },
  appMinutes: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  appPercent: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  refreshButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 10,
  },
  warningButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFC107',
    borderRadius: 6,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
