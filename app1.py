from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import pandas as pd
import json
from tensorflow.keras.preprocessing import image
import os
import uuid
import gdown
import zipfile

# ======================
# Flask setup
# ======================

app = Flask(
    __name__,
    static_folder="frontend1/dist",   # Vite build folder
    static_url_path=""
)

CORS(app)

# ======================
# Download dataset from Google Drive if not exists
# ======================

DATASET_DIR = "data/local_food_dataset"
DATASET_URL = "https://drive.google.com/drive/folders/1x_7Sh5IxaamoBAnWWBdXpYdOfRLPQ4i5?usp=drive_link"  # <-- Replace with your Google Drive zip link

if not os.path.exists(DATASET_DIR):
    print("Downloading local_food_dataset from Google Drive...")
    os.makedirs(DATASET_DIR, exist_ok=True)

    # Download the zip
    gdown.download(DATASET_URL, "local_food_dataset.zip", quiet=False)

    # Extract the zip
    with zipfile.ZipFile("local_food_dataset.zip", "r") as zip_ref:
        zip_ref.extractall(DATASET_DIR)

    # Remove the zip
    os.remove("local_food_dataset.zip")
    print("Dataset downloaded and extracted successfully.")

# ======================
# Load model & data
# ======================

MODEL_PATH = "zimfoodkidney.h5"
CLASS_NAMES_PATH = "class_names.json"
NUTRIENTS_PATH = "nutrients.csv"

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

nutrients_df = pd.read_csv(NUTRIENTS_PATH)

print("Model and data loaded successfully")

# ======================
# Prediction function
# ======================

def predict_food(image_path):
    img = image.load_img(image_path, target_size=(128, 128))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)
    predicted_index = int(np.argmax(predictions))
    confidence = float(np.max(predictions))
    predicted_food = class_names[predicted_index]

    return predicted_food, confidence

# ======================
# Nutrient lookup
# ======================

def get_nutrients(food_name):
    row = nutrients_df[nutrients_df["food"] == food_name]

    if row.empty:
        print("Food not found:", food_name)
        return None

    return {
        "potassium": int(row["potassium_mg"].values[0]),
        "phosphorus": int(row["phosphorus_mg"].values[0]),
        "sodium": int(row["sodium_mg"].values[0])
    }

# ======================
# Kidney logic
# ======================

def kidney_friendly(nutrients):
    potassium = nutrients["potassium"]
    phosphorus = nutrients["phosphorus"]
    sodium = nutrients["sodium"]

    issues = []

    if potassium > 300:
        issues.append("High potassium")
    if phosphorus > 200:
        issues.append("High phosphorus")
    if sodium > 200:
        issues.append("High sodium")

    if issues:
        return "Not kidney friendly", issues
    else:
        return "Kidney friendly", []

# ======================
# API ROUTE
# ======================

@app.route("/predict", methods=["POST"])
def predict():
    print("POST request received")

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    try:
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(".", filename)
        file.save(filepath)

        food, confidence = predict_food(filepath)
        nutrients = get_nutrients(food)

        os.remove(filepath)

        if nutrients is None:
            return jsonify({
                "food": food,
                "confidence": confidence,
                "error": "Nutrient data not found"
            })

        status, reasons = kidney_friendly(nutrients)

        return jsonify({
            "food": food,
            "confidence": confidence,
            "nutrients": nutrients,
            "kidney_verdict": status,
            "issues": reasons
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

# ======================
# SPA ROUTING (React)
# ======================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    full_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# ======================
# Run server
# ======================

if __name__ == "__main__":
    app.run(debug=True)
