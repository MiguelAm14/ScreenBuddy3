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
} from 'react-native';
import { checkPackageUsageStatsPermission, requestQueryAppPermission } from '../services/appListService';

/**
 * PermissionSplashScreen - Onboarding de permisos en primer lanzamiento
 * Muestra qué permisos necesita la app y cómo habilitarlos
 * Se muestra solo UNA VEZ (controlado por AsyncStorage)
 */
export default function PermissionSplashScreen({ onComplete }) {
  const [queryPermissionGranted, setQueryPermissionGranted] = useState(false);
  const [usageStatsPermitted, setUsageStatsPermitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar estado actual de permisos
  useEffect(() => {
    checkPermissionsStatus();
  }, []);

  const checkPermissionsStatus = async () => {
    if (Platform.OS !== 'android') {
      onComplete?.();
      return;
    }

    try {
      setLoading(true);
      
      // Check QUERY_ALL_PACKAGES
      const queryGranted = await requestQueryAppPermission();
      setQueryPermissionGranted(queryGranted);
      
      // Check PACKAGE_USAGE_STATS
      const statsPermitted = await checkPackageUsageStatsPermission();
      setUsageStatsPermitted(statsPermitted);
      
      // Si ambos están granted, completar
      if (queryGranted && statsPermitted) {
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
      // Abrir Settings de Android para permisos
      Linking.openURL('android-app://com.android.settings/');
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Abrir Configuración',
        'Por favor, ve a Configuración > Aplicaciones > ScreenBuddy > Permisos\ny activa los permisos necesarios.'
      );
    }
  };

  const handleContinueAnyway = () => {
    // Permitir continuar incluso sin permisos (UI deshabilitada después)
    onComplete?.();
  };

  if (!loading && (queryPermissionGranted && usageStatsPermitted)) {
    return null; // Si ambos permisos OK, no mostrar splash
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Permisos Necesarios</Text>
          <Text style={styles.subtitle}>
            ScreenBuddy necesita algunos permisos para monitorear tu uso de apps
          </Text>
        </View>

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Verificando permisos...</Text>
          </View>
        )}

        {!loading && (
          <>
            {/* Permission 1: QUERY_ALL_PACKAGES */}
            <PermissionCard
              emoji="📱"
              title="Acceso a lista de apps"
              description="Necesitamos ver qué apps tienes instaladas para que puedas monitorearlas."
              granted={queryPermissionGranted}
            />

            {/* Permission 2: PACKAGE_USAGE_STATS */}
            <PermissionCard
              emoji="📊"
              title="Estadísticas de uso"
              description="Necesitamos acceder a cuánto tiempo usas cada app para poder hacer el monitoreo en tiempo real."
              granted={usageStatsPermitted}
            />

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Cómo activarlos:</Text>
              <Text style={styles.infoText}>
                {Platform.OS === 'android'
                  ? '1. Toca "Abrir Configuración" abajo\n2. Ve a Permisos\n3. Activa los permisos solicitados\n4. Vuelve a la app'
                  : 'Los permisos se solicitan automáticamente.'}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {!(queryPermissionGranted && usageStatsPermitted) && (
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

              {queryPermissionGranted && usageStatsPermitted && (
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

/**
 * PermissionCard - Componente para mostrar estado de cada permiso
 */
function PermissionCard({ emoji, title, description, granted }) {
  return (
    <View
      style={[
        styles.permissionCard,
        { borderLeftColor: granted ? '#4CAF50' : '#FF9800' },
      ]}
    >
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
