import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

interface Exercise {
  name: string;
  minutes: number;
  caloriesBurned: number;
}

interface DayEntry {
  date: string;
  exercises: Exercise[];
  totalCaloriesBurned: number;
}

const HistoryScreen = () => {
  const [historyData, setHistoryData] = useState<DayEntry[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Error', 'Failed to fetch history');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.dayCard}
            onPress={() => setExpandedDay(expandedDay === item.date ? null : item.date)}
          >
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.summaryText}>
              Calories Burned: {item.totalCaloriesBurned}
            </Text>
            {expandedDay === item.date && (
              <View style={styles.exerciseList}>
                {item.exercises.map((exercise, index) => (
                  <Text key={index} style={styles.exerciseText}>
                    {exercise.name} - {exercise.minutes} mins ({exercise.caloriesBurned} cal)
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 15,
  },
  dayCard: {
    backgroundColor: COLORS.lightPurple,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryText: {
    color: COLORS.white,
    marginTop: 5,
  },
  exerciseList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.white,
    paddingTop: 10,
  },
  exerciseText: {
    color: COLORS.white,
    marginVertical: 2,
  },
});

export default HistoryScreen;