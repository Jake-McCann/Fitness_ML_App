import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCalculator from '../components/ExerciseCalculator';
import NutritionCalculator from '../components/NutritionCalculator';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

const CreateScreen = () => {
  const [activeTab, setActiveTab] = useState<'exercise' | 'nutrition'>('exercise');
  const [date] = useState(new Date());

  const handleExerciseSubmit = async (
    exercises: Array<{ name: string; minutes: number; caloriesBurned: number }>,
    totalCalories: number
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          exercises,
          totalCaloriesBurned: totalCalories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise data');
      }
    } catch (error) {
      console.error('Error saving exercise data:', error);
      Alert.alert('Error', 'Failed to save exercise data');
    }
  };

  const handleNutritionSubmit = async (
    foods: Array<{ name: string; calories: number; servings: number }>,
    totalCalories: number
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          foods,
          totalCaloriesConsumed: totalCalories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save nutrition data');
      }
    } catch (error) {
      console.error('Error saving nutrition data:', error);
      Alert.alert('Error', 'Failed to save nutrition data');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab]}
          onPress={() => setActiveTab('exercise')}
        >
          <Ionicons 
            name="barbell-outline" 
            size={24} 
            color={activeTab === 'exercise' ? COLORS.yellow : COLORS.white} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Ionicons 
            name="restaurant-outline" 
            size={24} 
            color={activeTab === 'nutrition' ? COLORS.yellow : COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.dateButton}>
        <Text style={styles.dateText}>
          Date: {date.toISOString().split('T')[0]}
        </Text>
      </View>

      {activeTab === 'exercise' ? (
        <ExerciseCalculator onSubmit={handleExerciseSubmit} />
      ) : (
        <NutritionCalculator onSubmit={handleNutritionSubmit} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkPurple,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dateButton: {
    backgroundColor: COLORS.lightPurple,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateScreen; 