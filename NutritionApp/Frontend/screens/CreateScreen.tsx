import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCalculator from '../components/ExerciseCalculator';
import NutritionCalculator from '../components/NutritionCalculator';
import WorkoutCalculator from '../components/WorkoutCalculator';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

const CreateScreen = () => {
  const [activeTab, setActiveTab] = useState<'exercise' | 'nutrition'>('exercise');
  const [exerciseSubTab, setExerciseSubTab] = useState<'general' | 'workouts'>('general');
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

  const handleWorkoutSubmit = async (
    workouts: Array<{ title: string; type: string; bodyPart: string }>,
    exercise?: { name: string; minutes: number; caloriesBurned: number }
  ) => {
    try {
      // Calculate calories first
      if (exercise) {
        const caloriesPerHour = exercise.name === 'Weight lifting, light workout' ? 211 : 422;
        const caloriesBurned = Math.round((caloriesPerHour / 60) * exercise.minutes);
        exercise.caloriesBurned = caloriesBurned;

        // Save exercise with calculated calories
        const exerciseResponse = await fetch(`${API_URL}/api/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date.toISOString().split('T')[0],
            exercises: [exercise],
            totalCaloriesBurned: caloriesBurned,
          }),
        });

        if (!exerciseResponse.ok) {
          throw new Error('Failed to save exercise data');
        }
      }

      // Save workouts
      const workoutResponse = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          workouts,
        }),
      });

      if (!workoutResponse.ok) {
        throw new Error('Failed to save workout data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save data');
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

      {activeTab === 'exercise' && (
        <View style={styles.subTabContainer}>
          <TouchableOpacity 
            style={[styles.subTab]}
            onPress={() => setExerciseSubTab('general')}
          >
            <Text style={[
              styles.subTabText,
              exerciseSubTab === 'general' && styles.activeSubTabText
            ]}>
              General
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subTab]}
            onPress={() => setExerciseSubTab('workouts')}
          >
            <Text style={[
              styles.subTabText,
              exerciseSubTab === 'workouts' && styles.activeSubTabText
            ]}>
              Workouts
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dateButton}>
        <Text style={styles.dateText}>
          Date: {date.toISOString().split('T')[0]}
        </Text>
      </View>

      {activeTab === 'exercise' ? (
        exerciseSubTab === 'general' ? (
          <ExerciseCalculator onSubmit={handleExerciseSubmit} />
        ) : (
          <WorkoutCalculator onSubmit={handleWorkoutSubmit} />
        )
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
  subTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.darkPurple,
    paddingVertical: 10,
  },
  subTab: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  subTabText: {
    color: COLORS.white,
    fontSize: 16,
  },
  activeSubTabText: {
    color: COLORS.yellow,
    fontWeight: 'bold',
  },
});

export default CreateScreen; 