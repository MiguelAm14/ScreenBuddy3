import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function AppRow({ app, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.row, app.selected && styles.rowSelected]}
      onPress={() => onToggle(app.packageName)}
      activeOpacity={0.7}
    >
      {/* Ícono */}
      <View style={[styles.iconWrap, { backgroundColor: app.color + '25' }]}>
        <Text style={styles.icon}>{app.icon}</Text>
      </View>

      {/* Nombre y packageName */}
      <View style={styles.info}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.pkg} numberOfLines={1}>{app.packageName}</Text>
      </View>

      {/* Checkbox */}
      <View style={[styles.check, app.selected && styles.checkSelected]}>
        {app.selected && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 6,
    backgroundColor: '#F9F6F1',
  },
  rowSelected: {
    borderColor: '#4CAF82',
    backgroundColor: '#4CAF8210',
  },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1410',
  },
  pkg: {
    fontSize: 11,
    color: '#7A6E62',
    marginTop: 2,
  },
  check: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0C8BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: '#4CAF82',
    borderColor: '#4CAF82',
  },
  checkMark: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
});