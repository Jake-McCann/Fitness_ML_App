import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { API_URL } from '@env';
import { Picker } from '@react-native-picker/picker';

interface Recommendation {
  weightChange: number;
  cardiovascularEndurance: number;
  muscleStrength: { [key: string]: number };
}

interface MuscleTarget {
  muscle: string;
  improvement: string;
}

const SuggestionsScreen = () => {
  const [timeframe, setTimeframe] = useState('');
  const [weightChange, setWeightChange] = useState('');
  const [cardioImprovement, setCardioImprovement] = useState('');
  const [muscleTargets, setMuscleTargets] = useState<MuscleTarget[]>([]);
  const [currentMuscle, setCurrentMuscle] = useState('');
  const [currentImprovement, setCurrentImprovement] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const MUSCLE_OPTIONS = [
    'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 
    'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 
    'lowerBack', 'middleBack', 'neck', 'quadriceps', 
    'shoulders', 'traps', 'triceps',
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!timeframe || !weightChange || !cardioImprovement) {
        Alert.alert('Error', 'Please fill in all fields');
        setLoading(false);
        return;
      }

      const cardioTarget = 100 + Number(cardioImprovement);
      const weightChangeNum = Number(weightChange);

      const targetDate = new Date(Date.now() + Number(timeframe) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const muscleStrength = Object.fromEntries(
        MUSCLE_OPTIONS.map((muscle) => {
          const target = muscleTargets.find((t) => t.muscle === muscle);
          return [muscle, target ? 100 + Number(target.improvement) : 100];
        })
      );

      const target_metrics = {
        date: targetDate,
        weightChange: weightChangeNum,
        cardiovascularEndurance: cardioTarget,
        muscleStrength,
      };

      const response = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe_days: Number(timeframe),
          target_metrics: target_metrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data); 
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendations = () => {
    if (!recommendations) return null;
  
    const { weightChange: predictedWeightChange, cardiovascularEndurance, muscleStrength } = recommendations;
  
    const targetWeightChange = weightChange ? Number(weightChange) : null;
    const targetCardio = cardioImprovement ? Number(cardioImprovement) : null;
  
    const calculateDifference = (predicted: number, target: number) => {
      const diff = predicted - target;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`;
    };
  
    const suggestChanges = () => {
      const suggestions: string[] = [];
    
      if (targetWeightChange !== null && timeframe) {
        const netWeightDifference = predictedWeightChange - targetWeightChange; 
        const dailyCalorieAdjustment = (Math.abs(netWeightDifference) / Number(timeframe)) * 3500;
    
        if (netWeightDifference > 0) {
          suggestions.push(
            `Your calorie count is too high. Decrease your daily intake by ${dailyCalorieAdjustment.toFixed(
              0
            )} calories per day.`
          );
        } else if (netWeightDifference < 0) {
          suggestions.push(
            `Your calorie count is too low. Increase your daily intake by ${dailyCalorieAdjustment.toFixed(
              0
            )} calories per day.`
          );
        }
      }
    
      if (targetCardio !== null) {
        const diff = cardiovascularEndurance - targetCardio; 
        if (diff < 0) {
          suggestions.push('Do more cardio-intensive exercises (running, hiking, biking, etc.) and cut back on sugar and saturated fats.');
        }
      }

      muscleTargets.forEach((target) => {
        const predicted = muscleStrength[target.muscle] || 100;
        const targetValue = 100 + Number(target.improvement);
    
        if (predicted < targetValue) {
          suggestions.push(
            `You need to do more exercises focused on your ${target.muscle.charAt(0).toUpperCase() + target.muscle.slice(1)}.`
          );
        }
      });
    
      return suggestions;
    };
    
  
    const suggestions = suggestChanges();
  
    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Predicted Changes</Text>
  
        {predictedWeightChange !== null && (
          <View style={styles.projectionCard}>
            <Text style={styles.projectionTitle}>Weight Change</Text>
            <Text style={styles.projectionText}>
              {predictedWeightChange.toFixed(2)} lbs
              {targetWeightChange !== null && (
                <Text style={styles.offTarget}>
                  {' (' + calculateDifference(predictedWeightChange, targetWeightChange) + ' lbs off from target)'}
                </Text>
              )}
            </Text>
          </View>
        )}
  
        {cardiovascularEndurance !== null && (
          <View style={styles.projectionCard}>
            <Text style={styles.projectionTitle}>Cardiovascular Endurance</Text>
            <Text style={styles.projectionText}>
              {cardiovascularEndurance.toFixed(2)}%
              {targetCardio !== null && (
                <Text style={styles.offTarget}>
                  {' (' + calculateDifference(cardiovascularEndurance, targetCardio) + '% off from target)'}
                </Text>
              )}
            </Text>
          </View>
        )}
  
        {Object.entries(muscleStrength).map(([muscle, change]) => {
          const target = muscleTargets.find((m) => m.muscle === muscle);
          return (
            <View key={muscle} style={styles.projectionCard}>
              <Text style={styles.projectionTitle}>
                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
              </Text>
              <Text style={styles.projectionText}>
                {change.toFixed(2)}%
                {target && (
                  <Text style={styles.offTarget}>
                    {' (' + calculateDifference(change, 100 + Number(target.improvement) - 100) + '% off from target)'}
                  </Text>
                )}
              </Text>
            </View>
          );
        })}
  
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Recommendations</Text>
            {suggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };
  

  const renderMuscleInputs = () => {
    return (
      <View>
        <View style={styles.input}>
          <Picker
            selectedValue={currentMuscle}
            style={styles.input}
            onValueChange={(value) => setCurrentMuscle(value)}
          >
            <Picker.Item label="Select muscle group" value="" />
            {MUSCLE_OPTIONS.map((muscle) => (
              <Picker.Item
                key={muscle}
                label={muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                value={muscle}
              />
            ))}
          </Picker>

          <TextInput
            style={styles.input}
            value={currentImprovement}
            onChangeText={setCurrentImprovement}
            keyboardType="numeric"
            placeholder="% improvement"
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (currentMuscle && currentImprovement) {
                setMuscleTargets((prev) => [
                  ...prev,
                  { muscle: currentMuscle, improvement: currentImprovement },
                ]);
                setCurrentMuscle('');
                setCurrentImprovement('');
              }
            }}
          >
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {muscleTargets.map((target, index) => (
          <View key={index} style={styles.muscleTargetRow}>
            <Text style={styles.muscleTargetText}>
              {target.muscle.charAt(0).toUpperCase() + target.muscle.slice(1)}: {target.improvement}%
            </Text>
            <TouchableOpacity
              onPress={() => {
                const newTargets = [...muscleTargets];
                newTargets.splice(index, 1);
                setMuscleTargets(newTargets);
              }}
            >
              <Text style={styles.removeButton}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Timeframe (days):</Text>
        <TextInput
          style={styles.input}
          value={timeframe}
          onChangeText={setTimeframe}
          keyboardType="numeric"
          placeholder="Enter number of days"
        />

        <Text style={styles.label}>Weight Change (lbs):</Text>
        <TextInput
          style={styles.input}
          value={weightChange}
          onChangeText={setWeightChange}
          keyboardType="numeric"
          placeholder="Enter target weight change"
        />

        <Text style={styles.label}>Cardiovascular Improvement (%):</Text>
        <TextInput
          style={styles.input}
          value={cardioImprovement}
          onChangeText={setCardioImprovement}
          keyboardType="numeric"
          placeholder="Enter target improvement"
        />

        <Text style={styles.sectionTitle}>Muscle Group Improvements</Text>
        {renderMuscleInputs()}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Get Recommendations'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderRecommendations()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: COLORS.darkPurple,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightPurple,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: COLORS.darkPurple,
  },
  button: {
    backgroundColor: COLORS.darkPurple,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkPurple,
    marginBottom: 15,
    textAlign: 'center',
  },
  projectionCard: {
    backgroundColor: COLORS.lightPurple,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  projectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  projectionText: {
    fontSize: 16,
    color: COLORS.white,
    lineHeight: 22,
  },
  offTarget: {
    color: COLORS.yellow,
    fontSize: 14,
    fontWeight: 'bold',
  },
  muscleTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.lightPurple,
    borderRadius: 5,
    marginBottom: 5,
  },
  muscleTargetText: {
    color: COLORS.white,
    fontSize: 16,
  },
  removeButton: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.darkPurple,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.lightPurple,
    borderRadius: 10,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 5,
  },
});

export default SuggestionsScreen;
