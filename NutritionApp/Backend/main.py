from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Allow all origins during development

# Get the absolute path to the json file
current_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(current_dir, 'Datasets', 'exercise_calories.json')

# Load exercise data
with open(json_path, 'r') as f:
    exercise_data = json.load(f)

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)