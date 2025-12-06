import { db } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export const Invoice = {
  create: async (invoiceData) => {
    const id = uuidv4();
    const invoiceNumber = invoiceData.invoice_number || `INV-${Date.now()}`;

    const invoiceRef = db.collection('invoices').doc(id);

    const invoiceDoc = {
      id,
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      status: invoiceData.status || 'draft',
      subtotal: invoiceData.subtotal || 0,
      tax_rate: invoiceData.tax_rate || 0,
      tax_amount: invoiceData.tax_amount || 0,
      discount: invoiceData.discount || 0,
      total: invoiceData.total || 0,
      notes: invoiceData.notes || null,
      terms: invoiceData.terms || null,
      email_sent: false,
      email_sent_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await invoiceRef.set(invoiceDoc);

    // Insert invoice items as a subcollection
    if (invoiceData.items?.length) {
      for (const item of invoiceData.items) {
        const itemId = uuidv4();
        await invoiceRef.collection('items').doc(itemId).set({
          id: itemId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          created_at: new Date(),
        });
      }
    }

    return Invoice.findById(id);
  },

  findById: async (id) => {
    const invoiceSnap = await db.collection('invoices').doc(id).get();
    if (!invoiceSnap.exists) return null;

    const invoice = invoiceSnap.data();

    // Load invoice items
    const itemsSnap = await db.collection('invoices')
      .doc(id)
      .collection('items')
      .get();

    invoice.items = itemsSnap.docs.map(doc => doc.data());
    return invoice;
  },

  findByInvoiceNumber: async (num) => {
    const snap = await db.collection('invoices')
      .where('invoice_number', '==', num)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const invoice = snap.docs[0].data();

    const itemsSnap = await db.collection('invoices')
      .doc(invoice.id)
      .collection('items')
      .get();

    invoice.items = itemsSnap.docs.map(doc => doc.data());
    return invoice;
  },

  findAll: async () => {
    const snap = await db.collection('invoices')
      .orderBy('created_at', 'desc')
      .get();

    return snap.docs.map(doc => doc.data());
  },

  update: async (id, invoiceData) => {
    const ref = db.collection('invoices').doc(id);

    await ref.update({
      ...invoiceData,
      updated_at: new Date(),
    });

    return Invoice.findById(id);
  },

  updateEmailStatus: async (id, sent = true) => {
    const ref = db.collection('invoices').doc(id);

    await ref.update({
      email_sent: sent,
      email_sent_at: sent ? new Date() : null,
      updated_at: new Date(),
    });

    return Invoice.findById(id);
  },

  delete: async (id) => {
    const ref = db.collection('invoices').doc(id);

    // Delete all invoice items
    const itemsSnap = await ref.collection('items').get();
    const batch = db.batch();

    itemsSnap.docs.forEach(doc => batch.delete(doc.ref));

    batch.delete(ref);
    await batch.commit();
  }
};
