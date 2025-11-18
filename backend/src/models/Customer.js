import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Customer = {
  create: async (customerData) => {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO customers (id, name, email, phone, address, city, state, zip, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        customerData.name,
        customerData.email,
        customerData.phone || null,
        customerData.address || null,
        customerData.city || null,
        customerData.state || null,
        customerData.zip || null,
        customerData.country || null,
      ]
    );

    return Customer.findById(id);
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    return result.rows;
  },

  update: async (id, customerData) => {
    await pool.query(
      `UPDATE customers
       SET name = $1, email = $2, phone = $3, address = $4, city = $5, state = $6, zip = $7, country = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        customerData.name,
        customerData.email,
        customerData.phone || null,
        customerData.address || null,
        customerData.city || null,
        customerData.state || null,
        customerData.zip || null,
        customerData.country || null,
        id,
      ]
    );

    return Customer.findById(id);
  },

  delete: async (id) => {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
  },
};
