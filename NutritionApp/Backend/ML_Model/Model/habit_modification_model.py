import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from typing import Dict, List, Tuple
import glob
import json
import os

class HabitModificationModel:
    def __init__(self):
        self.scaler = StandardScaler()
        # Add muscle name mapping
        self.muscle_mapping = {
            "abdominals": 0, "abductors": 1, "adductors": 2, "biceps": 3,
            "calves": 4, "chest": 5, "forearms": 6, "glutes": 7,
            "hamstrings": 8, "lats": 9, "lowerBack": 10, "middleBack": 11,
            "neck": 12, "quadriceps": 13, "shoulders": 14, "traps": 15, "triceps": 16,
            "none": 17
        }
        self.reverse_muscle_mapping = {v: k for k, v in self.muscle_mapping.items()}
        self.modification_model = self._build_model()
        self.modification_model.compile(
            optimizer='adam',
            loss={
                'diet_modifications': 'mse',
                'exercise_modifications': 'mse'
            },
            metrics={
                'diet_modifications': ['mae'],
                'exercise_modifications': ['mae']
            }
        )
        
    def _build_model(self) -> tf.keras.Model:
        """Build the neural network model"""
        input_layer = tf.keras.layers.Input(shape=(7, 11))
        
        # Flatten the input to work with Dense layers
        x = tf.keras.layers.Flatten()(input_layer)
        
        # Dense layers for different modification types
        x = tf.keras.layers.Dense(128, activation='relu')(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        x = tf.keras.layers.Dense(64, activation='relu')(x)
        
        diet_mods = tf.keras.layers.Dense(32, activation='relu')(x)
        exercise_mods = tf.keras.layers.Dense(32, activation='relu')(x)
        
        # Output layers
        diet_output = tf.keras.layers.Dense(self._get_diet_output_dim(), name='diet_modifications')(diet_mods)
        exercise_output = tf.keras.layers.Dense(self._get_exercise_output_dim(), name='exercise_modifications')(exercise_mods)
        
        return tf.keras.Model(inputs=input_layer, outputs=[diet_output, exercise_output])
    
    def train_on_datasets(self, data_dir: str, output_dir: str):
        """Train model on multiple input/output dataset pairs"""
        # Load all training data
        input_files = glob.glob(f"{data_dir}/mock_input_*.json")
        print(f"Found {len(input_files)} input files in {data_dir}")
        
        if not input_files:
            raise ValueError(f"No input files found matching pattern 'mock_input_*.json' in {data_dir}")
        
        training_data = []
        
        for input_file in input_files:
            # Get corresponding output file
            output_file = f"{output_dir}/mock_output_{os.path.basename(input_file).split('_')[-1]}"
            print(f"Processing input file: {input_file}")
            print(f"Looking for output file: {output_file}")
            
            if not os.path.exists(output_file):
                print(f"Warning: No matching output file found for {input_file}")
                continue
                
            print(f"Found matching pair, loading data...")
            
            # Load data pair
            with open(input_file, 'r') as f:
                input_data = json.load(f)
            with open(output_file, 'r') as f:
                output_data = json.load(f)
                
            # Process into training sequences
            X, y = self._prepare_training_sequence(input_data, output_data)
            training_data.append((X, y))
            print(f"Successfully processed file pair")
        
        if not training_data:
            raise ValueError("No valid training data pairs found. Check your data directory paths and file naming.")
        
        # Combine all training data
        X_train = np.concatenate([x for x, _ in training_data])
        y_train = [
            np.concatenate([y[0] for _, y in training_data]),  # diet modifications
            np.concatenate([y[1] for _, y in training_data])   # exercise modifications
        ]
        
        # Train model
        self.modification_model.fit(
            X_train,
            y_train,
            epochs=50,
            batch_size=32,
            validation_split=0.2
        )
        
    def _prepare_training_sequence(self, 
                                 input_data: Dict, 
                                 output_data: Dict) -> Tuple[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
        """Convert input/output pair into training sequences"""
        sequences = []
        diet_targets = []
        exercise_targets = []
        
        # Process each day's data into a sequence
        for i in range(len(input_data['entries']) - 1):  # -1 because we need the next day's results
            # Current sequence of days (e.g., 7 days of history)
            sequence = input_data['entries'][i:i+7]
            
            # Extract features from sequence
            sequence_features = self._extract_sequence_features(sequence)
            
            # Get target modifications (difference between current and next day)
            current_metrics = self._extract_metrics(input_data['entries'][i])
            next_metrics = self._extract_metrics(input_data['entries'][i+1])
            
            diet_target = self._compute_diet_modifications(current_metrics, next_metrics)
            exercise_target = self._compute_exercise_modifications(current_metrics, next_metrics)
            
            sequences.append(sequence_features)
            diet_targets.append(diet_target)
            exercise_targets.append(exercise_target)
        
        return (
            np.array(sequences),
            (np.array(diet_targets), np.array(exercise_targets))
        )
        
    def _extract_sequence_features(self, sequence: List[Dict]) -> np.ndarray:
        """Extract features from a sequence of days"""
        # Ensure consistent sequence length by padding or truncating
        sequence_length = 7  # Fixed length for all sequences
        if len(sequence) < sequence_length:
            # Pad with copies of the last day if sequence is too short
            last_day = sequence[-1]
            sequence = sequence + [last_day] * (sequence_length - len(sequence))
        elif len(sequence) > sequence_length:
            # Truncate if sequence is too long
            sequence = sequence[:sequence_length]
        
        features = []
        for day in sequence:
            day_features = [
                day['totalCaloriesConsumed'],
                day['totalCaloriesBurned'],
                day['totalProtein'],
                day['totalCarbohydrates'],
                day['totalFat'],
                # Exercise features
                len(day['exercises']),
                sum(ex['minutes'] for ex in day['exercises']),
                sum(ex['caloriesBurned'] for ex in day['exercises']),
                # Workout features
                len(day['workouts']),
                len([w for w in day['workouts'] if w['type'] == 'Strength']),
                len([w for w in day['workouts'] if w['type'] == 'Cardio'])
            ]
            features.append(day_features)
        return np.array(features)
    
    def _compute_diet_modifications(self, current: Dict, target: Dict) -> np.ndarray:
        """Compute required diet modifications to reach target"""
        return np.array([
            target['totalCaloriesConsumed'] - current['totalCaloriesConsumed'],
            target['totalProtein'] - current['totalProtein'],
            target['totalCarbohydrates'] - current['totalCarbohydrates'],
            target['totalFat'] - current['totalFat']
        ])
        
    def _compute_exercise_modifications(self, current: Dict, target: Dict) -> np.ndarray:
        """Compute required exercise modifications to reach target"""
        # Calculate differences in muscle strength and cardio
        muscle_diffs = {
            muscle: target['muscleStrength'].get(muscle, 0) - current['muscleStrength'].get(muscle, 0)
            for muscle in set(current['muscleStrength'].keys()) | set(target['muscleStrength'].keys())
        }
        
        cardio_diff = target.get('cardiovascularEndurance', 0) - current.get('cardiovascularEndurance', 0)
        
        # Get unique priority muscles by sorting and removing duplicates
        priority_muscles = sorted(
            set(muscle_diffs.items()),  # Convert to set to remove duplicates
            key=lambda x: abs(x[1]), 
            reverse=True
        )[:3]
        
        # Pad with zeros if we have fewer than 3 muscles
        while len(priority_muscles) < 3:
            priority_muscles.append(('none', 0.0))
        
        # Convert muscle names to indices
        muscle_indices = [self.muscle_mapping[muscle] for muscle, _ in priority_muscles]
        
        # Return numerical array
        return np.array([
            cardio_diff,
            *muscle_indices,
            *[diff for _, diff in priority_muscles]
        ])
        
    def recommend_modifications(self, 
                              history_data: Dict, 
                              target_metrics: Dict,
                              timeframe_days: int) -> Dict:
        """Generate recommended modifications based on history and targets"""
        # Extract recent history sequence
        recent_sequence = history_data['entries'][-7:]  # Last 7 days
        sequence_features = self._extract_sequence_features(recent_sequence)
        
        # Reshape to include batch dimension: (batch_size=1, sequence_length=7, features=11)
        sequence_features = sequence_features.reshape(1, 7, 11)

        # Get model predictions using transformed metrics
        diet_mods, exercise_mods = self.modification_model.predict(
            sequence_features
        )
        
        # Return recommendations in the original format
        return {
            'recommendedChanges': {
                'diet': self._format_diet_recommendations(diet_mods),
                'exercise': self._format_exercise_recommendations(exercise_mods)
            }
        }
    
    def _get_feature_dim(self):
        """
        Returns the dimension of the input features based on actual extraction.
        Currently extracting 11 features per day:
        - totalCaloriesConsumed
        - totalCaloriesBurned
        - totalProtein
        - totalCarbohydrates
        - totalFat
        - number of exercises
        - total exercise minutes
        - total calories burned from exercises
        - number of workouts
        - number of strength workouts
        - number of cardio workouts
        """
        return 11  # Match the actual features being extracted in _extract_sequence_features

    def _get_diet_output_dim(self) -> int:
        """
        Returns the dimension of diet modification outputs:
        - calorie adjustment
        - protein adjustment
        - carbs adjustment
        - fat adjustment
        """
        return 4  # Increase from 1 to 4 to match our formatting expectations

    def _get_exercise_output_dim(self) -> int:
        """
        Returns the dimension of exercise modification outputs:
        - cardiovascular adjustment needed
        - top 3 muscle names that need work
        - differences for those 3 muscles
        """
        return 7  # 1 cardio + 3 muscle names + 3 differences

    def _extract_metrics(self, day_data: Dict) -> Dict:
        """Extract relevant metrics from a single day's data"""
        metrics = {
            'totalCaloriesConsumed': day_data['totalCaloriesConsumed'],
            'totalCaloriesBurned': day_data['totalCaloriesBurned'],
            'totalProtein': day_data['totalProtein'],
            'totalCarbohydrates': day_data['totalCarbohydrates'],
            'totalFat': day_data['totalFat'],
            'exercises': day_data.get('exercises', []),
            'workouts': day_data.get('workouts', [])
        }
        
        # Initialize default muscle strength values if not present
        metrics['muscleStrength'] = {
            "abdominals": 0, "abductors": 0, "adductors": 0, "biceps": 0,
            "calves": 0, "chest": 0, "forearms": 0, "glutes": 0,
            "hamstrings": 0, "lats": 0, "lowerBack": 0, "middleBack": 0,
            "neck": 0, "quadriceps": 0, "shoulders": 0, "traps": 0, "triceps": 0
        }
        
        # Update with actual values if present
        if 'muscleStrength' in day_data:
            metrics['muscleStrength'].update(day_data['muscleStrength'])
        
        # Set default cardiovascular endurance if not present
        metrics['cardiovascularEndurance'] = day_data.get('cardiovascularEndurance', 0)
        
        return metrics

    def _format_diet_recommendations(self, diet_mods) -> Dict:
        """Format diet modifications into readable recommendations"""
        # Extract the first prediction since we only have one sample
        mods = diet_mods[0]
        
        # Debug print to see what we're getting
        print(f"Diet mods shape: {diet_mods.shape}")
        print(f"Diet mods values: {diet_mods}")
        
        # For now, return only calorie adjustment until we fix the dimensions
        return {
            'calorie_adjustment': float(mods[0]),
            # Add other adjustments only if they exist
            **({'protein_adjustment': float(mods[1])} if len(mods) > 1 else {}),
            **({'carbs_adjustment': float(mods[2])} if len(mods) > 2 else {}),
            **({'fat_adjustment': float(mods[3])} if len(mods) > 3 else {})
        }

    def _format_exercise_recommendations(self, exercise_mods) -> Dict:
        """Format exercise modifications into readable recommendations"""
        mods = exercise_mods[0]  # Get first prediction
        
        cardio_adjustment = float(mods[0])
        muscle_indices = mods[1:4].astype(int)  # Convert to integers for mapping
        muscle_diffs = mods[4:7]  # Last 3 values are the differences
        
        # Convert indices back to muscle names
        muscle_names = [self.reverse_muscle_mapping[idx] for idx in muscle_indices]
        
        recommendations = {
            'cardiovascular': {
                'adjustment_needed': cardio_adjustment,
                'recommendation': 'Increase cardio intensity' if cardio_adjustment > 0 else 'Maintain current cardio routine'
            },
            'muscle_focus': []
        }
        
        # Add specific muscle recommendations
        for muscle, diff in zip(muscle_names, muscle_diffs):
            if muscle != 'none' and diff > 0:
                recommendations['muscle_focus'].append({
                    'muscle': muscle,
                    'adjustment': float(diff),
                    'recommendation': f'Add more {muscle} focused exercises'
                })
        
        return recommendations