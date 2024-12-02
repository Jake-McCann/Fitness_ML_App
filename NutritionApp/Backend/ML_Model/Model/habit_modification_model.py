from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from typing import Dict, List
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
        inputs = tf.keras.Input(shape=(26,))
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

    def _process_entry(self, entry: Dict) -> List[float]:
        #extract features
        features = [
            entry.get('totalCaloriesConsumed', 0),
            entry.get('totalFat', 0),
            entry.get('totalProtein', 0),
            entry.get('totalCarbohydrates', 0),
            entry.get('totalSugars', 0),
            entry.get('totalSaturatedFats', 0),
            len(entry.get('exercises', [])),  #numExercises
            sum(ex.get('minutes', 0) for ex in entry.get('exercises', [])),  #exerciseMinutes
            entry.get('totalCaloriesBurned', 0)
        ]

        #add booleans for worked muscle groups
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

        #add muscle strength values
        muscle_strength = metrics.get('muscleStrength', {})
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves',
                         'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
                         'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders',
                         'traps', 'triceps']

        targets.extend([muscle_strength.get(muscle, 100) for muscle in muscle_groups])

        return targets

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

            #match each input entry with its corresponding output metrics (shifted by +1 day)
            entries = input_data['entries']
            metrics = output_data['healthMetrics']

            #map features from day n to differences in targets between day n+1 and day n
            for i in range(len(entries) - 1):
                entry = entries[i]
                metric_prev = metrics[i]
                metric_next = metrics[i + 1]

                features = self._process_entry(entry)
                targets_prev = self._process_target(metric_prev)
                targets_next = self._process_target(metric_next)

                #compute the difference between targets on day n+1 and day n
                target_diff = [next_val - prev_val for prev_val, next_val in zip(targets_prev, targets_next)]

                all_features.append(features)
                all_targets.append(target_diff)

        #convert to numpy arrays
        X = np.array(all_features)
        y = np.array(all_targets)

        #normalize features
        X_normalized = self.scaler.fit_transform(X)

        #train the model
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

        #save the scaler
        with open('feature_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)

    def predict_metric_difference_for_entry(self, entry: Dict) -> np.ndarray:
        """Predict metric differences for a single entry."""
        features = self._process_entry(entry)
        features_array = np.array(features)
        features_normalized = self.scaler.transform(features_array.reshape(1, -1))
        prediction = self.modification_model.predict(features_normalized)[0]
        return prediction  #return the predicted differences as a numpy array

    def extrapolate_future_metrics(self, input_data: Dict, days_ahead: int) -> np.ndarray:
        historical_entries = input_data['entries']
        last_entry = historical_entries[-1]

        current_metrics = np.array(self._process_target({}), dtype=np.float64)
        total_changes = np.zeros_like(current_metrics)

        current_entry = last_entry
        for day in range(1, days_ahead + 1):
            future_entry = self._generate_future_entry([current_entry])
            predicted_diff = self.predict_metric_difference_for_entry(future_entry)

            current_metrics += predicted_diff
            total_changes += predicted_diff
            current_entry = future_entry

        #return the accumulated changes
        return total_changes



    def _generate_future_entry(self, historical_entries: List[Dict]) -> Dict:
        """Generate a future entry consistent with existing data."""
        #list of numerical keys to average
        numerical_keys = ['totalCaloriesConsumed', 'totalFat', 'totalProtein', 'totalCarbohydrates',
                          'totalSugars', 'totalSaturatedFats', 'totalCaloriesBurned']

        #initialize the future entry
        future_entry = {}

        #compute the mean of numerical features
        means = {}
        for key in numerical_keys:
            values = [entry.get(key, 0) for entry in historical_entries]
            means[key] = np.mean(values)

        #add some random variation
        for key in numerical_keys:
            #add noise with 5% standard deviation
            std_dev = 0.05 * means[key]
            future_entry[key] = max(0, np.random.normal(means[key], std_dev))

        #for exercises and workouts, copy from the last entry
        last_entry = historical_entries[-1]
        future_entry['exercises'] = last_entry.get('exercises', [])
        future_entry['workouts'] = last_entry.get('workouts', [])

        return future_entry

    def load_trained_model(self, model_path: str, scaler_path: str):
        """Load the trained model and scaler."""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}. Please train the model first.")
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Scaler file not found: {scaler_path}. Please train the model first.")

        self.modification_model.load_weights(model_path)
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)

    def _format_metrics(self, metrics: np.ndarray, date: str) -> Dict:
        """Format the current metrics into a structured dictionary."""
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves',
                         'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
                         'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders',
                         'traps', 'triceps']

        return {
            "date": date,
            "weightChange": float(metrics[0]),
            "cardiovascularEndurance": float(metrics[1]),
            "muscleStrength": {
                muscle: float(val)
                for muscle, val in zip(muscle_groups, metrics[2:])
            }
        }

    def _output_total_changes(self, total_changes: np.ndarray):
        """Output the total accumulated changes to the console."""
        muscle_groups = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves',
                         'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
                         'lowerback', 'middleback', 'neck', 'quadriceps', 'shoulders',
                         'traps', 'triceps']

        total_changes_dict = {
            "Total Weight Change": float(total_changes[0]),
            "Total Cardiovascular Endurance Change": float(total_changes[1]),
            "Total Muscle Strength Changes": {
                muscle: float(val)
                for muscle, val in zip(muscle_groups, total_changes[2:])
            }
        }
        print("Total accumulated changes over the prediction period:")
        print(json.dumps(total_changes_dict, indent=2))
