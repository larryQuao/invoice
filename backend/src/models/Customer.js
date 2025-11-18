import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Customer = {
  create: (customerData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO customers (id, name, email, phone, address, city, state, zip, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      customerData.name,
      customerData.email,
      customerData.phone || null,
      customerData.address || null,
      customerData.city || null,
      customerData.state || null,
      customerData.zip || null,
      customerData.country || null
    );

    return Customer.findById(id);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id);
  },

  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM customers WHERE email = ?');
    return stmt.get(email);
  },

  findAll: () => {
    const stmt = db.prepare('SELECT * FROM customers ORDER BY created_at DESC');
    return stmt.all();
  },

  update: (id, customerData) => {
    const stmt = db.prepare(`
      UPDATE customers
      SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, country = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      customerData.name,
      customerData.email,
      customerData.phone || null,
      customerData.address || null,
      customerData.city || null,
      customerData.state || null,
      customerData.zip || null,
      customerData.country || null,
      id
    );

    return Customer.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    return stmt.run(id);
  }
};
