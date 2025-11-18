import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import pool from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize database tables on startup
const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        subtotal NUMERIC DEFAULT 0,
        tax_rate NUMERIC DEFAULT 0,
        tax_amount NUMERIC DEFAULT 0,
        discount NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        notes TEXT,
        terms TEXT,
        email_sent INTEGER DEFAULT 0,
        email_sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity NUMERIC DEFAULT 1,
        unit_price NUMERIC DEFAULT 0,
        amount NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Initialize database
await initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Invoice API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Invoice API server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
