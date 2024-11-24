from .habit_modification_model import HabitModificationModel
from datetime import datetime, timedelta
import json
import argparse
import os
from typing import Dict, List
import tensorflow as tf

def load_and_predict(timeframe_days: int, target_metrics: Dict) -> Dict:
    """Wrapper function for API endpoint to use"""
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    tf.keras.utils.disable_interactive_logging()
    
    # Get absolute paths using Windows-style paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'trained_habit_model.keras')
    scaler_path = os.path.join(current_dir, 'feature_scaler.pkl')
    input_file = os.path.join(current_dir, '..', '..', 'Datasets', 'history.json')
    
    print(f"Looking for model at: {model_path}")  # Debug print
    print(f"Looking for scaler at: {scaler_path}")  # Debug print
    
    model = HabitModificationModel()
    model.load_trained_model(model_path, scaler_path)
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Generate predictions
    historical_predictions = []
    for entry in data['entries']:
        predicted_metrics = model.predict_metrics_for_entry(entry)
        historical_predictions.append(predicted_metrics)
    
    latest_entry = data['entries'][-1]
    latest_predicted_metrics = historical_predictions[-1]
    
    future_predictions = model.extrapolate_future_metrics(
        latest_entry,
        latest_predicted_metrics,
        timeframe_days
    )
    
    # Get final prediction
    final_prediction = future_predictions[-1]
    
    # Normalize muscle names to match frontend
    muscle_name_map = {
        'lowerback': 'lowerBack',
        'middleback': 'middleBack'
    }
    
    # Fix muscle names in final prediction
    fixed_muscle_strength = {}
    for muscle, value in final_prediction['muscleStrength'].items():
        fixed_muscle = muscle_name_map.get(muscle, muscle)
        fixed_muscle_strength[fixed_muscle] = value
    final_prediction['muscleStrength'] = fixed_muscle_strength
    
    # Calculate percentage differences
    differences = {
        'weightChange': ((final_prediction['weightChange'] - target_metrics['weightChange']) / abs(target_metrics['weightChange'])) * 100 if target_metrics['weightChange'] != 0 else 0,
        'cardiovascularEndurance': ((final_prediction['cardiovascularEndurance'] - target_metrics['cardiovascularEndurance']) / target_metrics['cardiovascularEndurance']) * 100,
        'muscleStrength': {
            muscle: ((final_prediction['muscleStrength'][muscle] - target_metrics['muscleStrength'][muscle]) / target_metrics['muscleStrength'][muscle]) * 100
            for muscle in target_metrics['muscleStrength'].keys()
        }
    }
    
    return {
        'predicted': final_prediction,
        'target': target_metrics,
        'differences': differences
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict health metrics')
    parser.add_argument('input_file', type=str, help='Path to input JSON file')
    parser.add_argument('days_ahead', type=int, help='Number of days into the future to predict')
    parser.add_argument('target_metrics', type=str, help='JSON string of target metrics')
    
    args = parser.parse_args()
    target_metrics = json.loads(args.target_metrics)
    predictions = load_and_predict(args.days_ahead, target_metrics)