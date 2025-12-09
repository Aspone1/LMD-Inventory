# LMD-Inventory
LMD GPS & License Key Inventory Management

A modern web application for managing GPS device and software license inventory for retailers. Browse, add, delete, and manage product quantities with an easy-to-use interface.

## Features

- 📦 Browse all GPS devices and software licenses in a clean, modern interface
- ➕ Add new products with details (name, SKU, description, category, price, quantity)
- 🗑️ Delete products
- 🔢 Adjust product quantities with +/- buttons
- 🔍 Search products by name, description, or SKU
- 🏷️ Filter products by category (GPS Hardware, Software License)
- 📊 Pre-populated with 20 sample GPS products and licenses
- 💾 Local SQLite database (no external dependencies)

## Technologies Used

- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Aspone1/LMD-Inventory.git
cd LMD-Inventory
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. The application will automatically create a database with 20 pre-populated GPS products and software licenses on first run.

## Usage

### Browse Products
- View all GPS devices and software licenses in the main table
- Products display SKU, name, description, category, price, and quantity

### Search and Filter
- Use the search bar to find products by name, description, or SKU
- Filter products by category (GPS Hardware or Software License)

### Add a Product
1. Click the "Add Product" button
2. Fill in the required fields (Name, SKU, Price, Quantity)
3. Optionally add description and category
4. Click "Save Product"

### Update Quantity
- Use the +/- buttons next to each product's quantity
- Quantity cannot go below 0

### Edit a Product
1. Click the edit (pencil) icon for any product
2. Modify the desired fields
3. Click "Update Product"

### Delete a Product
1. Click the delete (trash) icon for any product
2. Confirm the deletion

## Database

The application uses SQLite with the following schema:

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    sku TEXT UNIQUE NOT NULL
)
```

The database file (`inventory.db`) is automatically created on first run and populated with 20 sample products including:
- **GPS Hardware**: Vehicle trackers, fleet management devices, personal trackers, marine GPS, aviation GPS, hiking devices, pet trackers, and more
- **Software Licenses**: Fleet management licenses, tracking platform subscriptions, geofencing add-ons, route optimization, API access, and white-label solutions

## API Endpoints

- `GET /api/products` - Get all products (supports search and category filters)
- `GET /api/products/<id>` - Get a specific product
- `POST /api/products` - Add a new product
- `PUT /api/products/<id>` - Update a product
- `DELETE /api/products/<id>` - Delete a product
- `GET /api/categories` - Get all categories

## License

This project is open source and available for educational purposes.
