import matplotlib.pyplot as plt
import os
from habit_modification_model import HabitModificationModel

# Initialize model
model = HabitModificationModel()

current_dir = os.path.dirname(os.path.abspath(__file__))
mock_data_dir = os.path.join(os.path.dirname(current_dir), 'MockDataGen')

print(f"Looking for data in: {mock_data_dir}")

# Train on all datasets
history = model.train_on_datasets(
    data_dir=mock_data_dir,
    output_dir=mock_data_dir
)

# Save trained model
model.modification_model.save('trained_habit_model.keras')

# Plot training history
def plot_training_history(history):
    """Plots training and validation metrics over epochs."""
    plt.figure(figsize=(14, 6))

    # Plot loss
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss (MSE)')
    plt.title('Training and Validation Loss')
    plt.legend()

    # Plot MAE
    plt.subplot(1, 2, 2)
    plt.plot(history.history['mae'], label='Training MAE')
    plt.plot(history.history['val_mae'], label='Validation MAE')
    plt.xlabel('Epochs')
    plt.ylabel('Mean Absolute Error')
    plt.title('Training and Validation MAE')
    plt.legend()

    plt.tight_layout()
    plt.show()

# Call the function to plot training history
plot_training_history(history)
