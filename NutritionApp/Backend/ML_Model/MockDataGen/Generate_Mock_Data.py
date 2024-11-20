import json
import random
from datetime import datetime, timedelta
import os

def load_data_files():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up to Backend directory (not ML_Model)
    backend_dir = os.path.dirname(os.path.dirname(current_dir))
    
    # Define datasets directory
    datasets_dir = os.path.join(backend_dir, 'Datasets')
    
    print(f"Looking for datasets in: {datasets_dir}")  # Debug print
    
    # Load exercise data
    exercise_path = os.path.join(datasets_dir, 'exercise_calories.json')
    print(f"Exercise path: {exercise_path}")  # Debug print
    with open(exercise_path, 'r') as f:
        exercise_data = json.load(f)
    
    # Load workout data
    workout_path = os.path.join(datasets_dir, 'exercises.json')
    with open(workout_path, 'r') as f:
        workout_data = json.load(f)
    
    # Load nutrition data
    nutrition_path = os.path.join(datasets_dir, 'nutrition.json')
    with open(nutrition_path, 'r') as f:
        nutrition_data = json.load(f)
    
    return exercise_data, workout_data, nutrition_data

def generate_food_entry(nutrition_data):
    # Filter for healthier foods (you'd need to add categories to your nutrition data)
    # For now, we'll use a simple calorie and protein check
    healthy_foods = [
        food for food in nutrition_data 
        if (food.get("calories", 0) < 500 and food.get("protein", 0) > 5)
    ]
    
    food = random.choice(healthy_foods if healthy_foods else nutrition_data)
    servings = random.uniform(0.5, 2.5)  # More precise portion control
    
    return {
        "name": food["name"],
        "servings": round(servings, 1),
        "calories": food.get("calories") or 0,
        "fat": food.get("fat") or 0,
        "protein": food.get("protein") or 0,
        "carbohydrates": food.get("carbohydrates") or 0,
        "sugars": food.get("sugars") or 0,
        "saturatedFats": food.get("saturatedFats") or 0
    }

def generate_daily_entry(date, exercise_data, workout_data, nutrition_data):
    # Generate 4-6 meals (fit people eat more frequent, smaller meals)
    foods = []
    total_calories = 0
    total_fat = 0
    total_protein = 0
    total_carbs = 0
    total_sugars = 0
    total_saturated_fats = 0

    for _ in range(random.randint(4, 6)):
        food = generate_food_entry(nutrition_data)
        multiplier = food["servings"]
        foods.append(food)
        total_calories += food["calories"] * multiplier
        total_fat += food["fat"] * multiplier
        total_protein += food["protein"] * multiplier
        total_carbs += food["carbohydrates"] * multiplier
        total_sugars += food["sugars"] * multiplier
        total_saturated_fats += food["saturatedFats"] * multiplier

    # Generate exercises
    exercises = []
    total_calories_burned = 0
    exercise_names = list(exercise_data.keys())
    
    # Filter for more intense exercises
    intense_exercises = [
        name for name in exercise_names 
        if exercise_data[name]["calories_155lbs"] > 400
    ]

    # Generate regular exercises
    for _ in range(random.randint(2, 4)):
        exercise_name = random.choice(intense_exercises if intense_exercises else exercise_names)
        minutes = random.randint(30, 120)
        calories_burned = int((exercise_data[exercise_name]["calories_155lbs"] / 60) * minutes)
        exercises.append({
            "name": exercise_name,
            "minutes": minutes,
            "caloriesBurned": calories_burned
        })
        total_calories_burned += calories_burned

    # Generate workouts
    workouts = []
    for _ in range(random.randint(2, 4)):
        workout = random.choice(workout_data)
        workouts.append({
            "bodyPart": workout["bodyPart"],
            "title": workout["title"],
            "type": workout["type"]
        })
        
    # Add weight lifting exercises based on workouts
    if workouts:
        weight_training_minutes = len(workouts) * 10
        calories_per_minute = 10.5  # Vigorous weight lifting
        weight_training_calories = int(weight_training_minutes * calories_per_minute)
        
        exercises.append({
            "name": "Weight lifting, body building, vigorous",
            "minutes": weight_training_minutes,
            "caloriesBurned": weight_training_calories
        })
        total_calories_burned += weight_training_calories

    return {
        "date": date.strftime("%Y-%m-%d"),
        "foods": foods,
        "totalCaloriesConsumed": round(total_calories, 2),
        "totalFat": round(total_fat, 2),
        "totalProtein": round(total_protein, 2),
        "totalCarbohydrates": round(total_carbs, 2),
        "totalSugars": round(total_sugars, 2),
        "totalSaturatedFats": round(total_saturated_fats, 2),
        "exercises": exercises,
        "totalCaloriesBurned": total_calories_burned,
        "workouts": workouts
    }

def generate_history(num_days):
    exercise_data, workout_data, nutrition_data = load_data_files()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=num_days)
    
    entries = []
    current_date = start_date
    
    while current_date <= end_date:
        entries.append(generate_daily_entry(current_date, exercise_data, workout_data, nutrition_data))
        current_date += timedelta(days=1)
    
    history = {"entries": entries}
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, 'mock_health_data.json')
    with open(output_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    print(f"Generated {len(entries)} days of mock data")

if __name__ == "__main__":
    generate_history(365)  # Generate 365 days of mock data