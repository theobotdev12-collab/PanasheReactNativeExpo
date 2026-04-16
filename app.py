from flask import Flask, request, jsonify, session
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import pandas as pd
import json
from tensorflow.keras.preprocessing import image
import os
import uuid
import sqlite3
from datetime import datetime
import hashlib

app = Flask(__name__)
app.secret_key = "mpilo_kidney_secret_key_2024"
CORS(app, supports_credentials=True, origins=['*'])

DB_PATH = "mpilo.db"

# ======================
# Load model & data
# ======================

MODEL_PATH = "zimfoodkidney.h5"
CLASS_NAMES_PATH = "class_names.json"
NUTRIENTS_PATH = "nutrients.csv"

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

nutrients_df = pd.read_csv(NUTRIENTS_PATH)
print("Model and data loaded successfully")


# ======================
# Database setup
# ======================

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT NOT NULL
        )
    ''')
    
    # Vendors table (registered by admin)
    c.execute('''
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            business_name TEXT NOT NULL,
            description TEXT,
            phone TEXT,
            address TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Products table
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            unit TEXT,
            image_url TEXT,
            is_kidney_friendly INTEGER DEFAULT 0,
            category TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        )
    ''')
    
    # Orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # User analyses (monthly tracking)
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food TEXT NOT NULL,
            confidence REAL NOT NULL,
            potassium INTEGER,
            phosphorus INTEGER,
            sodium INTEGER,
            kidney_verdict TEXT NOT NULL,
            issues TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Admin analyses (global)
    c.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food TEXT NOT NULL,
            confidence REAL NOT NULL,
            potassium INTEGER,
            phosphorus INTEGER,
            sodium INTEGER,
            kidney_verdict TEXT NOT NULL,
            issues TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Create admin user if not exists
    c.execute("SELECT id FROM users WHERE email = 'admin@mpilo.com'")
    if not c.fetchone():
        admin_password = hashlib.sha256("admin123".encode()).hexdigest()
        c.execute('''
            INSERT INTO users (email, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', ("admin@mpilo.com", admin_password, "Admin", "admin", datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

init_db()


# ======================
# Helper functions
# ======================

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ======================
# Auth routes
# ======================

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT id FROM users WHERE email = ?", (email,))
        if c.fetchone():
            return jsonify({"error": "Email already registered"}), 400
        
        c.execute('''
            INSERT INTO users (email, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, hash_password(password), name, "user", datetime.now().isoformat()))
        
        user_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Registration successful", "user_id": user_id, "name": name, "email": email, "role": "user"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        
        if not user or user["password"] != hash_password(password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        session["user_id"] = user["id"]
        session["role"] = user["role"]
        
        conn.close()
        
        return jsonify({
            "message": "Login successful",
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


@app.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT id, email, name, role, created_at FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "created_at": user["created_at"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# Admin routes
# ======================

@app.route("/admin/vendors", methods=["GET"])
def get_vendors():
    if session.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            SELECT v.*, u.name, u.email as vendor_email 
            FROM vendors v 
            JOIN users u ON v.user_id = u.id 
            ORDER BY v.created_at DESC
        ''')
        vendors = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify(vendors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/vendors", methods=["POST"])
def create_vendor():
    if session.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    
    data = request.json
    user_id = data.get("user_id")
    business_name = data.get("business_name")
    description = data.get("description", "")
    phone = data.get("phone", "")
    address = data.get("address", "")
    
    if not user_id or not business_name:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            INSERT INTO vendors (user_id, business_name, description, phone, address, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, business_name, description, phone, address, "active", datetime.now().isoformat()))
        
        vendor_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Vendor created", "vendor_id": vendor_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/users", methods=["GET"])
def get_users():
    if session.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC")
        users = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/stats", methods=["GET"])
