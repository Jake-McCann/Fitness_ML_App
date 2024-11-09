import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView } from 'react-native';
import ExerciseCalculator from './components/ExerciseCalculator';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ExerciseCalculator />
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}