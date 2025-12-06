import { db } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export const Customer = {
  create: async (customerData) => {
    const id = uuidv4();
    const doc = {
      id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || null,
      address: customerData.address || null,
      city: customerData.city || null,
      state: customerData.state || null,
      zip: customerData.zip || null,
      country: customerData.country || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.collection('customers').doc(id).set(doc);
    return doc;
  },

  findById: async (id) => {
    const snap = await db.collection('customers').doc(id).get();
    return snap.exists ? snap.data() : null;
  },

  findByEmail: async (email) => {
    const snap = await db.collection('customers')
      .where('email', '==', email)
      .limit(1)
      .get();

    return snap.empty ? null : snap.docs[0].data();
  },

  findAll: async () => {
    const snap = await db.collection('customers')
      .orderBy('created_at', 'desc')
      .get();

    return snap.docs.map(doc => doc.data());
  },

  update: async (id, customerData) => {
    const ref = db.collection('customers').doc(id);
    await ref.update({
      ...customerData,
      updated_at: new Date(),
    });

    const snap = await ref.get();
    return snap.data();
  },

  delete: async (id) => {
    await db.collection('customers').doc(id).delete();
  }
};