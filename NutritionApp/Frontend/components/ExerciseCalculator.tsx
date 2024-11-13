import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { API_URL } from '../config';
import { COLORS } from '../constants/colors';

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

  const calculateCalories = async () => {
    const hasInvalidExercises = exercises.some(ex => !ex.name || ex.minutes <= 0);
    if (hasInvalidExercises) {
      Alert.alert('Error', 'You must enter a valid exercise and minutes');
      return;
    }

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
      
      if (onSubmit) {
        const exercisesWithCalories = exercises.map(ex => ({
          ...ex,
          caloriesBurned: (data.totalCalories / exercises.length)
        }));
        onSubmit(exercisesWithCalories, data.totalCalories);
        Alert.alert('Success', 'Exercise Data Logged Successfully');
      }
    } catch (error) {
      console.error('Error calculating calories:', error);
      Alert.alert('Error', 'Failed to calculate calories');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Exercise Calorie Calculator</Text>
        
        <View style={styles.weightContainer}>
          <Text style={styles.label}>Your Weight (lbs)</Text>
          <View style={styles.weightButtonsContainer}>
            {WEIGHT_CATEGORIES.map((weight) => (
              <TouchableOpacity
                key={weight}
                style={[
                  styles.weightButton,
                  userWeight === weight && styles.weightButtonSelected
                ]}
                onPress={() => setUserWeight(weight)}
              >
                <Text style={[
                  styles.weightButtonText,
                  userWeight === weight && styles.weightButtonTextSelected
                ]}>
                  {weight === 130 ? '≤130' : weight === 205 ? '≥205' : weight}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {exercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseRow}>
            <View style={styles.exerciseInputContainer}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.exerciseInput}
                  value={exercise.name}
                  onChangeText={(value) => handleSearchChange(index, value)}
                  placeholder="Search exercise..."
                />
                <View style={styles.clearButtonContainer}>
                  {exercise.name.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleSearchChange(index, '')}
                    >
                      <Text style={styles.clearButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
              placeholder="Minutes"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              keyboardType="numeric"
              value={exercise.minutes > 0 ? exercise.minutes.toString() : ''}
              onChangeText={(value) => handleMinutesChange(index, value)}
            />
          </View>
        ))}

        <TouchableOpacity onPress={calculateCalories} style={styles.calculateButton}>
          <Text style={styles.buttonText}>Log Exercise</Text>
        </TouchableOpacity>

        {totalCalories !== null && (
          <Text style={styles.totalCalories}>
            Total Calories Burned: {totalCalories}
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
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
  weightButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  weightButtonSelected: {
    backgroundColor: COLORS.lightPurple,
    borderColor: COLORS.lightPurple,
  },
  weightButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  weightButtonTextSelected: {
    color: 'white',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    position: 'relative',
  },
  exerciseInput: {
    flex: 1,
    padding: 8,
    paddingRight: 40,
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
  calculateButton: {
    backgroundColor: COLORS.lightPurple,
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
  clearButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 40,
    height: '100%',
  },
  clearButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 18,
  },
});

export default ExerciseCalculator;