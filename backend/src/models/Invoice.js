import { db } from "../index.js";
import { v4 as uuidv4 } from "uuid";

export const Invoice = {
  create: async (invoiceData) => {
    const id = uuidv4();
    const invoiceNumber = invoiceData.invoice_number || `INV-${Date.now()}`;

    const invoiceRef = db.collection("invoices").doc(id);

    const invoiceDoc = {
      id,
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      status: invoiceData.status || "draft",
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

    // Insert items as subcollection
    if (invoiceData.items?.length) {
      for (const item of invoiceData.items) {
        const itemId = uuidv4();
        await invoiceRef.collection("items").doc(itemId).set({
          id: itemId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          created_at: new Date(),
        });
      }
    }

    return await Invoice.findById(id);
  },

  findById: async (id) => {
    const invoiceSnap = await db.collection("invoices").doc(id).get();
    if (!invoiceSnap.exists) return null;

    let invoice = invoiceSnap.data();

    // Convert Firestore timestamps → JS Dates
    if (invoice.issue_date?.seconds)
      invoice.issue_date = new Date(invoice.issue_date.seconds * 1000);

    if (invoice.due_date?.seconds)
      invoice.due_date = new Date(invoice.due_date.seconds * 1000);

    // Load invoice items
    const itemsSnap = await db
      .collection("invoices")
      .doc(id)
      .collection("items")
      .get();

    invoice.items = itemsSnap.docs.map((d) => d.data());

    // Load customer details (was provided via SQL JOIN before)
    const customerSnap = await db
      .collection("customers")
      .doc(invoice.customer_id)
      .get();
    if (customerSnap.exists) {
      const c = customerSnap.data();
      invoice.customer_name = c.name;
      invoice.customer_email = c.email;
      invoice.customer_phone = c.phone;
      invoice.customer_address = c.address;
      invoice.customer_city = c.city;
      invoice.customer_state = c.state;
      invoice.customer_zip = c.zip;
      invoice.customer_country = c.country;
    }

    return invoice;
  },

  findAll: async () => {
    const snap = await db
      .collection("invoices")
      .orderBy("created_at", "desc")
      .get();

    const invoices = [];

    for (const doc of snap.docs) {
      const invoice = doc.data();

      // Fetch customer details
      const customerSnap = await db
        .collection("customers")
        .doc(invoice.customer_id)
        .get();

      if (customerSnap.exists) {
        const c = customerSnap.data();
        invoice.customer_name = c.name;
        invoice.customer_email = c.email;
      }

      invoices.push(invoice);
    }

    return invoices;
  },

  update: async (id, invoiceData) => {
    const ref = db.collection("invoices").doc(id);

    await ref.update({
      ...invoiceData,
      updated_at: new Date(),
    });

    return await Invoice.findById(id);
  },

  updateEmailStatus: async (id, sent = true) => {
    const ref = db.collection("invoices").doc(id);

    await ref.update({
      email_sent: sent,
      email_sent_at: sent ? new Date() : null,
      updated_at: new Date(),
    });

    return await Invoice.findById(id);
  },

  delete: async (id) => {
    const ref = db.collection("invoices").doc(id);

    const itemsSnap = await ref.collection("items").get();
    const batch = db.batch();

    itemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(ref);

    await batch.commit();
  },
};
