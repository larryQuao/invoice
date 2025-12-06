import { Invoice } from '../models/Invoice.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import fs from 'fs';

export const createInvoice = async (req, res) => {
  try {
    // Calculate totals
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => {
      const amount = item.quantity * item.unit_price;
      item.amount = amount;
      return sum + amount;
    }, 0);

    const discount = req.body.discount || 0;
    const taxRate = req.body.tax_rate || 0;
    const taxAmount = ((subtotal - discount) * taxRate) / 100;
    const total = subtotal - discount + taxAmount;

    const invoiceData = {
      ...req.body,
      items,
      subtotal,
      tax_amount: taxAmount,
      total,
    };

    const invoice = await Invoice.create(invoiceData);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.update(req.params.id, req.body);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.delete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const pdfPath = await generateInvoicePDF(invoice);

    // Send the PDF file
    res.download(pdfPath, `invoice-${invoice.invoice_number}.pdf`, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
      }
      // Clean up: delete the PDF file after sending
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting PDF:', unlinkErr);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate PDF
    const pdfPath = await generateInvoicePDF(invoice);

    // Send email
    const result = await sendInvoiceEmail(invoice, pdfPath);

    // Update invoice email status
    await Invoice.updateEmailStatus(req.params.id, true);

    // Clean up: delete the PDF file
    fs.unlink(pdfPath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting PDF:', unlinkErr);
    });

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
