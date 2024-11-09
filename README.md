# Fitness_ML_App
A react native app that collects user fitness and diet information along with user described fitness goals and uses a regression model to suggest workouts and diet plans.

Training Data Includes:
Food Names -> Nutrition / Macros (this file has been compressed with gzip as it exceeds the 100mb limit for github)
Gym Exercises -> Body Part/s
Physical Exercises -> Calories Burned per Hour for 4 Different Weight Groups

Steps to run current program:
1. Clone the repository
2. Add your own API_URL to the .env file in the Frontend folder (example provided in the .env.example file)
3. Run pip install -r requirements.txt in the Backend folder
4. Run npx expo start in the Frontend folder
5. Run the main.py python backend file in the Backend folder
6. Scan the QR code generated on the Expo Go app on your phone

You should now be able to use the app normally. It should provide a search bar with a dropdown menu of exercise suggestions, allowing users to
choose a series of exercises, input a time spent (in minutes) on each, press calculate, and have the program calculate the total calories burned
by using the exercise_calories.json file. 
