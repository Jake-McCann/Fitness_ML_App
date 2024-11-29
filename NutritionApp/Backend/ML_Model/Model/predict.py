import os
import json
import argparse
from habit_modification_model import HabitModificationModel

def predict_and_save(input_file: str, days_ahead: int):

    # Load the input data
    with open(input_file, 'r') as f:
        input_data = json.load(f)

    # Initialize the model
    model = HabitModificationModel()

    # Load the trained model and scaler
    model_path = 'trained_habit_model.keras'
    scaler_path = 'feature_scaler.pkl'
    model.load_trained_model(model_path, scaler_path)

    model.extrapolate_future_metrics(input_data, days_ahead)

if __name__ == "__main__":
    # Command-line arguments
    parser = argparse.ArgumentParser(description="Generate predictions and save results to JSON files.")
    parser.add_argument("input_file", type=str, help="Path to the input JSON file.")
    parser.add_argument("days_ahead", type=int, help="Number of days into the future to predict.")

    args = parser.parse_args()

    # Run the prediction
    predict_and_save(args.input_file, args.days_ahead)
