import pandas as pd

# Load the Nutrition Data from the CSV file
nutrition_df = pd.read_csv('Nutrition.csv')

def calculate_total_calories(food_names, servings):
    total_calories = 0
    for food, serving in zip(food_names, servings):
        # Find the calorie content for the specified food
        food_data = nutrition_df[nutrition_df['name'].str.contains(food, case=False, na=False)]
        
        if not food_data.empty:
            # Get the calorie value of the food per serving
            calories_per_serving = food_data.iloc[0]['Calories']
            # Calculate the total calories for the specified serving
            total_calories += calories_per_serving * serving
        else:
            print(f"Food '{food}' not found in the database.")
    
    return total_calories

if __name__ == '__main__':
    # Take input from the user for food names and servings
    food_names = []
    servings = []
    
    print("Please enter the names of 3 foods and their respective servings.")
    for i in range(1, 4):
        food_name = input(f"Enter name of food {i}: ")
        serving = float(input(f"Enter number of servings for {food_name}: "))
        food_names.append(food_name)
        servings.append(serving)
    
    # Calculate total calories
    total_calories = calculate_total_calories(food_names, servings)
    print(f"Total calorie intake: {total_calories} calories")
