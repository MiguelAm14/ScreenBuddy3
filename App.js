import { SafeAreaView, StyleSheet } from 'react-native';
import SetBudget from './SetBudget';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SetBudget />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
});