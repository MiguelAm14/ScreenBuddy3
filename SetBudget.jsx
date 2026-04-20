import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform
} from 'react-native';
import AppRow from './components/AppRow';
import BudgetSlider from './components/BudgetSlider';
import { saveBudget } from './services/budgetService';
import {
  getInstalledApps,
  requestQueryAppPermission,
  checkPackageUsageStatsPermission,
  requestPackageUsageStatsPermission,
  DEFAULT_APPS
} from './services/appListService';

export default function SetBudget({ onBudgetSaved = () => {} }) {
  const [apps, setApps]       = useState(DEFAULT_APPS);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState(null);
  const [usageStatsPermitted, setUsageStatsPermitted] = useState(true);
  const [minutes, setMinutes] = useState(120);
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(false);

  // Cargar lista de apps del sistema en el primer render
  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoadingApps(true);
        setAppsError(null);
        
        // Solicitar permisos si es Android
        if (Platform.OS === 'android') {
          // Verificar QUERY_ALL_PACKAGES
          const permissionGranted = await requestQueryAppPermission();
          if (!permissionGranted) {
            console.warn('Permiso QUERY_ALL_PACKAGES no concedido, usando lista de ejemplo');
          }
          
          // Verificar PACKAGE_USAGE_STATS
          const usagePermitted = await checkPackageUsageStatsPermission();
          setUsageStatsPermitted(usagePermitted);
          if (!usagePermitted) {
            console.warn('PACKAGE_USAGE_STATS no otorgado');
          }
        }
        
        // Obtener la lista de apps
        const loadedApps = await getInstalledApps();
        setApps(loadedApps);
      } catch (error) {
        console.error('Error al cargar apps:', error);
        setAppsError(error.message);
        setApps(DEFAULT_APPS);
      } finally {
        setLoadingApps(false);
      }
    };

    loadApps();
  }, []);

  // onClick_AppSelection — toggle de selección de app
  const handleToggleApp = (packageName) => {
    setApps(prev =>
      prev.map(a =>
        a.packageName === packageName ? { ...a, selected: !a.selected } : a
      )
    );
  };

  // onSet_Budget — guardar presupuesto
  const handleSave = async () => {
    const selected = apps.filter(a => a.selected);
    if (selected.length === 0) {
      Alert.alert('Elige al menos una app', 'Necesitas seleccionar al menos una app para monitorear.');
      return;
    }
    setSaving(true);
    const config = await saveBudget(minutes, apps);
    setSaving(false);
    Alert.alert(
      '✅ ¡Guardado!',
      `Presupuesto: ${minutes} min\nApps monitoreadas: ${selected.length}\nUmbrales: ${config.thresholds.warn}/${config.thresholds.alert}/${config.thresholds.limit} min`
    );
    // Llamar callback después de guardar exitosamente
    setTimeout(() => onBudgetSaved(), 1000);
  };

  const filteredApps = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = apps.filter(a => a.selected).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={styles.functionTag}>onSet_Budget( ) — Evento activo</Text>
      <Text style={styles.title}>Configuración</Text>
      <Text style={styles.sub}>Elige las apps a monitorear y define tu presupuesto diario.</Text>

      {/* ── Sección: Selección de apps ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📱 Apps instaladas</Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{selectedCount} seleccionadas</Text>
          </View>
        </View>

        {/* Advertencia - Permiso PACKAGE_USAGE_STATS no otorgado */}
        {!usageStatsPermitted && Platform.OS === 'android' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>⚠️ Permiso Requerido</Text>
            <Text style={styles.warningText}>Para monitoreo en tiempo real, habilita "Estadísticas de uso".</Text>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={requestPackageUsageStatsPermission}
            >
              <Text style={styles.warningButtonText}>Habilitar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Indicador de carga */}
        {loadingApps ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A1410" />
            <Text style={styles.loadingText}>Cargando apps del sistema...</Text>
          </View>
        ) : (
          <>
            {/* Mensaje de advertencia si se usa lista de ejemplo */}
            {appsError && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>⚠️ Usando lista de ejemplo ({appsError})</Text>
              </View>
            )}

            {/* Buscador */}
            <TextInput
              style={styles.search}
              placeholder="Buscar app..."
              placeholderTextColor="#7A6E62"
              value={search}
              onChangeText={setSearch}
            />

            {/* Lista de apps */}
            {filteredApps.length > 0 ? (
              filteredApps.map(app => (
                <AppRow
                  key={app.packageName}
                  app={app}
                  onToggle={handleToggleApp}
                />
              ))
            ) : (
              <Text style={styles.noAppsText}>No se encontraron apps</Text>
            )}
          </>
        )}
      </View>

      {/* ── Sección: Presupuesto ── */}
      <Text style={styles.sectionLabel}>⏱️ Presupuesto de tiempo</Text>
      <BudgetSlider minutes={minutes} onChange={setMinutes} />

      {/* ── Botón guardar ── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Guardando...' : '💾  Guardar presupuesto'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  functionTag: {
    fontSize: 11,
    color: '#7A6E62',
    backgroundColor: '#E0D8CC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1410',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: '#7A6E62',
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1410',
  },
  counter: {
    backgroundColor: '#E0D8CC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1410',
  },
  search: {
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1A1410',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#7A6E62',
    marginTop: 12,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FFF5E6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFD99F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#B8860B',
    fontWeight: '600',
  },
  noAppsText: {
    fontSize: 14,
    color: '#7A6E62',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1410',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#1A1410',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#F5F0E8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  warningBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 3,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 8,
  },
  warningButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFC107',
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});