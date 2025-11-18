import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../../output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `invoice-${invoice.invoice_number}.pdf`;
      const filePath = path.join(outputDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Company header
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

      // Invoice title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice details box
      const invoiceInfoTop = 150;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', 400, invoiceInfoTop)
        .font('Helvetica')
        .text(invoice.invoice_number, 500, invoiceInfoTop)
        .font('Helvetica-Bold')
        .text('Issue Date:', 400, invoiceInfoTop + 15)
        .font('Helvetica')
        .text(new Date(invoice.issue_date).toLocaleDateString(), 500, invoiceInfoTop + 15)
        .font('Helvetica-Bold')
        .text('Due Date:', 400, invoiceInfoTop + 30)
        .font('Helvetica')
        .text(new Date(invoice.due_date).toLocaleDateString(), 500, invoiceInfoTop + 30)
        .font('Helvetica-Bold')
        .text('Status:', 400, invoiceInfoTop + 45)
        .font('Helvetica')
        .text(invoice.status.toUpperCase(), 500, invoiceInfoTop + 45);

      // Bill to section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, invoiceInfoTop);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.customer_name, 50, invoiceInfoTop + 20)
        .text(invoice.customer_email, 50, invoiceInfoTop + 35);

      if (invoice.customer_address) {
        doc.text(invoice.customer_address, 50, invoiceInfoTop + 50);
      }

      if (invoice.customer_city || invoice.customer_state || invoice.customer_zip) {
        const location = [invoice.customer_city, invoice.customer_state, invoice.customer_zip]
          .filter(Boolean)
          .join(', ');
        doc.text(location, 50, invoiceInfoTop + 65);
      }

      if (invoice.customer_phone) {
        doc.text(invoice.customer_phone, 50, invoiceInfoTop + 80);
      }

      // Items table
      const tableTop = 280;
      doc
        .fontSize(10)
        .font('Helvetica-Bold');

      // Table headers
      doc
        .text('Description', 50, tableTop)
        .text('Qty', 320, tableTop, { width: 50, align: 'right' })
        .text('Unit Price', 380, tableTop, { width: 80, align: 'right' })
        .text('Amount', 470, tableTop, { width: 80, align: 'right' });

      // Table line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table items
      let position = tableTop + 25;
      doc.font('Helvetica');

      invoice.items.forEach((item) => {
        doc
          .text(item.description, 50, position, { width: 250 })
          .text(item.quantity.toString(), 320, position, { width: 50, align: 'right' })
          .text(`$${item.unit_price.toFixed(2)}`, 380, position, { width: 80, align: 'right' })
          .text(`$${item.amount.toFixed(2)}`, 470, position, { width: 80, align: 'right' });

        position += 30;
      });

      // Totals section
      position += 20;
      const totalsX = 380;

      doc.font('Helvetica');
      doc
        .text('Subtotal:', totalsX, position)
        .text(`$${invoice.subtotal.toFixed(2)}`, 470, position, { width: 80, align: 'right' });

      position += 20;

      if (invoice.discount > 0) {
        doc
          .text(`Discount:`, totalsX, position)
          .text(`-$${invoice.discount.toFixed(2)}`, 470, position, { width: 80, align: 'right' });
        position += 20;
      }

      if (invoice.tax_rate > 0) {
        doc
          .text(`Tax (${invoice.tax_rate}%):`, totalsX, position)
          .text(`$${invoice.tax_amount.toFixed(2)}`, 470, position, { width: 80, align: 'right' });
        position += 20;
      }

      // Total line
      doc
        .moveTo(380, position)
        .lineTo(550, position)
        .stroke();

      position += 10;

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalsX, position)
        .text(`$${invoice.total.toFixed(2)}`, 470, position, { width: 80, align: 'right' });

      // Notes section
      if (invoice.notes) {
        position += 50;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 50, position);

        doc
          .font('Helvetica')
          .text(invoice.notes, 50, position + 15, { width: 500 });
      }

      // Terms section
      if (invoice.terms) {
        position += (invoice.notes ? 80 : 50);
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Terms & Conditions:', 50, position);

        doc
          .font('Helvetica')
          .text(invoice.terms, 50, position + 15, { width: 500 });
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Thank you for your business!',
          50,
          700,
          { align: 'center', width: 500 }
        );

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
