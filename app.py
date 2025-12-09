import sqlite3
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='static')
CORS(app)

DATABASE = 'inventory.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            sku TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Check if database is empty
    cursor.execute('SELECT COUNT(*) FROM products')
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Insert 20 sample products (GPS devices and license keys)
        sample_products = [
            ('GPS Tracker Pro 5000', 'Professional vehicle GPS tracker with real-time monitoring', 'GPS Hardware', 299.99, 25, 'GPS-TRK-5000'),
            ('Fleet Manager GPS', 'Fleet management GPS device with geofencing', 'GPS Hardware', 449.99, 18, 'GPS-FLT-1000'),
            ('Personal GPS Tracker', 'Compact personal GPS tracker with SOS button', 'GPS Hardware', 149.99, 45, 'GPS-PER-2000'),
            ('Asset GPS Tracker', 'Battery-powered asset tracker with 6-month battery', 'GPS Hardware', 199.99, 32, 'GPS-AST-3000'),
            ('Marine GPS Navigator', 'Waterproof marine navigation GPS device', 'GPS Hardware', 549.99, 12, 'GPS-MAR-4000'),
            ('Aviation GPS', 'Aviation-grade GPS navigator with moving map', 'GPS Hardware', 899.99, 8, 'GPS-AVI-6000'),
            ('Hiking GPS Device', 'Rugged outdoor GPS with topographic maps', 'GPS Hardware', 379.99, 22, 'GPS-HIK-7000'),
            ('Pet GPS Collar', 'GPS tracking collar for pets with activity monitoring', 'GPS Hardware', 89.99, 67, 'GPS-PET-8000'),
            ('OBD GPS Tracker', 'Plug-and-play OBD-II GPS tracker for vehicles', 'GPS Hardware', 129.99, 41, 'GPS-OBD-9000'),
            ('Magnetic GPS Tracker', 'Covert magnetic GPS tracker with extended battery', 'GPS Hardware', 179.99, 35, 'GPS-MAG-1100'),
            ('Fleet Pro License - Annual', 'Annual fleet management software license for 10 vehicles', 'Software License', 499.99, 150, 'LIC-FLT-YR10'),
            ('Fleet Pro License - Monthly', 'Monthly fleet management software license for 5 vehicles', 'Software License', 59.99, 200, 'LIC-FLT-MO5'),
            ('Tracking Platform Premium', 'Premium tracking platform license with advanced analytics', 'Software License', 299.99, 120, 'LIC-TRK-PREM'),
            ('Tracking Platform Basic', 'Basic tracking platform license for individual use', 'Software License', 99.99, 180, 'LIC-TRK-BASIC'),
            ('Geofencing Add-on', 'Geofencing feature add-on license', 'Software License', 49.99, 95, 'LIC-GEO-ADDON'),
            ('Route Optimization Module', 'Route planning and optimization software module', 'Software License', 149.99, 75, 'LIC-RTE-OPT'),
            ('Driver Behavior Analysis', 'Driver behavior monitoring and reporting license', 'Software License', 199.99, 85, 'LIC-DRV-BHVR'),
            ('API Access Enterprise', 'Enterprise API access license with unlimited calls', 'Software License', 599.99, 50, 'LIC-API-ENT'),
            ('Mobile App Premium', 'Premium mobile app license with offline maps', 'Software License', 79.99, 110, 'LIC-APP-PREM'),
            ('White Label Solution', 'White label platform license for resellers', 'Software License', 1499.99, 25, 'LIC-WL-RESEL')
        ]
        
        cursor.executemany('''
            INSERT INTO products (name, description, category, price, quantity, sku)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', sample_products)
        
        conn.commit()
    
    conn.close()

# Initialize database on startup
init_db()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    query = 'SELECT * FROM products WHERE 1=1'
    params = []
    
    if search:
        query += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)'
        search_param = f'%{search}%'
        params.extend([search_param, search_param, search_param])
    
    if category:
        query += ' AND category = ?'
        params.append(category)
    
    query += ' ORDER BY name'
    
    cursor.execute(query, params)
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(products)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    product = cursor.fetchone()
    conn.close()
    
    if product:
        return jsonify(dict(product))
    return jsonify({'error': 'Product not found'}), 404

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.get_json()
    
    required_fields = ['name', 'price', 'quantity', 'sku']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO products (name, description, category, price, quantity, sku)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data.get('description', ''),
            data.get('category', ''),
            data['price'],
            data['quantity'],
            data['sku']
        ))
        conn.commit()
        product_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'id': product_id, 'message': 'Product added successfully'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Product with this SKU already exists'}), 400

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if product exists
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
    
    # Build update query dynamically
    update_fields = []
    params = []
    
    allowed_fields = ['name', 'description', 'category', 'price', 'quantity', 'sku']
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            params.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400
    
    params.append(product_id)
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = ?"
    
    try:
        cursor.execute(query, params)
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product updated successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Product with this SKU already exists'}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Product deleted successfully'})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT category FROM products WHERE category != "" ORDER BY category')
    categories = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
