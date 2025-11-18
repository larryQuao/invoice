import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Invoice = {
  create: (invoiceData) => {
    const id = uuidv4();
    const invoiceNumber = invoiceData.invoice_number || `INV-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO invoices (id, invoice_number, customer_id, issue_date, due_date, status, subtotal, tax_rate, tax_amount, discount, total, notes, terms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      invoiceData.terms || null
    );

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of invoiceData.items) {
        const itemId = uuidv4();
        itemStmt.run(itemId, id, item.description, item.quantity, item.unit_price, item.amount);
      }
    }

    return Invoice.findById(id);
  },

  findById: (id) => {
    const stmt = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address, c.city as customer_city, c.state as customer_state,
             c.zip as customer_zip, c.country as customer_country
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `);
    const invoice = stmt.get(id);

    if (invoice) {
      const itemsStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
      invoice.items = itemsStmt.all(id);
    }

    return invoice;
  },

  findByInvoiceNumber: (invoiceNumber) => {
    const stmt = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address, c.city as customer_city, c.state as customer_state,
             c.zip as customer_zip, c.country as customer_country
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.invoice_number = ?
    `);
    const invoice = stmt.get(invoiceNumber);

    if (invoice) {
      const itemsStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
      invoice.items = itemsStmt.all(invoice.id);
    }

    return invoice;
  },

  findAll: () => {
    const stmt = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);
    return stmt.all();
  },

  update: (id, invoiceData) => {
    const stmt = db.prepare(`
      UPDATE invoices
      SET status = ?, subtotal = ?, tax_rate = ?, tax_amount = ?, discount = ?, total = ?, notes = ?, terms = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      invoiceData.status,
      invoiceData.subtotal,
      invoiceData.tax_rate,
      invoiceData.tax_amount,
      invoiceData.discount,
      invoiceData.total,
      invoiceData.notes || null,
      invoiceData.terms || null,
      id
    );

    return Invoice.findById(id);
  },

  updateEmailStatus: (id, sent = true) => {
    const stmt = db.prepare(`
      UPDATE invoices
      SET email_sent = ?, email_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(sent ? 1 : 0, id);
    return Invoice.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
    stmt.run(id);
  },
};
