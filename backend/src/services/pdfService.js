import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Normalize Firestore Timestamp → JS Date
const normalizeDate = (value) => {
  if (!value) return '';
  if (value instanceof Date) return value;
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
};

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure dates are valid JS Date objects
      invoice.issue_date = normalizeDate(invoice.issue_date);
      invoice.due_date = normalizeDate(invoice.due_date);

      // Ensure items array exists
      invoice.items = Array.isArray(invoice.items) ? invoice.items : [];

      // Use Render’s only writable directory
      const outputDir = '/tmp';

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `invoice-${invoice.invoice_number}.pdf`;
      const filePath = path.join(outputDir, fileName);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // -----------------------------
      // HEADER + COMPANY INFO
      // -----------------------------
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(process.env.COMPANY_NAME || 'Your Company', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(process.env.COMPANY_ADDRESS || '123 Business St', 50, 80)
        .text(process.env.COMPANY_PHONE || '+1 (555) 123-4567', 50, 95)
        .text(process.env.COMPANY_EMAIL || 'info@company.com', 50, 110)
        .text(process.env.COMPANY_WEBSITE || 'www.company.com', 50, 125);

      // Title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      // -----------------------------
      // INVOICE DETAILS
      // -----------------------------
      const top = 150;
      const labelX = 350;
      const valueX = 470;

      doc.fontSize(10);

      doc.font('Helvetica-Bold')
        .text('Invoice Number:', labelX, top)
        .font('Helvetica')
        .text(invoice.invoice_number || 'N/A', valueX, top);

      doc.font('Helvetica-Bold')
        .text('Issue Date:', labelX, top + 20)
        .font('Helvetica')
        .text(invoice.issue_date?.toLocaleDateString() || 'N/A', valueX, top + 20);

      doc.font('Helvetica-Bold')
        .text('Due Date:', labelX, top + 40)
        .font('Helvetica')
        .text(invoice.due_date?.toLocaleDateString() || 'N/A', valueX, top + 40);

      doc.font('Helvetica-Bold')
        .text('Status:', labelX, top + 60)
        .font('Helvetica')
        .text((invoice.status || 'draft').toUpperCase(), valueX, top + 60);

      // -----------------------------
      // BILL TO — CUSTOMER DETAILS
      // -----------------------------
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, top);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.customer_name || 'N/A', 50, top + 20)
        .text(invoice.customer_email || 'N/A', 50, top + 35);

      if (invoice.customer_address) {
        doc.text(invoice.customer_address, 50, top + 50);
      }

      const cityLine = [
        invoice.customer_city,
        invoice.customer_state,
        invoice.customer_zip,
      ].filter(Boolean).join(', ');

      if (cityLine) {
        doc.text(cityLine, 50, top + 65);
      }

      if (invoice.customer_phone) {
        doc.text(invoice.customer_phone, 50, top + 80);
      }

      // -----------------------------
      // ITEMS TABLE
      // -----------------------------
      const tableTop = 280;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 320, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price', 380, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', 470, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let position = tableTop + 25;
      doc.font('Helvetica');

      invoice.items.forEach((item) => {
        doc
          .text(item.description || '', 50, position, { width: 250 })
          .text((item.quantity ?? 0).toString(), 320, position, { width: 50, align: 'right' })
          .text(`$${(item.unit_price ?? 0).toFixed(2)}`, 380, position, { width: 80, align: 'right' })
          .text(`$${(item.amount ?? 0).toFixed(2)}`, 470, position, { width: 80, align: 'right' });

        position += 30;
      });

      // -----------------------------
      // TOTALS
      // -----------------------------
      position += 20;
      const totalsX = 380;

      doc
        .text('Subtotal:', totalsX, position)
        .text(`$${(invoice.subtotal ?? 0).toFixed(2)}`, 470, position, { width: 80, align: 'right' });

      position += 20;

      if (invoice.discount > 0) {
        doc
          .text('Discount:', totalsX, position)
          .text(`-$${invoice.discount.toFixed(2)}`, 470, position, { width: 80, align: 'right' });
        position += 20;
      }

      if (invoice.tax_rate > 0) {
        doc
          .text(`Tax (${invoice.tax_rate}%):`, totalsX, position)
          .text(`$${invoice.tax_amount.toFixed(2)}`, 470, position, { width: 80, align: 'right' });
        position += 20;
      }

      doc.moveTo(380, position).lineTo(550, position).stroke();

      position += 10;
      doc.fontSize(12).font('Helvetica-Bold')
        .text('TOTAL:', totalsX, position)
        .text(`$${(invoice.total ?? 0).toFixed(2)}`, 470, position, { width: 80, align: 'right' });

      // -----------------------------
      // NOTES + TERMS
      // -----------------------------
      if (invoice.notes) {
        position += 50;
        doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, position);
        doc.font('Helvetica').text(invoice.notes, 50, position + 15, { width: 500 });
      }

      if (invoice.terms) {
        position += invoice.notes ? 80 : 50;
        doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, position);
        doc.font('Helvetica').text(invoice.terms, 50, position + 15, { width: 500 });
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

      // Finish PDF
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', (error) => reject(error));

    } catch (err) {
      reject(err);
    }
  });
};
