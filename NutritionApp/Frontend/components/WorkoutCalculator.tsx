import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

interface WorkoutCalculatorProps {
  onSubmit: (
    workouts: Array<{ title: string; type: string; bodyPart: string }>,
    exercise?: { name: string; minutes: number; caloriesBurned: number }
  ) => void;
}

interface WorkoutSuggestion {
  title: string;
  type: string;
  bodyPart: string;
}

const WorkoutCalculator: React.FC<WorkoutCalculatorProps> = ({ onSubmit }) => {
  const [workouts, setWorkouts] = useState<Array<{ title: string; type: string; bodyPart: string }>>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<WorkoutSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [intensity, setIntensity] = useState<'light' | 'heavy'>('light');

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/workouts/search?q=${text}`);
      const data = await response.json();
      setSearchResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching workouts:', error);
      Alert.alert('Error', 'Failed to fetch workout suggestions');
    }
  };

  const selectWorkout = async (workout: WorkoutSuggestion) => {
    const newWorkouts = [...workouts, workout];
    setWorkouts(newWorkouts);
    setSearchText('');
    setShowDropdown(false);
  };

  const handleRemoveWorkout = (index: number) => {
    const newWorkouts = workouts.filter((_, i) => i !== index);
    setWorkouts(newWorkouts);
  };

  const handleSubmit = async () => {
    if (workouts.length === 0) {
      Alert.alert('Error', 'Please add at least one workout');
      return;
    }

    // Create the exercise entry based on intensity and number of workouts
    const exercise = {
      name: intensity === 'light' 
        ? 'Weight lifting, light workout'
        : 'Weight lifting, body building, vigorous',
      minutes: workouts.length * 10,
      caloriesBurned: 0
    };

    // Submit both workouts and the exercise
    onSubmit(workouts, exercise);
    setWorkouts([]);
    setSearchText('');
    Keyboard.dismiss();
    Alert.alert('Success', 'Workout Data Logged Successfully');
  };

  const renderDropdown = () => {
    if (showDropdown && searchResults.length > 0) {
      return (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }}>
            {searchResults.map((result, i) => (
              <TouchableOpacity
                key={i}
                style={styles.dropdownItem}
                onPress={() => {
                  selectWorkout(result);
                  Keyboard.dismiss();
                }}
              >
                <Text>{result.title}</Text>
                <Text style={styles.dropdownSubtext}>
                  {result.type} • {result.bodyPart}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Workout Logger</Text>

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search workouts..."
              value={searchText}
              onChangeText={(text) => handleSearch(text)}
              onFocus={() => setShowDropdown(true)}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
            />
            <View style={styles.clearButtonContainer}>
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchText('');
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {renderDropdown()}
        </View>

        <View style={styles.intensityContainer}>
          <Text style={styles.label}>Intensity</Text>
          <View style={styles.intensityButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.intensityButton,
                intensity === 'light' && styles.intensityButtonSelected
              ]}
              onPress={() => setIntensity('light')}
            >
              <Text style={[
                styles.intensityButtonText,
                intensity === 'light' && styles.intensityButtonTextSelected
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.intensityButton,
                intensity === 'heavy' && styles.intensityButtonSelected
              ]}
              onPress={() => setIntensity('heavy')}
            >
              <Text style={[
                styles.intensityButtonText,
                intensity === 'heavy' && styles.intensityButtonTextSelected
              ]}>
                Heavy
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.workoutListContainer}>
          <FlatList
            data={workouts}
            scrollEnabled={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.workoutItem}>
                <View style={styles.workoutTextContainer}>
                  <Text style={styles.workoutText}>{item.title}</Text>
                  <Text style={styles.workoutSubtext}>
                    {item.type} • {item.bodyPart}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveWorkout(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Log Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 16,
    flex: 1,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    paddingRight: 40,
    borderRadius: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.darkPurple,
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  workoutTextContainer: {
    flex: 1,
  },
  workoutText: {
    color: COLORS.white,
    fontSize: 16,
  },
  workoutSubtext: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  removeButton: {
    color: COLORS.red,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: COLORS.lightPurple,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  workoutListContainer: {
    flex: 1,
    marginBottom: 16,
  },
  intensityContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  intensityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  intensityButtonSelected: {
    backgroundColor: COLORS.lightPurple,
    borderColor: COLORS.lightPurple,
  },
  intensityButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  intensityButtonTextSelected: {
    color: 'white',
  },
});

export default WorkoutCalculator;