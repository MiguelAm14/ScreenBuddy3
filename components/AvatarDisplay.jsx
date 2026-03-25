import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * AvatarDisplay
 * Componente que muestra el avatar con su estado emocional actual
 * 
 * Props:
 *   - emoji: emoji del avatar (ej: '😊')
 *   - percentage: porcentaje de uso (0-100+)
 *   - backgroundColor: color de fondo según estado
 *   - onPress: callback al tocar el avatar
 */
export default function AvatarDisplay({ emoji, percentage, backgroundColor, onPress }) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.avatarEmoji}>{emoji}</Text>
      </TouchableOpacity>

      {/* Mostrar porcentaje debajo del avatar */}
      <Text style={styles.percentageText}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  avatarButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarEmoji: {
    fontSize: 80,
  },
  percentageText: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
