import json
import random
from datetime import datetime, timedelta
import os

def load_data_files():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(os.path.dirname(current_dir))  # Go up to Backend directory
    
    # Load exercise data
    exercise_path = os.path.join(parent_dir, 'Backend/Datasets', 'exercise_calories.json')
    with open(exercise_path, 'r') as f:
        exercise_data = json.load(f)
    
    # Load workout data
    workout_path = os.path.join(parent_dir, 'Backend/Datasets', 'exercises.json')
    with open(workout_path, 'r') as f:
        workout_data = json.load(f)
    
    # Load nutrition data
    nutrition_path = os.path.join(parent_dir, 'Backend/Datasets', 'nutrition.json')
    with open(nutrition_path, 'r') as f:
        nutrition_data = json.load(f)
    
    return exercise_data, workout_data, nutrition_data

def generate_food_entry(nutrition_data):
    food = random.choice(nutrition_data)
    servings = random.randint(1, 4)
    
    return {
        "name": food["name"],
        "servings": servings,
        "calories": food.get("calories") or 0,
        "fat": food.get("fat") or 0,
        "protein": food.get("protein") or 0,
        "carbohydrates": food.get("carbohydrates") or 0,
        "sugars": food.get("sugars") or 0,
        "saturatedFats": food.get("saturatedFats") or 0
    }

def generate_daily_entry(date, exercise_data, workout_data, nutrition_data):
    # Generate 3-6 random foods
    foods = []
    total_calories = 0
    total_fat = 0
    total_protein = 0
    total_carbs = 0
    total_sugars = 0
    total_saturated_fats = 0

    for _ in range(random.randint(2, 4)):
        food = generate_food_entry(nutrition_data)
        multiplier = food["servings"]
        foods.append(food)
        total_calories += food["calories"] * multiplier
        total_fat += food["fat"] * multiplier
        total_protein += food["protein"] * multiplier
        total_carbs += food["carbohydrates"] * multiplier
        total_sugars += food["sugars"] * multiplier
        total_saturated_fats += food["saturatedFats"] * multiplier

    # Generate 1-3 random exercises
    exercises = []
    total_calories_burned = 0
    exercise_names = list(exercise_data.keys())

    for _ in range(random.randint(1, 3)):
        exercise_name = random.choice(exercise_names)
        minutes = random.randint(15, 90)
        calories_burned = int((exercise_data[exercise_name]["calories_155lbs"] / 60) * minutes)
        exercises.append({
            "name": exercise_name,
            "minutes": minutes,
            "caloriesBurned": calories_burned
        })
        total_calories_burned += calories_burned

    # Generate 1-3 random workouts
    workouts = []
    for _ in range(random.randint(1, 3)):
        workout = random.choice(workout_data)
        workouts.append({
            "bodyPart": workout["bodyPart"],
            "title": workout["title"],
            "type": workout["type"]
        })

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
        if random.random() < 0.8:  # 80% chance of having an entry for any given day
            entries.append(generate_daily_entry(current_date, exercise_data, workout_data, nutrition_data))
        current_date += timedelta(days=1)
    
    history = {"entries": entries}
    
    # Save to file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, 'mock_data.json')
    with open(output_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    print(f"Generated {len(entries)} days of mock data")

if __name__ == "__main__":
    generate_history(30)  # Generate 30 days of mock data