from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from typing import Dict, List, Tuple
import glob
import json
import os
import numpy as np
import pickle
from datetime import datetime, timedelta

class HabitModificationModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.modification_model = self._build_model()
        self.modification_model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )

    def _build_model(self) -> tf.keras.Model:
        # Changed input shape from (30, 26) to (26,) - single day features
        inputs = tf.keras.Input(shape=(26,))
        
        # Replace LSTM layers with Dense layers
        x = tf.keras.layers.Dense(256, activation='relu')(inputs)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        
        x = tf.keras.layers.Dense(128, activation='relu')(x)
        x = tf.keras.layers.BatchNormalization()(x)
        x = tf.keras.layers.Dropout(0.2)(x)
        
        outputs = tf.keras.layers.Dense(19)(x)
        
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.0001)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae']
        )
        
        return model

    def _process_entry(self, entry: Dict) -> Tuple[List[float], List[float]]:
        # Extract features
        features = [
            entry.get('totalCaloriesConsumed', 0),
            entry.get('totalFat', 0),
            entry.get('totalProtein', 0),
            entry.get('totalCarbohydrates', 0),
            entry.get('totalSugars', 0),
            entry.get('totalSaturatedFats', 0),
            len(entry.get('exercises', [])),  # numExercises
            sum(ex.get('minutes', 0) for ex in entry.get('exercises', [])),  # exerciseMinutes
            entry.get('totalCaloriesBurned', 0)
        ]

        # Add boolean flags for worked muscle groups
        worked_muscles = {workout['bodyPart'].lower() for workout in entry.get('workouts', [])}
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves', 
                        'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 
                        'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders', 
                        'traps', 'triceps']
        
        features.extend([1.0 if muscle in worked_muscles else 0.0 for muscle in muscle_groups])

        return features

    def _process_target(self, metrics: Dict) -> List[float]:
        targets = [
            metrics.get('weightChange', 0),
            metrics.get('cardiovascularEndurance', 100)
        ]
        
        # Add muscle strength values
        muscle_strength = metrics.get('muscleStrength', {})
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves', 
                        'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 
                        'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders', 
                        'traps', 'triceps']
        
        targets.extend([muscle_strength.get(muscle, 100) for muscle in muscle_groups])
        
        return targets

    def _prepare_sequences(self, features: List[List[float]], targets: List[List[float]], 
                          sequence_length: int = 30) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences of past days for training."""
        X, y = [], []
        
        for i in range(len(features) - sequence_length):
            X.append(features[i:i + sequence_length])
            y.append(targets[i + sequence_length])
        
        return np.array(X), np.array(y)

    def train_on_datasets(self, data_dir: str, output_dir: str):
        """Train model on paired input/output files representing full years of data."""
        input_files = glob.glob(os.path.join(data_dir, "mock_input_*.json"))
        
        all_features = []
        all_targets = []
        
        for input_file in input_files:
            output_file = os.path.join(output_dir, f"mock_output_{os.path.basename(input_file).split('_')[-1]}")
            
            with open(input_file, 'r') as f:
                input_data = json.load(f)
            with open(output_file, 'r') as f:
                output_data = json.load(f)
            
            # Match each input entry with its corresponding output metrics
            entries = input_data['entries']
            metrics = output_data['healthMetrics']
            
            for entry, metric in zip(entries, metrics):
                features = self._process_entry(entry)
                targets = self._process_target(metric)
                
                all_features.append(features)
                all_targets.append(targets)
        
        # Convert to numpy arrays
        X = np.array(all_features)
        y = np.array(all_targets)
        
        # Normalize features
        X_normalized = self.scaler.fit_transform(X)
        
        # Train the model
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=20,
            restore_best_weights=True
        )
        
        self.modification_model.fit(
            X_normalized, y,
            epochs=100,
            batch_size=32,
            validation_split=0.2,
            callbacks=[early_stopping]
        )
        
        # Save the scaler
        with open('feature_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)

    def predict_metrics_for_entry(self, entry: Dict) -> Dict:
        """Predict metrics for a single historical entry."""
        features = self._process_entry(entry)
        features_array = np.array(features)  # Convert list to numpy array
        features_normalized = self.scaler.transform(features_array.reshape(1, -1))
        prediction = self.modification_model.predict(features_normalized)[0]
        return self._format_prediction(prediction, entry['date'], 0)

    def extrapolate_future_metrics(self, last_entry: Dict, last_metrics: Dict, days_ahead: int) -> List[Dict]:
        predictions = []
        current_entry = last_entry.copy()
        
        # Reset metrics to baseline for future predictions
        baseline_metrics = {
            'date': last_entry['date'],
            'weightChange': 0,  # Reset weight change to 0
            'cardiovascularEndurance': 100,  # Reset to baseline 100
            'muscleStrength': {
                muscle: 100  # Reset all muscles to baseline 100
                for muscle in last_metrics['muscleStrength'].keys()
            }
        }
        
        current_metrics = baseline_metrics.copy()
        
        for day in range(days_ahead):
            # Update date
            next_date = (datetime.strptime(current_entry['date'], '%Y-%m-%d') + 
                        timedelta(days=1)).strftime('%Y-%m-%d')
            current_entry['date'] = next_date
            
            # Modify entry based on previous prediction
            if predictions:
                last_pred = predictions[-1]
                # Update calories burned based on cardio improvement
                cardio_factor = last_pred['cardiovascularEndurance'] / 100.0
                if 'exercises' in current_entry:
                    for ex in current_entry['exercises']:
                        ex['caloriesBurned'] *= cardio_factor
                    current_entry['totalCaloriesBurned'] = sum(ex['caloriesBurned'] 
                                                             for ex in current_entry['exercises'])
            
            # Make prediction
            features = self._process_entry(current_entry)
            features_array = np.array(features)
            features_normalized = self.scaler.transform(features_array.reshape(1, -1))
            prediction = self.modification_model.predict(features_normalized)[0]
            pred_dict = self._format_prediction(prediction, next_date, 0)
            predictions.append(pred_dict)
            
            # Update current metrics for next iteration
            current_metrics = pred_dict
        
        return predictions

    def _get_or_pad_sequence(self, entry: Dict, sequence_length: int = 30) -> np.ndarray:
        """Create a sequence from entry history or pad with zeros."""
        # In real implementation, you'd want to get actual historical data
        sequence = np.zeros((sequence_length, 26))
        features = self._process_entry(entry)
        sequence[-1] = features
        return sequence

    def _update_entry_with_prediction(self, entry: Dict, prediction: Dict) -> Dict:
        """Update entry based on predictions for next iteration."""
        new_entry = entry.copy()
        new_entry["date"] = prediction["date"]
        
        # Maintain the same exercise patterns but adjust effectiveness
        # based on improved cardiovascular endurance and muscle strength
        cardio_improvement = prediction["cardiovascularEndurance"] / 100.0
        
        # Adjust calories burned based on improved cardiovascular endurance
        if "exercises" in new_entry:
            for exercise in new_entry["exercises"]:
                exercise["caloriesBurned"] = int(exercise["caloriesBurned"] * cardio_improvement)
            new_entry["totalCaloriesBurned"] = sum(ex["caloriesBurned"] for ex in new_entry["exercises"])
        
        return new_entry

    def load_trained_model(self, model_path: str, scaler_path: str):
        """Load the trained model and scaler."""
        # Update path if using .h5 extension
        if model_path.endswith('.h5'):
            model_path = model_path.replace('.h5', '.keras')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}. Please train the model first.")
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Scaler file not found: {scaler_path}. Please train the model first.")
        
        self.modification_model.load_weights(model_path)
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)

    def trend_accuracy(self, y_true, y_pred):
        """Custom metric to measure if the model correctly predicts improvement trends."""
        trend_true = y_true[1:] - y_true[:-1]
        trend_pred = y_pred[1:] - y_pred[:-1]
        return tf.reduce_mean(tf.cast(tf.sign(trend_true) == tf.sign(trend_pred), tf.float32))

    def _format_prediction(self, prediction: np.ndarray, base_date: str, days_ahead: int) -> Dict:
        """Format the model's prediction into a structured dictionary."""
        # Calculate the future date
        future_date = (datetime.strptime(base_date, "%Y-%m-%d") + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        
        # Define muscle groups in the same order as the model output
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves', 
                        'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 
                        'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders', 
                        'traps', 'triceps']
        
        return {
            "date": future_date,
            "weightChange": float(prediction[0]),
            "cardiovascularEndurance": float(prediction[1]),
            "muscleStrength": {
                muscle: float(val) 
                for muscle, val in zip(muscle_groups, prediction[2:])
            }
        }