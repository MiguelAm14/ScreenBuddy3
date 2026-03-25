import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AvatarOverlay from './components/AvatarOverlay';
import { loadBudget } from './services/budgetService';
import {
  generateRandomUsage,
  calculateUsagePercentage,
  getTotalUsageTime,
} from './services/usageService';

export default function DashboardScreen() {
  const [budgetConfig, setBudgetConfig] = useState(null);
  const [usageByApp, setUsageByApp] = useState({});
  const [currentPercentage, setCurrentPercentage] = useState(0);

  // Cargar budget config y generar datos aleatorios iniciales
  useEffect(() => {
    const initDashboard = async () => {
      const config = await loadBudget();
      if (config) {
        setBudgetConfig(config);

        // Generar datos aleatorios de uso
        const selectedApps = config.monitoredApps.map(packageName => ({
          packageName,
        }));
        const usage = generateRandomUsage(selectedApps, config.totalMinutes);
        setUsageByApp(usage);

        // Calcular porcentaje y estado del avatar
        const totalUsed = getTotalUsageTime(usage);
        const percentage = calculateUsagePercentage(totalUsed, config.totalMinutes);
        setCurrentPercentage(percentage);
      } else {
        Alert.alert('Configuración no encontrada', 'Por favor, configura tu presupuesto primero.');
      }
    };

    initDashboard();
  }, []);

  // onClick para regenerar datos aleatorios (botón Refrescar)
  const handleRefresh = () => {
    if (!budgetConfig) return;

    const selectedApps = budgetConfig.monitoredApps.map(packageName => ({
      packageName,
    }));
    const usage = generateRandomUsage(selectedApps, budgetConfig.totalMinutes);
    setUsageByApp(usage);

    const totalUsed = getTotalUsageTime(usage);
    const percentage = calculateUsagePercentage(totalUsed, budgetConfig.totalMinutes);
    setCurrentPercentage(percentage);
  };

  // onTouchAvatar — solo propagar el evento (el avatar maneja el globo de texto internamente)
  const handleAvatarPress = () => {
    // El AvatarOverlay maneja el speech bubble automáticamente
  };

  if (!budgetConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }

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

        {/* Apps Usage List (temporary) */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Aplicaciones</Text>
          {budgetConfig.monitoredApps.map((packageName, index) => {
            const minutes = usageByApp[packageName] || 0;
            return (
              <View key={index} style={styles.appRow}>
                <Text style={styles.appName}>{packageName}</Text>
                <Text style={styles.appMinutes}>{minutes} min</Text>
              </View>
            );
          })}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Refrescar Datos</Text>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  appName: {
    fontSize: 14,
    color: '#333',
  },
  appMinutes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
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
});
