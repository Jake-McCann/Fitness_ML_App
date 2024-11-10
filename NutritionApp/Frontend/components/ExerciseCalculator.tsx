import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { API_URL } from '../config';

interface Exercise {
  name: string;
  minutes: number;
}

interface ExerciseSuggestion {
  name: string;
}

const WEIGHT_CATEGORIES = [130, 155, 180, 205];

interface ExerciseCalculatorProps {
  onSubmit: (exercises: Array<{ name: string; minutes: number; caloriesBurned: number }>, totalCalories: number) => void;
}

const ExerciseCalculator: React.FC<ExerciseCalculatorProps> = ({ onSubmit }) => {
  const [userWeight, setUserWeight] = useState<number>(155);
  const [exercises, setExercises] = useState<Exercise[]>([{ name: '', minutes: 0 }]);
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [totalCalories, setTotalCalories] = useState<number | null>(null);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  const getWeightCategory = (weight: number): number => {
    return WEIGHT_CATEGORIES.reduce((prev, curr) => {
      return Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev;
    });
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/exercises/search?q=${query}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to fetch exercise suggestions');
    }
  };

  const handleSearchChange = (index: number, value: string) => {
    const updatedExercises = [...exercises];
    updatedExercises[index].name = value;
    setExercises(updatedExercises);
    setActiveSearchIndex(index);
    fetchSuggestions(value);
  };

  const handleMinutesChange = (index: number, value: string) => {
    const updatedExercises = [...exercises];
    updatedExercises[index].minutes = parseInt(value) || 0;
    setExercises(updatedExercises);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', minutes: 0 }]);
  };

  const removeExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
  };

  const calculateCalories = async () => {
    try {
      const weightCategory = getWeightCategory(userWeight);
      const response = await fetch(`${API_URL}/api/exercises/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          exercises,
          weightCategory
        }),
      });
      const data = await response.json();
      setTotalCalories(data.totalCalories);
      
      // Call onSubmit with the exercises and total calories
      if (onSubmit) {
        const exercisesWithCalories = exercises.map(ex => ({
          ...ex,
          caloriesBurned: (data.totalCalories / exercises.length) // This is an approximation
        }));
        onSubmit(exercisesWithCalories, data.totalCalories);
      }
    } catch (error) {
      console.error('Error calculating calories:', error);
      Alert.alert('Error', 'Failed to calculate calories');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Calorie Calculator</Text>
      
      <View style={styles.weightContainer}>
        <Text style={styles.label}>Your Weight (lbs)</Text>
        <TextInput
          style={styles.weightInput}
          value={userWeight.toString()}
          onChangeText={(value) => setUserWeight(Number(value))}
          keyboardType="numeric"
        />
        <Text style={styles.helpText}>
          Available categories: {WEIGHT_CATEGORIES.join(', ')} lbs
        </Text>
      </View>

      {exercises.map((exercise, index) => (
        <View key={index} style={styles.exerciseRow}>
          <View style={styles.exerciseInputContainer}>
            <TextInput
              style={styles.exerciseInput}
              value={exercise.name}
              onChangeText={(value) => handleSearchChange(index, value)}
              placeholder="Search exercise..."
            />
            {activeSearchIndex === index && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, i) => i.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        handleSearchChange(index, item.name);
                        setActiveSearchIndex(null);
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
          <TextInput
            style={styles.minutesInput}
            value={exercise.minutes.toString()}
            onChangeText={(value) => handleMinutesChange(index, value)}
            placeholder="Min"
            keyboardType="numeric"
          />
          {exercises.length > 1 && (
            <TouchableOpacity
              onPress={() => removeExercise(index)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity onPress={addExercise} style={styles.addButton}>
        <Text style={styles.buttonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={calculateCalories} style={styles.calculateButton}>
        <Text style={styles.buttonText}>Calculate Calories</Text>
      </TouchableOpacity>

      {totalCalories !== null && (
        <Text style={styles.totalCalories}>
          Total Calories Burned: {totalCalories}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  weightContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  weightInput: {
    width: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  exerciseInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  exerciseInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  minutesInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: 'red',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  calculateButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  totalCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ExerciseCalculator;