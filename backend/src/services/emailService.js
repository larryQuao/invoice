import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendInvoiceEmail = async (invoice, pdfPath) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.COMPANY_NAME} <${process.env.EMAIL_USER}>`,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} from ${process.env.COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .invoice-details {
              background-color: white;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
              border: 1px solid #e5e7eb;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #6b7280;
            }
            .value {
              color: #111827;
            }
            .total {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${process.env.COMPANY_NAME}</h1>
              <p>Invoice Notification</p>
            </div>
            <div class="content">
              <h2>Hello ${invoice.customer_name},</h2>
              <p>Thank you for your business! Please find your invoice attached to this email.</p>

              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="detail-row">
                  <span class="label">Invoice Number:</span>
                  <span class="value">${invoice.invoice_number}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Issue Date:</span>
                  <span class="value">${new Date(invoice.issue_date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Due Date:</span>
                  <span class="value">${new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value">${invoice.status.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Amount:</span>
                  <span class="value total">$${invoice.total.toFixed(2)}</span>
                </div>
              </div>

              ${invoice.notes ? `<p><strong>Notes:</strong><br>${invoice.notes}</p>` : ''}

              <p>If you have any questions about this invoice, please contact us at ${process.env.COMPANY_EMAIL} or ${process.env.COMPANY_PHONE}.</p>

              <p>We appreciate your business!</p>
            </div>
            <div class="footer">
              <p>${process.env.COMPANY_NAME}</p>
              <p>${process.env.COMPANY_ADDRESS}</p>
              <p>${process.env.COMPANY_EMAIL} | ${process.env.COMPANY_PHONE}</p>
              <p>${process.env.COMPANY_WEBSITE}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          path: pdfPath,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
