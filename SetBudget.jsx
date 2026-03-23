import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import AppRow from './components/AppRow';
import BudgetSlider from './components/BudgetSlider';
import { saveBudget } from './services/budgetService';

// Apps simuladas (en la app real vendrían de expo-usage-stats)
const INITIAL_APPS = [
  { name: 'Instagram',   packageName: 'com.instagram.android',      icon: '📸', color: '#833AB4', selected: true  },
  { name: 'TikTok',      packageName: 'com.zhiliaoapp.musically',    icon: '🎵', color: '#010101', selected: true  },
  { name: 'YouTube',     packageName: 'com.google.android.youtube',  icon: '▶️', color: '#FF0000', selected: false },
  { name: 'WhatsApp',    packageName: 'com.whatsapp',                icon: '💬', color: '#25D366', selected: false },
  { name: 'X (Twitter)', packageName: 'com.twitter.android',         icon: '𝕏',  color: '#14171A', selected: false },
  { name: 'Snapchat',    packageName: 'com.snapchat.android',        icon: '👻', color: '#FFFC00', selected: false },
  { name: 'Facebook',    packageName: 'com.facebook.katana',         icon: '👍', color: '#1877F2', selected: false },
  { name: 'Netflix',     packageName: 'com.netflix.mediaclient',     icon: '🎬', color: '#E50914', selected: false },
  { name: 'Twitch',      packageName: 'tv.twitch.android.app',       icon: '🎮', color: '#9146FF', selected: false },
  { name: 'Spotify',     packageName: 'com.spotify.music',           icon: '🎧', color: '#1DB954', selected: false },
  { name: 'Reddit',      packageName: 'com.reddit.frontpage',        icon: '🤖', color: '#FF4500', selected: false },
  { name: 'Pinterest',   packageName: 'com.pinterest',               icon: '📌', color: '#E60023', selected: false },
  { name: 'Telegram',    packageName: 'org.telegram.messenger',      icon: '✈️', color: '#2CA5E0', selected: false },
  { name: 'LinkedIn',    packageName: 'com.linkedin.android',        icon: '💼', color: '#0A66C2', selected: false },
  { name: 'BeReal',      packageName: 'com.bereal.ft',               icon: '📷', color: '#000000', selected: false },
];

export default function SetBudget() {
  const [apps, setApps]       = useState(INITIAL_APPS);
  const [minutes, setMinutes] = useState(120);
  const [search, setSearch]   = useState('');
  const [saving, setSaving]   = useState(false);

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

        {/* Buscador */}
        <TextInput
          style={styles.search}
          placeholder="Buscar app..."
          placeholderTextColor="#7A6E62"
          value={search}
          onChangeText={setSearch}
        />

        {/* Lista de apps */}
        {filteredApps.map(app => (
          <AppRow
            key={app.packageName}
            app={app}
            onToggle={handleToggleApp}
          />
        ))}
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
});