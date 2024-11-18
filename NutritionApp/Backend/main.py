from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Get paths to data files
current_dir = os.path.dirname(os.path.abspath(__file__))
exercise_path = os.path.join(current_dir, 'Datasets', 'exercise_calories.json')
history_path = os.path.join(current_dir, 'Datasets', 'history.json')

# Load exercise data
with open(exercise_path, 'r') as f:
    exercise_data = json.load(f)

def load_history():
    if os.path.exists(history_path):
        with open(history_path, 'r') as f:
            return json.load(f)
    return {"entries": []}

def save_history(history_data):
    with open(history_path, 'w') as f:
        json.dump(history_data, f, indent=2)

@app.route('/api/history', methods=['GET'])
def get_history():
    history_data = load_history()
    return jsonify(history_data['entries'])

@app.route('/api/history', methods=['POST'])
def add_history_entry():
    data = request.json
    history_data = load_history()
    
    date = data['date']
    existing_entry = next(
        (entry for entry in history_data['entries'] if entry['date'] == date),
        None
    )
    
    if existing_entry:
        if 'exercises' in data:
            if 'exercises' not in existing_entry:
                existing_entry['exercises'] = []
            existing_entry['exercises'].extend(data['exercises'])
            existing_entry['totalCaloriesBurned'] = (
                existing_entry.get('totalCaloriesBurned', 0) + data['totalCaloriesBurned']
            )
        elif 'foods' in data:
            if 'foods' not in existing_entry:
                existing_entry['foods'] = []
            existing_entry['foods'].extend(data['foods'])
            existing_entry['totalCaloriesConsumed'] = (
                existing_entry.get('totalCaloriesConsumed', 0) + data['totalCaloriesConsumed']
            )
        elif 'workouts' in data:
            if 'workouts' not in existing_entry:
                existing_entry['workouts'] = []
            existing_entry['workouts'].extend(data['workouts'])
    else:
        history_data['entries'].append(data)
    
    # Sort entries by date (newest first)
    history_data['entries'].sort(key=lambda x: x['date'], reverse=True)
    
    save_history(history_data)
    return jsonify({"message": "Entry added successfully"})

@app.route('/api/exercises/search')
def search_exercises():
    query = request.args.get('q', '').lower()
    suggestions = [
        {"name": exercise_name}
        for exercise_name in exercise_data.keys()
        if query in exercise_name.lower()
    ]
    return jsonify(suggestions)

@app.route('/api/exercises/calculate', methods=['POST'])
def calculate_calories():
    data = request.json
    exercises = data.get('exercises', [])
    weight_category = data.get('weightCategory', 155)
    
    # Convert weight category to the corresponding key in the JSON
    calories_key = f'calories_{weight_category}lbs'
    
    total_calories = 0
    
    for exercise in exercises:
        exercise_name = exercise['name']
        minutes = exercise['minutes']
        
        if exercise_name in exercise_data:
            # Convert hour-based calories to minutes and calculate
            calories_per_hour = exercise_data[exercise_name][calories_key]
            calories = (calories_per_hour / 60) * minutes
            total_calories += calories
    
    return jsonify({'totalCalories': round(total_calories)})

@app.route('/api/suggestions', methods=['POST'])
def get_suggestions():
    data = request.json
    goal_type = data.get('goalType')
    goal_value = data.get('goalValue')
    timeframe = data.get('timeframe')
    
    # Process through ML model and get suggestions
    suggestions = generate_suggestions(goal_type, goal_value, timeframe)
    return jsonify(suggestions)

@app.route('/api/nutrition/search', methods=['GET'])
def search_nutrition():
    query = request.args.get('query', '').lower()
    
    with open(os.path.join(current_dir, 'Datasets', 'nutrition.json'), 'r') as f:
        nutrition_data = json.load(f)
    
    results = [item for item in nutrition_data 
              if query in item['name'].lower()]
    return jsonify(results[:10])  # Limit to 10 results

# Load the exercises dataset
with open('Datasets/exercises.json', 'r') as f:
    exercises_data = json.load(f)

@app.route('/api/workouts/search', methods=['GET'])
def search_workouts():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    # Search through exercises and return matches
    matches = []
    for exercise in exercises_data:
        if query in exercise['title'].lower():
            matches.append({
                'title': exercise['title'],
                'type': exercise['type'],
                'bodyPart': exercise['bodyPart']
            })
            # Limit results to prevent overwhelming the frontend
            if len(matches) >= 10:
                break

    return jsonify(matches)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)