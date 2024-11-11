import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ExerciseCalculator from '../components/ExerciseCalculator';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

const CreateScreen = () => {
  const [date] = useState(new Date());

  const handleExerciseSubmit = async (exercises: Array<{ name: string, minutes: number, caloriesBurned: number }>, totalCalories: number) => {
    try {
      const entry = {
        date: date.toISOString().split('T')[0],
        exercises,
        totalCaloriesBurned: totalCalories
      };

      const response = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise entry');
      }

      Alert.alert('Success', 'Exercise entry saved successfully');
    } catch (error) {
      console.error('Error saving exercise entry:', error);
      Alert.alert('Error', 'Failed to save exercise entry');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateButton}>
        <Text style={styles.dateText}>
          Date: {date.toISOString().split('T')[0]}
        </Text>
      </View>

      <ExerciseCalculator onSubmit={handleExerciseSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 15,
  },
  dateButton: {
    backgroundColor: COLORS.darkPurple,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateScreen; 