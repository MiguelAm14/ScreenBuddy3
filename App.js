import { SafeAreaView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SetBudget from './SetBudget';
import DashboardScreen from './DashboardScreen';
import PermissionSplashScreen from './screens/PermissionSplashScreen';
import { useState, useEffect } from 'react';

export default function App() {
  const [budgetConfigured, setBudgetConfigured] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('onboarding_completed');
        setOnboardingCompleted(!!onboardingDone);
        setAppInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppInitialized(true);
      }
    };
    initApp();
  }, []);

  const handlePermissionSplashComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const handleBudgetSaved = () => {
    setBudgetConfigured(true);
  };

  if (!appInitialized) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {!onboardingCompleted && (
        <PermissionSplashScreen onComplete={handlePermissionSplashComplete} />
      )}

      {onboardingCompleted && (
        budgetConfigured ? (
          <DashboardScreen />
        ) : (
          <SetBudget onBudgetSaved={handleBudgetSaved} />
        )
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