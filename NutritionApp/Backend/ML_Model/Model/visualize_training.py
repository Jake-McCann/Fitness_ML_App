import os
from tensorflow import keras
import tensorflow as tf
import webbrowser
import subprocess

def launch_tensorboard(log_dir="logs/fit"):
    """Launch TensorBoard server and open it in the default web browser"""
    # Make sure the directory exists
    if not os.path.exists(log_dir):
        print(f"No logs found in {log_dir}. Please train the model first.")
        return

    # Start TensorBoard server
    tb = subprocess.Popen(['tensorboard', '--logdir', log_dir])
    
    # Open TensorBoard in browser
    webbrowser.open('http://localhost:6006/')
    
    print("TensorBoard is running. Press Ctrl+C to exit.")
    try:
        tb.wait()
    except KeyboardInterrupt:
        tb.terminate()
        print("\nTensorBoard server stopped.")

if __name__ == "__main__":
    launch_tensorboard() 