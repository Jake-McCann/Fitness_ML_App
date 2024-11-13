import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

// Add this interface for the food item structure
interface FoodItem {
  name: string;
  calories: number;
}

interface NutritionCalculatorProps {
  onSubmit: (foods: Array<{ name: string, servings: number, calories: number }>, totalCalories: number) => void;
}

const NutritionCalculator: React.FC<NutritionCalculatorProps> = ({ onSubmit }) => {
  const [food, setFood] = useState({ name: '', servings: 0, calories: 0 });
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [baseCalories, setBaseCalories] = useState(0);
  const [displayedCalories, setDisplayedCalories] = useState<number | null>(null);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/nutrition/search?query=${text}`);
      const data = await response.json();
      setSearchResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching foods:', error);
    }
  };

  const selectFood = (selectedFood: FoodItem) => {
    setFood({
      name: selectedFood.name,
      servings: food.servings,
      calories: selectedFood.calories
    });
    setBaseCalories(selectedFood.calories);
    setSearchText(selectedFood.name);
    setShowDropdown(false);
  };

  const handleServingsChange = (text: string) => {
    const servings = parseFloat(text) || 0;
    setFood({
      ...food,
      servings,
      calories: baseCalories * servings
    });
  };

  const handleSubmit = () => {
    if (!food.name || food.servings <= 0) {
      Alert.alert('Error', 'You must enter a valid food item and servings');
      return;
    }

    const totalCalories = baseCalories * food.servings;
    onSubmit([{ ...food, calories: totalCalories }], totalCalories);
    setDisplayedCalories(totalCalories);
    setFood({ name: '', servings: 0, calories: 0 });
    setBaseCalories(0);
    setSearchText('');
    Keyboard.dismiss();
    Alert.alert('Success', 'Nutrition Data Logged Successfully');
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
                  selectFood(result);
                  Keyboard.dismiss();
                }}
              >
                <Text>{result.name}</Text>
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
      <View style={styles.container}>
        <Text style={styles.title}>Nutrition Calculator</Text>

        <View style={styles.foodRow}>
          <View style={styles.foodInputContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.foodInput}
                placeholder="Search for food..."
                value={searchText}
                onChangeText={(text) => handleSearch(text)}
                onFocus={() => setShowDropdown(true)}
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
          <TextInput
            style={styles.servingsInput}
            placeholder="Servings"
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
            keyboardType="numeric"
            value={food.servings > 0 ? food.servings.toString() : ''}
            onChangeText={handleServingsChange}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Log Nutrition</Text>
        </TouchableOpacity>

        {displayedCalories !== null && (
          <Text style={styles.totalCalories}>
            Total Calories: {displayedCalories}
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
  foodRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  foodInputContainer: {
    flex: 1,
    marginRight: 8,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  servingsInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
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
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    position: 'relative',
    marginRight: 8,
  },
  foodInput: {
    flex: 1,
    padding: 8,
    paddingRight: 40,
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
  },
  clearButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 18,
  },
});

export default NutritionCalculator; 