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
    'shoulders', 'traps', 'triceps'
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
        MUSCLE_OPTIONS.map(muscle => {
          const target = muscleTargets.find(t => t.muscle === muscle);
          return [
            muscle,
            target ? 100 + Number(target.improvement) : 100
          ];
        })
      );
  
      const target_metrics = {
        date: targetDate,
        weightChange: weightChangeNum,
        cardiovascularEndurance: cardioTarget,
        muscleStrength
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
      setRecommendations(data); // Store returned metrics in state
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };  

  const renderRecommendations = () => {
    if (!recommendations) return null;
  
    const { weightChange, cardiovascularEndurance, muscleStrength } = recommendations;
  
    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Predicted Changes</Text>
  
        <View style={styles.projectionCard}>
          <Text style={styles.projectionTitle}>Weight Change</Text>
          <Text style={styles.projectionText}>
            {weightChange.toFixed(2)} lbs
          </Text>
        </View>
  
        <View style={styles.projectionCard}>
          <Text style={styles.projectionTitle}>Cardiovascular Endurance</Text>
          <Text style={styles.projectionText}>
            {cardiovascularEndurance.toFixed(2)}%
          </Text>
        </View>
  
        <Text style={styles.sectionTitle}>Muscle Strength Changes</Text>
        {Object.entries(muscleStrength).map(([muscle, change]) => (
          <View key={muscle} style={styles.projectionCard}>
            <Text style={styles.projectionTitle}>
              {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
            </Text>
            <Text style={styles.projectionText}>
              {change.toFixed(2)}%
            </Text>
          </View>
        ))}
      </View>
    );
  };
  

  const renderMuscleInputs = () => {
    return (
      <View>
        <View style={styles.inputColumn}>
          <Picker
            selectedValue={currentMuscle}
            style={styles.muscleInput}
            onValueChange={(value) => setCurrentMuscle(value)}
          >
            <Picker.Item label="Select muscle group" value="" />
            {MUSCLE_OPTIONS.map(muscle => (
              <Picker.Item 
                key={muscle} 
                label={muscle.charAt(0).toUpperCase() + muscle.slice(1)} 
                value={muscle} 
              />
            ))}
          </Picker>

          <TextInput
            style={styles.improvementInput}
            value={currentImprovement}
            onChangeText={setCurrentImprovement}
            keyboardType="numeric"
            placeholder="% improvement"
          />

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              if (currentMuscle && currentImprovement) {
                setMuscleTargets(prev => [...prev, { muscle: currentMuscle, improvement: currentImprovement }]);
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
            <TouchableOpacity onPress={() => {
              const newTargets = [...muscleTargets];
              newTargets.splice(index, 1);
              setMuscleTargets(newTargets);
            }}>
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
        <View style={styles.weightInputContainer}>
          <View style={styles.signButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.signButton, 
                !weightChange.startsWith('-') ? styles.signButtonActive : styles.signButtonInactive
              ]}
              onPress={() => setWeightChange(prev => prev.replace('-', ''))}
            >
              <Text style={styles.signButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.signButton, 
                weightChange.startsWith('-') ? styles.signButtonActive : styles.signButtonInactive
              ]}
              onPress={() => setWeightChange(prev => prev.startsWith('-') ? prev : `-${prev}`)}
            >
              <Text style={styles.signButtonText}>-</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weightChange.startsWith('-') ? weightChange.substring(1) : weightChange}
            onChangeText={(text) => setWeightChange(prev => prev.startsWith('-') ? `-${text}` : text)}
            keyboardType="numeric"
            placeholder="Enter target weight change"
          />
        </View>

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

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
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
  muscleItem: {
    marginLeft: 10,
    marginBottom: 5,
  },
  muscleText: {
    fontSize: 16,
    color: COLORS.white,
    lineHeight: 22,
  },
  inputColumn: {
    marginBottom: 15,
    gap: 10,
  },
  muscleInput: {
    borderWidth: 1,
    borderColor: COLORS.lightPurple,
    borderRadius: 5,
    padding: 10,
    color: COLORS.darkPurple,
  },
  improvementInput: {
    borderWidth: 1,
    borderColor: COLORS.lightPurple,
    borderRadius: 5,
    padding: 10,
    color: COLORS.darkPurple,
  },
  addButton: {
    backgroundColor: COLORS.darkPurple,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  weightInputContainer: {
    marginBottom: 15,
  },
  signButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    gap: 10,
  },
  signButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  signButtonActive: {
    backgroundColor: COLORS.darkPurple,
  },
  signButtonInactive: {
    backgroundColor: COLORS.lightPurple,
  },
  signButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  weightInput: {
    marginBottom: 0,
    color: COLORS.darkPurple,
  },
});

export default SuggestionsScreen;
