import os
from habit_modification_model import HabitModificationModel

#initialize model
model = HabitModificationModel()

current_dir = os.path.dirname(os.path.abspath(__file__))
mock_data_dir = os.path.join(os.path.dirname(current_dir), 'MockDataGen')

print(f"Looking for data in: {mock_data_dir}")

#train on all datasets
model.train_on_datasets(
    data_dir=mock_data_dir,
    output_dir=mock_data_dir
)

#save trained model
model.modification_model.save('trained_habit_model.keras')
