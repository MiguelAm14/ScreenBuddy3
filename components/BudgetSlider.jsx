import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { calcThresholds, formatTime } from '../services/budgetService';

export default function BudgetSlider({ minutes, onChange }) {
  const { big, unit } = formatTime(minutes);
  const thresholds = calcThresholds(minutes);

  return (
    <View style={styles.container}>
      {/* Tiempo grande */}
      <View style={styles.timeRow}>
        <Text style={styles.timeBig}>{big}</Text>
        <Text style={styles.timeUnit}>{unit}</Text>
      </View>
      <Text style={styles.timeLabel}>{minutes} minutos por día</Text>

      {/* Slider */}
      <Slider
        style={styles.slider}
        minimumValue={15}
        maximumValue={600}
        step={15}
        value={minutes}
        onValueChange={onChange}
        minimumTrackTintColor="#4CAF82"
        maximumTrackTintColor="#E0D8CC"
        thumbTintColor="#4CAF82"
      />

      {/* Labels extremos */}
      <View style={styles.sliderLabels}>
        <Text style={styles.labelText}>15 min</Text>
        <Text style={styles.labelText}>10 horas</Text>
      </View>

      {/* Umbrales calculados */}
      <View style={styles.thresholds}>
        <Text style={styles.thresholdsTitle}>Umbrales calculados</Text>
        <View style={styles.thresholdRow}>
          <View style={[styles.pill, { borderLeftColor: '#F5C882' }]}>
            <Text style={styles.pillText}>{thresholds.warn} min</Text>
          </View>
          <Text style={styles.thresholdLabel}>50% → Aviso</Text>
        </View>
        <View style={styles.thresholdRow}>
          <View style={[styles.pill, { borderLeftColor: '#F5A623' }]}>
            <Text style={styles.pillText}>{thresholds.alert} min</Text>
          </View>
          <Text style={styles.thresholdLabel}>80% → Alerta</Text>
        </View>
        <View style={styles.thresholdRow}>
          <View style={[styles.pill, { borderLeftColor: '#E8533A' }]}>
            <Text style={styles.pillText}>{thresholds.limit} min</Text>
          </View>
          <Text style={styles.thresholdLabel}>100% → Límite</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  timeBig: {
    fontSize: 56,
    fontWeight: '800',
    color: '#4CAF82',
    letterSpacing: -2,
  },
  timeUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A6E62',
  },
  timeLabel: {
    fontSize: 12,
    color: '#7A6E62',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  labelText: {
    fontSize: 11,
    color: '#7A6E62',
  },
  thresholds: {
    gap: 8,
  },
  thresholdsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A6E62',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    backgroundColor: '#F5F0E8',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    minWidth: 72,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1410',
  },
  thresholdLabel: {
    fontSize: 12,
    color: '#7A6E62',
  },
});