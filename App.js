import { SafeAreaView, StyleSheet } from 'react-native';
import SetBudget from './SetBudget';
import DashboardScreen from './DashboardScreen';
import { useState } from 'react';

export default function App() {
  const [budgetConfigured, setBudgetConfigured] = useState(false);

  // Toggle para cambiar entre pantallas (SetBudget → DashboardScreen)
  const handleBudgetSaved = () => {
    setBudgetConfigured(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {budgetConfigured ? (
        <DashboardScreen />
      ) : (
        <SetBudget onBudgetSaved={handleBudgetSaved} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
});