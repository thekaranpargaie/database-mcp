/**
 * Demo Database Setup
 * Creates a sample SQLite database for demonstration
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'demo.sqlite');

console.log('Creating demo database at:', dbPath);

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing database');
}

const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2),
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Insert sample data
const customers = [
  { name: 'Alice Johnson', email: 'alice@example.com', country: 'USA' },
  { name: 'Bob Smith', email: 'bob@example.com', country: 'UK' },
  { name: 'Carol White', email: 'carol@example.com', country: 'Canada' },
  { name: 'David Brown', email: 'david@example.com', country: 'Australia' },
  { name: 'Eva Green', email: 'eva@example.com', country: 'Germany' },
  { name: 'Frank Miller', email: 'frank@example.com', country: 'USA' },
  { name: 'Grace Lee', email: 'grace@example.com', country: 'South Korea' },
  { name: 'Henry Davis', email: 'henry@example.com', country: 'UK' },
  { name: 'Ivy Chen', email: 'ivy@example.com', country: 'China' },
  { name: 'Jack Wilson', email: 'jack@example.com', country: 'USA' },
];

const insertCustomer = db.prepare(
  'INSERT INTO customers (name, email, country) VALUES (?, ?, ?)'
);

customers.forEach((customer) => {
  insertCustomer.run(customer.name, customer.email, customer.country);
});

const products = [
  { name: 'Laptop Pro 15"', category: 'Electronics', price: 1299.99, stock: 50 },
  { name: 'Wireless Mouse', category: 'Electronics', price: 29.99, stock: 200 },
  { name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, stock: 100 },
  { name: 'USB-C Cable', category: 'Accessories', price: 12.99, stock: 500 },
  { name: '4K Monitor', category: 'Electronics', price: 449.99, stock: 75 },
  { name: 'Desk Lamp', category: 'Furniture', price: 39.99, stock: 150 },
  { name: 'Office Chair', category: 'Furniture', price: 299.99, stock: 40 },
  { name: 'Notebook Set', category: 'Stationery', price: 15.99, stock: 300 },
  { name: 'Pen Pack (10)', category: 'Stationery', price: 8.99, stock: 400 },
  { name: 'Webcam HD', category: 'Electronics', price: 79.99, stock: 120 },
];

const insertProduct = db.prepare(
  'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)'
);

products.forEach((product) => {
  insertProduct.run(product.name, product.category, product.price, product.stock);
});

// Create orders
const insertOrder = db.prepare(
  'INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES (?, ?, ?, ?)'
);

const insertOrderItem = db.prepare(
  'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
);

// Generate random orders
const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

for (let i = 0; i < 30; i++) {
  const customerId = Math.floor(Math.random() * 10) + 1;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // Random date in last 90 days
  const daysAgo = Math.floor(Math.random() * 90);
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() - daysAgo);
  
  let totalAmount = 0;
  const orderInfo = insertOrder.run(
    customerId,
    orderDate.toISOString(),
    0,
    status
  );
  const orderId = orderInfo.lastInsertRowid;

  // Add 1-5 items to order
  const itemCount = Math.floor(Math.random() * 5) + 1;
  for (let j = 0; j < itemCount; j++) {
    const productId = Math.floor(Math.random() * 10) + 1;
    const quantity = Math.floor(Math.random() * 3) + 1;
    const product = products[productId - 1];
    const unitPrice = product.price;
    
    totalAmount += unitPrice * quantity;
    
    insertOrderItem.run(orderId, productId, quantity, unitPrice);
  }

  // Update order total
  db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(
    totalAmount.toFixed(2),
    orderId
  );
}

console.log('✅ Demo database created successfully!');
console.log('📊 Sample data:');
console.log(`   - ${customers.length} customers`);
console.log(`   - ${products.length} products`);
console.log(`   - 30 orders with items`);
console.log('');
console.log('You can connect using:');
console.log(`   Database Type: SQLite`);
console.log(`   File Path: ${dbPath}`);

db.close();
