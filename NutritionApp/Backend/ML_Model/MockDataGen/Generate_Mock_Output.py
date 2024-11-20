import json
from datetime import datetime, timedelta
import math

def calculate_daily_changes(prev_metrics, day_data):
    changes = {
        "weightChange": 0,
        "cardiovascularEndurance": 0,
        "muscleStrength": {}
    }
    
    # Calculate caloric and nutrition impacts
    caloric_balance = day_data.get("totalCaloriesConsumed", 0) - day_data.get("totalCaloriesBurned", 0)
    protein = day_data.get("totalProtein", 0)
    sugar = day_data.get("totalSugars", 0)
    saturated_fat = day_data.get("totalSaturatedFats", 0)
    
    # Weight change calculation (fixed)
    base_weight_change = caloric_balance / 3500  
    
    # Adjust for protein's effect on muscle preservation/growth during deficit
    protein_factor = min(protein / 150, 1.0)  # Normalize protein intake
    
    # In a deficit, protein helps preserve muscle mass, reducing weight loss slightly
    # In a surplus, protein helps build muscle, increasing weight gain slightly
    if base_weight_change < 0:
        base_weight_change *= (1 - (protein_factor * 0.2))  # Slow weight loss by up to 20% with optimal protein
    else:
        base_weight_change *= (1 + (protein_factor * 0.1))  # Increase weight gain by up to 10% with optimal protein
    
    changes["weightChange"] = base_weight_change
    
    # Enhanced cardiovascular changes (doubled impact)
    cardio_impact = 0
    for exercise in day_data.get("exercises", []):
        intensity_factor = exercise.get("caloriesBurned", 0) / exercise.get("minutes", 1)
        cardio_impact += (intensity_factor * exercise.get("minutes", 0)) / 500  # Reduced divisor from 1000
    sat_fat_penalty = saturated_fat * -0.02  # Doubled negative impact
    changes["cardiovascularEndurance"] = min(cardio_impact + sat_fat_penalty, 4.0)  # Doubled max daily gain
    
    # Enhanced muscle strength calculations
    muscle_groups = {
        "abdominals": 0, "abductors": 0, "adductors": 0, "biceps": 0,
        "calves": 0, "chest": 0, "forearms": 0, "glutes": 0,
        "hamstrings": 0, "lats": 0, "lowerBack": 0, "middleBack": 0,
        "neck": 0, "quadriceps": 0, "shoulders": 0, "traps": 0, "triceps": 0
    }
    
    protein_factor = min(protein / 150, 1.0)
    
    for workout in day_data.get("workouts", []):
        target = workout.get("bodyPart", "").lower()
        if target in muscle_groups:
            muscle_groups[target] += 0.6 * (1 + protein_factor)  # Doubled gain from 0.3
    
    # Apply larger decay to unused muscles
    for muscle in muscle_groups:
        if muscle_groups[muscle] == 0:
            muscle_groups[muscle] = -0.2 * (1 - protein_factor)  # Doubled decay from -0.1
            
    changes["muscleStrength"] = muscle_groups
    return changes

def generate_health_output(input_file, output_file):
    # Load input data
    with open(input_file, 'r') as f:
        input_data = json.load(f)
    
    # Initialize output structure
    output = {"healthMetrics": []}
    
    # Set initial baseline metrics
    baseline_metrics = {
        "weightChange": 0.0,
        "cardiovascularEndurance": 100.0,
        "muscleStrength": {
            "abdominals": 100.0, "abductors": 100.0, "adductors": 100.0,
            "biceps": 100.0, "calves": 100.0, "chest": 100.0,
            "forearms": 100.0, "glutes": 100.0, "hamstrings": 100.0,
            "lats": 100.0, "lowerBack": 100.0, "middleBack": 100.0,
            "neck": 100.0, "quadriceps": 100.0, "shoulders": 100.0,
            "traps": 100.0, "triceps": 100.0
        }
    }
    
    # Process each day
    current_metrics = baseline_metrics.copy()
    entries_by_date = {entry["date"]: entry for entry in input_data["entries"]}
    
    # Get date range from input data
    dates = sorted(entries_by_date.keys())
    start_date = datetime.strptime(dates[0], "%Y-%m-%d")
    end_date = datetime.strptime(dates[-1], "%Y-%m-%d")
    
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Add metrics for this day
        daily_metrics = {
            "date": date_str,
            "weightChange": current_metrics["weightChange"],
            "cardiovascularEndurance": current_metrics["cardiovascularEndurance"],
            "muscleStrength": current_metrics["muscleStrength"].copy()
        }
        output["healthMetrics"].append(daily_metrics)
        
        # Calculate changes based on this day's activities
        if date_str in entries_by_date:
            changes = calculate_daily_changes(current_metrics, entries_by_date[date_str])
            
            # Apply changes to current metrics
            current_metrics["weightChange"] += changes["weightChange"]
            current_metrics["cardiovascularEndurance"] = max(0, min(110, 
                current_metrics["cardiovascularEndurance"] + changes["cardiovascularEndurance"]))
            
            for muscle, change in changes["muscleStrength"].items():
                current_metrics["muscleStrength"][muscle] = max(0, min(110, 
                    current_metrics["muscleStrength"][muscle] + change))
        
        current_date += timedelta(days=1)
    
    # Write output file
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

# Generate the file
generate_health_output(
    './mock_health_data.json',
    './mock_health_output.json'
)