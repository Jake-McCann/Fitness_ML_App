import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../config';

interface Exercise {
  name: string;
  minutes: number;
  caloriesBurned: number;
}

interface Workout {
  title: string;
  type: string;
  bodyPart: string;
}

interface FoodEntry {
  name: string;
  servings: number;
  calories: number;
}

interface DayEntry {
  date: string;
  exercises: Exercise[];
  totalCaloriesBurned: number;
  totalCaloriesConsumed: number;
  foods: FoodEntry[];
  workouts: Workout[];
}

type SectionItem = Exercise | FoodEntry | Workout;

const HistoryScreen = () => {
  const [historyData, setHistoryData] = useState<DayEntry[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<{
    date: string;
    section: 'exercise' | 'nutrition' | 'workouts' | null;
  }>({ date: '', section: null });
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHistory().finally(() => setRefreshing(false));
  }, []);

  const renderExerciseDetails = ({ item }: { item: Exercise }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailText}>{item.name}</Text>
      <Text style={styles.detailSubtext}>
        {item.minutes} mins • {item.caloriesBurned} calories
      </Text>
    </View>
  );

  const renderFoodDetails = ({ item }: { item: FoodEntry }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailText}>{item.name}</Text>
      <Text style={styles.detailSubtext}>
        {item.servings} servings • {item.calories} calories
      </Text>
    </View>
  );

  const renderWorkoutDetails = ({ item }: { item: Workout }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailText}>{item.title}</Text>
      <Text style={styles.detailSubtext}>
        {item.type} • {item.bodyPart}
      </Text>
    </View>
  );

  const renderSection = (date: string, section: 'exercise' | 'nutrition' | 'workouts', data: DayEntry) => {
    const isExpanded = expandedSection.date === date && expandedSection.section === section;
    let sectionData: any[];
    let sectionTitle: string;
    let totalDisplay: string | null = null;

    switch (section) {
      case 'exercise':
        sectionData = data.exercises || [];
        sectionTitle = 'Exercise';
        totalDisplay = `Burned: ${data.totalCaloriesBurned || 0}`;
        break;
      case 'nutrition':
        sectionData = data.foods || [];
        sectionTitle = 'Nutrition';
        totalDisplay = `Consumed: ${data.totalCaloriesConsumed || 0}`;
        break;
      case 'workouts':
        sectionData = data.workouts || [];
        sectionTitle = 'Workouts';
        break;
    }

    return (
      <TouchableOpacity 
        style={styles.sectionContainer}
        onPress={() => setExpandedSection(
          isExpanded ? { date: '', section: null } : { date, section }
        )}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {totalDisplay && (
            <Text style={styles.sectionCalories}>{totalDisplay}</Text>
          )}
        </View>

        {isExpanded && (
          <FlatList<SectionItem>
            data={sectionData}
            renderItem={({ item }) => {
              if (section === 'exercise') {
                return renderExerciseDetails({ item: item as Exercise });
              } else if (section === 'nutrition') {
                return renderFoodDetails({ item: item as FoodEntry });
              } else {
                return renderWorkoutDetails({ item: item as Workout });
              }
            }}
            keyExtractor={(item, index) => `${date}-${section}-${index}`}
            scrollEnabled={false}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderDayEntry = ({ item }: { item: DayEntry }) => (
    <TouchableOpacity 
      style={styles.dayCard}
      onPress={() => setExpandedDay(expandedDay === item.date ? null : item.date)}
    >
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.totalCalories}>
          Net Calories: {(item.totalCaloriesConsumed || 0) - (item.totalCaloriesBurned || 0)}
        </Text>
      </View>
      
      {expandedDay === item.date && (
        <View style={styles.sectionsContainer}>
          {renderSection(item.date, 'exercise', item)}
          {renderSection(item.date, 'nutrition', item)}
          {renderSection(item.date, 'workouts', item)}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderNutritionTotals = (entry: DayEntry) => (
    <View style={styles.totalsContainer}>
      <Text style={styles.totalText}>Daily Totals:</Text>
      <Text style={styles.totalSubtext}>Calories: {entry.totalCaloriesConsumed}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.darkPurple]}
            tintColor={COLORS.darkPurple}
          />
        }
        renderItem={renderDayEntry}
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
  sectionsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCalories: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  detailItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailText: {
    color: COLORS.white,
    fontSize: 14,
  },
  detailSubtext: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  totalsContainer: {
    backgroundColor: COLORS.darkPurple,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  totalText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalSubtext: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 2,
  },
});

export default HistoryScreen;