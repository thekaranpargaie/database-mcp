/**
 * Quick Validation Test - Database and Groq Integration
 */

import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateSetup() {
  console.log('\n🧪 Validating Database-MCP Setup with Groq\n');
  
  try {
    // Test 1: Demo Database
    console.log('Test 1: Demo Database ✓');
    const demoDbPath = path.join(__dirname, 'demo.sqlite');
    const db = new Database(demoDbPath);
    
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all() as any[];
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach(t => {
      const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get() as any;
      console.log(`   - ${t.name}: ${count.cnt} rows`);
    });
    
    db.close();
    console.log('   ✓ Database validation passed\n');

    // Test 2: Groq API Configuration
    console.log('Test 2: Groq API Configuration ✓');
    if (!process.env.LLM_API_KEY) {
      throw new Error('LLM_API_KEY environment variable is required');
    }
    const groqKey = process.env.LLM_API_KEY;
    const groqUrl = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1';
    const groqModel = process.env.LLM_MODEL || 'openai/gpt-oss-20b';
    
    console.log(`   - API URL: ${groqUrl}`);
    console.log(`   - Model: ${groqModel}`);
    console.log(`   - API Key: ${groqKey.substring(0, 20)}...`);
    console.log('   ✓ Groq configuration ready\n');

    // Test 3: Sample Queries
    console.log('Test 3: Sample Database Queries ✓');
    const dbConn = new Database(demoDbPath);
    
    const topCustomers = dbConn.prepare(`
      SELECT c.name, COUNT(o.id) as order_count 
      FROM customers c 
      LEFT JOIN orders o ON c.id = o.customer_id 
      GROUP BY c.id 
      ORDER BY order_count DESC 
      LIMIT 3
    `).all();
    
    console.log('   Top 3 customers by orders:');
    (topCustomers as any[]).forEach(cust => {
      console.log(`      - ${cust.name}: ${cust.order_count} orders`);
    });
    
    const recentOrders = dbConn.prepare(`
      SELECT o.id, c.name, o.total_amount, o.status 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.order_date DESC 
      LIMIT 3
    `).all();
    
    console.log('\n   Recent 3 orders:');
    (recentOrders as any[]).forEach(order => {
      console.log(`      - Order #${order.id}: ${order.name} - $${order.total_amount} (${order.status})`);
    });
    
    dbConn.close();
    console.log('\n   ✓ Sample queries passed\n');

    console.log('✅ All validations passed!');
    console.log('\n📊 Setup Summary:');
    console.log('   - Database: SQLite (demo.sqlite)');
    console.log('   - LLM Provider: Groq');
    console.log('   - Model: openai/gpt-oss-20b');
    console.log('   - Server: http://localhost:3000');
    console.log('\n🚀 Ready to use! Visit http://localhost:3000 in your browser\n');

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

validateSetup();
