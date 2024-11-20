from habit_modification_model import HabitModificationModel
import tensorflow as tf
import json

def load_and_predict(history_data_path: str, target_metrics: dict, timeframe_days: int):
    # Load the trained model
    model = HabitModificationModel()
    model.modification_model = tf.keras.models.load_model('trained_habit_model.keras')
    
    # Load user's history data
    with open(history_data_path, 'r') as f:
        history_data = json.load(f)
    
    # Get recommendations
    recommendations = model.recommend_modifications(
        history_data=history_data,
        target_metrics=target_metrics,
        timeframe_days=timeframe_days
    )
    
    return recommendations

# Example usage
if __name__ == "__main__":
    # Example target metrics
    target_metrics = {
        "date": "2024-11-19",
        "weightChange": -90.4427027333334,
        "cardiovascularEndurance": 110,
        "muscleStrength": {
            "abdominals": 109.85845333333333,
            "abductors": 91.12298666666673,
            "adductors": 90.90205333333337,
            "biceps": 109.77917333333332,
            "calves": 96.43210666666673,
            "chest": 109.93173333333333,
            "forearms": 95.0467200000001,
            "glutes": 108.78598666666666,
            "hamstrings": 109.85845333333333,
            "lats": 109.59359999999998,
            "lowerBack": 83.07088000000006,
            "middleBack": 83.07088000000006,
            "neck": 84.0138933333334,
            "quadriceps": 110,
            "shoulders": 110,
            "traps": 94.23850666666672,
            "triceps": 110
        }
    }
    
    recommendations = load_and_predict(
        history_data_path='../../Datasets/history.json',
        target_metrics=target_metrics,
        timeframe_days=90
    )
    
    print("Recommended Modifications:")
    print(json.dumps(recommendations, indent=2))
