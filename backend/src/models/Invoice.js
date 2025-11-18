import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Invoice = {
  create: async (invoiceData) => {
    const id = uuidv4();
    const invoiceNumber = invoiceData.invoice_number || `INV-${Date.now()}`;

    await pool.query(
      `INSERT INTO invoices (id, invoice_number, customer_id, issue_date, due_date, status, subtotal, tax_rate, tax_amount, discount, total, notes, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        invoiceNumber,
        invoiceData.customer_id,
        invoiceData.issue_date,
        invoiceData.due_date,
        invoiceData.status || 'draft',
        invoiceData.subtotal || 0,
        invoiceData.tax_rate || 0,
        invoiceData.tax_amount || 0,
        invoiceData.discount || 0,
        invoiceData.total || 0,
        invoiceData.notes || null,
        invoiceData.terms || null,
      ]
    );

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      for (const item of invoiceData.items) {
        const itemId = uuidv4();
        await pool.query(
          `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [itemId, id, item.description, item.quantity, item.unit_price, item.amount]
        );
      }
    }

    return Invoice.findById(id);
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              c.address as customer_address, c.city as customer_city, c.state as customer_state,
              c.zip as customer_zip, c.country as customer_country
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [id]
    );
    const invoice = result.rows[0];

    if (invoice) {
      const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
      invoice.items = itemsResult.rows;
    }

    return invoice;
  },

  findByInvoiceNumber: async (invoiceNumber) => {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              c.address as customer_address, c.city as customer_city, c.state as customer_state,
              c.zip as customer_zip, c.country as customer_country
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.invoice_number = $1`,
      [invoiceNumber]
    );
    const invoice = result.rows[0];

    if (invoice) {
      const itemsResult = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
      invoice.items = itemsResult.rows;
    }

    return invoice;
  },

  findAll: async () => {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC`
    );
    return result.rows;
  },

  update: async (id, invoiceData) => {
    await pool.query(
      `UPDATE invoices
       SET status = $1, subtotal = $2, tax_rate = $3, tax_amount = $4, discount = $5, total = $6, notes = $7, terms = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        invoiceData.status,
        invoiceData.subtotal,
        invoiceData.tax_rate,
        invoiceData.tax_amount,
        invoiceData.discount,
        invoiceData.total,
        invoiceData.notes || null,
        invoiceData.terms || null,
        id,
      ]
    );

    return Invoice.findById(id);
  },

  updateEmailStatus: async (id, sent = true) => {
    await pool.query(
      `UPDATE invoices
       SET email_sent = $1, email_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [sent ? 1 : 0, id]
    );
    return Invoice.findById(id);
  },

  delete: async (id) => {
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
  },
};