def admin_stats():
    if session.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT COUNT(*) FROM users")
        total_users = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM vendors")
        total_vendors = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM products")
        total_products = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM orders")
        total_orders = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM analyses")
        total_analyses = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM user_analyses")
        user_analyses = c.fetchone()[0]
        
        c.execute("SELECT food, COUNT(*) as cnt FROM analyses GROUP BY food ORDER BY cnt DESC LIMIT 5")
        top_foods = [{"food": r[0], "count": r[1]} for r in c.fetchall()]
        
        conn.close()
        
        return jsonify({
            "total_users": total_users,
            "total_vendors": total_vendors,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_analyses": total_analyses,
            "user_analyses": user_analyses,
            "top_foods": top_foods
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# Vendor routes
# ======================

@app.route("/vendor/products", methods=["GET"])
def get_products():
    try:
        conn = get_db()
        c = conn.cursor()
        
        vendor_id = request.args.get("vendor_id")
        if vendor_id:
            c.execute("SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC", (vendor_id,))
        else:
            c.execute("SELECT p.*, v.business_name FROM products p JOIN vendors v ON p.vendor_id = v.id WHERE p.category = 'organic' ORDER BY p.created_at DESC")
        
        products = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify(products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/vendor/products", methods=["POST"])
def create_product():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Login required"}), 401
    
    data = request.json
    name = data.get("name")
    price = data.get("price")
    
    if not name or not price:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT id FROM vendors WHERE user_id = ?", (user_id,))
        vendor = c.fetchone()
        
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404
        
        c.execute('''
            INSERT INTO products (vendor_id, name, description, price, unit, image_url, is_kidney_friendly, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            vendor["id"],
            data.get("name"),
            data.get("description", ""),
            price,
            data.get("unit", "kg"),
            data.get("image_url", ""),
            1 if data.get("is_kidney_friendly") else 0,
            data.get("category", "organic"),
            datetime.now().isoformat()
        ))
        
        product_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Product created", "product_id": product_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# Order routes
# ======================

@app.route("/orders", methods=["GET"])
def get_orders():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Login required"}), 401
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        role = session.get("role")
        if role == "admin":
            c.execute('''
                SELECT o.*, p.name as product_name, p.image_url, u.name as user_name
                FROM orders o
                JOIN products p ON o.product_id = p.id
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
            ''')
        elif role == "vendor":
            c.execute("SELECT id FROM vendors WHERE user_id = ?", (user_id,))
            vendor = c.fetchone()
            if vendor:
                c.execute('''
                    SELECT o.*, p.name as product_name, p.image_url, u.name as user_name
                    FROM orders o
                    JOIN products p ON o.product_id = p.id
                    JOIN users u ON o.user_id = u.id
                    WHERE p.vendor_id = ?
                    ORDER BY o.created_at DESC
                ''', (vendor["id"],))
            else:
                c.execute("SELECT o.*, p.name as product_name, p.image_url, u.name as user_name FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC", (user_id,))
        else:
            c.execute('''
                SELECT o.*, p.name as product_name, p.image_url
                FROM orders o
                JOIN products p ON o.product_id = p.id
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC
            ''', (user_id,))
        
        orders = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify(orders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/orders", methods=["POST"])
def create_order():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Login required to purchase"}), 401
    
    data = request.json
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    
    if not product_id:
        return jsonify({"error": "Product required"}), 400
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = c.fetchone()
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        total_price = product["price"] * quantity
        
        c.execute('''
            INSERT INTO orders (user_id, product_id, quantity, total_price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, product_id, quantity, total_price, "pending", datetime.now().isoformat()))
        
        order_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Order placed", "order_id": order_id, "total_price": total_price})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# Food name mapping
# ======================

FOOD_NAME_MAP = {
    "sweetpotato":      "sweet_potato",
    "soy beans":        "soya_beans",
    "sadza(maize_meal)":"sadza",
    "potato":           None,
}

FALLBACK_NUTRIENTS = {
    "potato": {"potassium": 379, "phosphorus": 57, "sodium": 5}
}


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
    if food_name in FALLBACK_NUTRIENTS:
        return FALLBACK_NUTRIENTS[food_name]

    normalized = FOOD_NAME_MAP.get(food_name, food_name.lower().replace(" ", "_"))

    if normalized is None:
        return None

    row = nutrients_df[nutrients_df["food"] == normalized]

    if row.empty:
        return None

    return {
        "potassium": int(row["potassium_mg"].values[0]),
        "phosphorus": int(row["phosphorus_mg"].values[0]),
        "sodium":     int(row["sodium_mg"].values[0])
    }


# ======================
# Kidney logic
# ======================

def kidney_friendly(nutrients):
    potassium  = nutrients["potassium"]
    phosphorus = nutrients["phosphorus"]
    sodium     = nutrients["sodium"]

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
# Prediction routes
# ======================

@app.route("/")
def home():
    return jsonify({"message": "Mpilo Kidney API running"})


@app.route("/history", methods=["GET"])
def history():
    user_id = session.get("user_id")
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        if user_id and session.get("role") != "admin":
            c.execute("SELECT * FROM user_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (user_id,))
        else:
            c.execute("SELECT * FROM analyses ORDER BY created_at DESC LIMIT 50")
        
        rows = c.fetchall()
        conn.close()

        analyses = []
        for row in rows:
            analyses.append({
                "id": row["id"],
                "food": row["food"],
                "confidence": row["confidence"],
                "potassium": row["potassium"],
                "phosphorus": row["phosphorus"],
                "sodium": row["sodium"],
                "kidney_verdict": row["kidney_verdict"],
                "issues": row["issues"].split(",") if row["issues"] else [],
                "created_at": row["created_at"]
            })

        return jsonify(analyses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
def stats():
    user_id = session.get("user_id")
    
    try:
        conn = get_db()
        c = conn.cursor()
        
        if user_id and session.get("role") != "admin":
            c.execute("SELECT COUNT(*) FROM user_analyses WHERE user_id = ?", (user_id,))
            total = c.fetchone()[0]
            
            c.execute("SELECT COUNT(*) FROM user_analyses WHERE user_id = ? AND kidney_verdict = 'Kidney friendly'", (user_id,))
            kidney_friendly_count = c.fetchone()[0]
            
            c.execute("SELECT food, COUNT(*) as cnt FROM user_analyses WHERE user_id = ? GROUP BY food ORDER BY cnt DESC LIMIT 5", (user_id,))
            top_foods = [{"food": r[0], "count": r[1]} for r in c.fetchall()]
        else:
            c.execute("SELECT COUNT(*) FROM analyses")
            total = c.fetchone()[0]
            
            c.execute("SELECT COUNT(*) FROM analyses WHERE kidney_verdict = 'Kidney friendly'")
            kidney_friendly_count = c.fetchone()[0]
            
            c.execute("SELECT food, COUNT(*) as cnt FROM analyses GROUP BY food ORDER BY cnt DESC LIMIT 5")
            top_foods = [{"food": r[0], "count": r[1]} for r in c.fetchall()]
        
        conn.close()

        return jsonify({
            "total_analyses": total,
            "kidney_friendly_count": kidney_friendly_count,
            "not_kidney_friendly_count": total - kidney_friendly_count,
            "top_foods": top_foods
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    user_id = session.get("user_id")

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    try:
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(".", filename)
        file.save(filepath)

        food, confidence = predict_food(filepath)
        print(f"Predicted: {food} ({confidence:.2%})")

        os.remove(filepath)

        nutrients = get_nutrients(food)

        if nutrients is None:
            return jsonify({
                "food": food,
                "confidence": round(confidence, 4),
                "error": f"Nutrient data not found for '{food}'."
            }), 200

        status, reasons = kidney_friendly(nutrients)

        # Save to appropriate tables
        conn = get_db()
        c = conn.cursor()
        
        now = datetime.now().isoformat()
        
        if user_id:
            c.execute('''
                INSERT INTO user_analyses (user_id, food, confidence, potassium, phosphorus, sodium, kidney_verdict, issues, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, food, round(confidence, 4), nutrients["potassium"], nutrients["phosphorus"], nutrients["sodium"], status, ",".join(reasons) if reasons else "", now))
        
        c.execute('''
            INSERT INTO analyses (food, confidence, potassium, phosphorus, sodium, kidney_verdict, issues, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (food, round(confidence, 4), nutrients["potassium"], nutrients["phosphorus"], nutrients["sodium"], status, ",".join(reasons) if reasons else "", now))
        
        conn.commit()
        conn.close()

        return jsonify({
            "food":           food,
            "confidence":     round(confidence, 4),
            "nutrients":      nutrients,
            "kidney_verdict": status,
            "issues":         reasons
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# ======================
# Run server
# ======================

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')
