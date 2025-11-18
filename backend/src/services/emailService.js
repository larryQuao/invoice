import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Detect if we should use SendGrid Web API instead of SMTP
const useSendGridAPI = () => {
  // Use API if explicitly enabled OR if using SendGrid SMTP (to avoid port blocking)
  return process.env.USE_SENDGRID_API === 'true' ||
         process.env.EMAIL_HOST?.includes('sendgrid');
};

// Initialize SendGrid API if needed
if (useSendGridAPI() && process.env.EMAIL_PASSWORD) {
  // For SendGrid, EMAIL_PASSWORD should be the API key
  sgMail.setApiKey(process.env.EMAIL_PASSWORD);
  console.log('✅ SendGrid Web API initialized');
}

// Create reusable transporter for SMTP
const createTransporter = () => {
  // Log configuration (without password) for debugging
  console.log('Email configuration:', {
    method: useSendGridAPI() ? 'SendGrid Web API' : 'SMTP',
    host: process.env.EMAIL_HOST || 'NOT SET',
    port: process.env.EMAIL_PORT || '587',
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'NOT SET',
    hasPassword: !!process.env.EMAIL_PASSWORD,
  });

  if (useSendGridAPI()) {
    // Don't create transporter for SendGrid API
    return null;
  }

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration incomplete. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Generate HTML email template
const generateEmailHTML = (invoice) => {
  return `
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
  `;
};

// Send invoice email using SendGrid Web API
const sendInvoiceEmailWithSendGrid = async (invoice, pdfPath) => {
  const fs = await import('fs');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const fromEmail = process.env.EMAIL_USER || process.env.COMPANY_EMAIL;

  console.log('SendGrid email config:', {
    from: fromEmail,
    to: invoice.customer_email,
    hasApiKey: !!process.env.EMAIL_PASSWORD,
    apiKeyPrefix: process.env.EMAIL_PASSWORD?.substring(0, 10) + '...'
  });

  const msg = {
    to: invoice.customer_email,
    from: fromEmail,
    subject: `Invoice ${invoice.invoice_number} from ${process.env.COMPANY_NAME}`,
    html: generateEmailHTML(invoice),
    attachments: [
      {
        content: pdfBase64,
        filename: `invoice-${invoice.invoice_number}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  const response = await sgMail.send(msg);
  console.log('✅ Email sent via SendGrid Web API');
  return { success: true, messageId: response[0].headers['x-message-id'] };
};

// Send invoice email using SMTP
const sendInvoiceEmailWithSMTP = async (invoice, pdfPath, transporter) => {
  const mailOptions = {
    from: `${process.env.COMPANY_NAME} <${process.env.EMAIL_USER}>`,
    to: invoice.customer_email,
    subject: `Invoice ${invoice.invoice_number} from ${process.env.COMPANY_NAME}`,
    html: generateEmailHTML(invoice),
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        path: pdfPath,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent via SMTP:', info.messageId);
  return { success: true, messageId: info.messageId };
};

export const sendInvoiceEmail = async (invoice, pdfPath) => {
  try {
    if (useSendGridAPI()) {
      console.log('📧 Sending email via SendGrid Web API...');
      return await sendInvoiceEmailWithSendGrid(invoice, pdfPath);
    } else {
      console.log('📧 Sending email via SMTP...');
      const transporter = createTransporter();
      return await sendInvoiceEmailWithSMTP(invoice, pdfPath, transporter);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);

    // Log detailed error information for SendGrid errors
    if (error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
    }

    throw error;
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    if (useSendGridAPI()) {
      // For SendGrid API, just check if API key is set
      if (!process.env.EMAIL_PASSWORD) {
        throw new Error('SendGrid API key (EMAIL_PASSWORD) is not set');
      }
      return { success: true, message: 'SendGrid Web API configuration is valid' };
    } else {
      const transporter = createTransporter();
      await transporter.verify();
      return { success: true, message: 'SMTP configuration is valid' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};
