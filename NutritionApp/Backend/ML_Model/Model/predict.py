from .habit_modification_model import HabitModificationModel
import json
import os

def load_and_predict(history_data_path: str, target_metrics: dict, timeframe_days: int) -> dict:
    """
    Load the trained model and generate predictions based on history and target metrics.
    
    Args:
        history_data_path (str): Path to the history.json file
        target_metrics (dict): Target metrics for the user
        timeframe_days (int): Number of days to achieve the target
    
    Returns:
        dict: Recommended modifications
    """
    try:
        # Initialize the model
        model = HabitModificationModel()
        
        # Load the trained model weights if they exist
        model_path = os.path.join(os.path.dirname(__file__), 'trained_habit_model.keras')
        if os.path.exists(model_path):
            model.modification_model.load_weights(model_path)
        else:
            raise FileNotFoundError("Trained model not found. Please train the model first.")
        
        # Load history data
        with open(history_data_path, 'r') as f:
            history_data = json.load(f)
            
        # Generate recommendations
        recommendations = model.recommend_modifications(
            history_data=history_data,
            target_metrics=target_metrics,
            timeframe_days=timeframe_days
        )
        
        return recommendations
        
    except Exception as e:
        raise Exception(f"Error in load_and_predict: {str(e)}")