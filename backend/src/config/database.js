import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - use environment variable for production
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'database.sqlite');

console.log(`📁 Database path: ${DB_PATH}`);

// Create database connection
const db = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

console.log('✅ Connected to SQLite database');

export default db;
