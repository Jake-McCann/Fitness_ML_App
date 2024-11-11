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

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseText}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>
        {item.minutes} mins • {item.caloriesBurned} calories
      </Text>
    </View>
  );

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
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.totalCalories}>
                {item.totalCaloriesBurned} calories
              </Text>
            </View>
            
            {expandedDay === item.date && (
              <View style={styles.exerciseList}>
                <FlatList
                  data={item.exercises}
                  keyExtractor={(exercise, index) => `${item.date}-${index}`}
                  renderItem={renderExerciseItem}
                  scrollEnabled={false}
                />
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
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCalories: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.white,
    paddingTop: 10,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseText: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseDetails: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
});

export default HistoryScreen;