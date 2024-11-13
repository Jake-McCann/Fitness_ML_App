import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
          style={[styles.tab, activeTab === 'exercise' && styles.activeTab]}
          onPress={() => setActiveTab('exercise')}
        >
          <Text style={[styles.tabText, activeTab === 'exercise' && styles.activeTabText]}>
            Exercise
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
            Nutrition
          </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.darkPurple,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: COLORS.darkPurple,
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: COLORS.darkPurple,
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