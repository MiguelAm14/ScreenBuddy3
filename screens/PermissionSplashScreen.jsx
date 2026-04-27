import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { checkPackageUsageStatsPermission } from '../services/appListService';

let SettingsModule;
try {
  SettingsModule = requireNativeModule('SettingsModule');
} catch (e) {
  SettingsModule = null;
}

export default function PermissionSplashScreen({ onComplete }) {
  const [usageStatsPermitted, setUsageStatsPermitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    checkPermissionsStatus();
  }, []);

  // Re-chequear permisos cuando app vuelve al foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App vuelve al foreground desde Settings
      checkPermissionsStatus();
    }
    setAppState(nextAppState);
  };

  const checkPermissionsStatus = async () => {
    if (Platform.OS !== 'android') {
      onComplete?.();
      return;
    }

    try {
      setLoading(true);
      const statsPermitted = await checkPackageUsageStatsPermission();
      setUsageStatsPermitted(statsPermitted);
      if (statsPermitted) {
        setTimeout(() => onComplete?.(), 500);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'android' && SettingsModule) {
        // Abrir directamente a Settings > Usage Access
        await SettingsModule.openUsageAccessSettings();
      } else {
        // Fallback: Abrir Settings genérica
        Linking.openURL('android-app://com.android.settings/');
      }
    } catch (error) {
      Alert.alert(
        'Abrir Configuración',
        'Por favor, ve a Configuración > Aplicaciones > Permisos > Acceso a Estadísticas de Uso\ny activa "ScreenBuddy".'
      );
    }
  };

  const handleContinueAnyway = () => {
    onComplete?.();
  };

  if (!loading && usageStatsPermitted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Permisos Necesarios</Text>
          <Text style={styles.subtitle}>
            ScreenBuddy necesita algunos permisos para monitorear tu uso de apps
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Verificando permisos...</Text>
          </View>
        )}

        {!loading && (
          <>
            <PermissionCard
              emoji="📊"
              title="Estadísticas de uso"
              description="Necesitamos acceder a cuánto tiempo usas cada app para poder hacer el monitoreo en tiempo real."
              granted={usageStatsPermitted}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Cómo activarlos:</Text>
              <Text style={styles.infoText}>
                {Platform.OS === 'android'
                  ? '1. Toca "Abrir Configuración" abajo\n2. Busca y selecciona "ScreenBuddy"\n3. Activa "Permitir acceso a estadísticas de uso"\n4. Vuelve a la app'
                  : 'Los permisos se solicitan automáticamente.'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {!usageStatsPermitted && (
                <>
                  <TouchableOpacity
                    style={styles.buttonPrimary}
                    onPress={handleOpenSettings}
                  >
                    <Text style={styles.buttonPrimaryText}>
                      ⚙️ Abrir Configuración
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.buttonSecondary}
                    onPress={handleContinueAnyway}
                  >
                    <Text style={styles.buttonSecondaryText}>
                      Continuar de todas formas
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {usageStatsPermitted && (
                <TouchableOpacity
                  style={styles.buttonPrimary}
                  onPress={onComplete}
                >
                  <Text style={styles.buttonPrimaryText}>✓ Continuar</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PermissionCard({ emoji, title, description, granted }) {
  return (
    <View style={[styles.permissionCard, { borderLeftColor: granted ? '#4CAF50' : '#FF9800' }]}>
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionEmoji}>{emoji}</Text>
        <View style={styles.permissionTitleContainer}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={[styles.permissionStatus, { color: granted ? '#4CAF50' : '#FF9800' }]}>
            {granted ? '✓ Concedido' : '⚠️ Pendiente'}
          </Text>
        </View>
      </View>
      <Text style={styles.permissionDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  permissionTitleContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginLeft: 40,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginVertical: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0D47A1',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});