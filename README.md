# Modern Invoice Management System

A full-stack application for creating professional invoices and sending them to customers via email with PDF attachments.

## Features

- **Invoice Management**: Create, view, and manage invoices with a clean, modern interface
- **Customer Management**: Maintain a database of customers with complete contact information
- **PDF Generation**: Automatically generate professional PDF invoices with your company branding
- **Email Integration**: Send invoices directly to customers via email with PDF attachments
- **Status Tracking**: Track invoice status (Draft, Sent, Paid, Overdue)
- **Calculations**: Automatic calculation of subtotals, taxes, discounts, and totals
- **Line Items**: Add multiple line items with quantity and unit price
- **Responsive Design**: Modern, mobile-friendly UI built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express - RESTful API server
- **SQLite** with better-sqlite3 - Lightweight database
- **PDFKit** - PDF generation
- **Nodemailer** - Email sending
- **dotenv** - Environment configuration

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Modern styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Project Structure

```
invoice/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and initialization
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # PDF and email services
│   │   └── index.js        # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── index.html
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3001
DATABASE_PATH=./database.sqlite

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=info@yourcompany.com
COMPANY_ADDRESS=123 Business Street, City, State 12345
COMPANY_PHONE=+1 (555) 123-4567
COMPANY_WEBSITE=www.yourcompany.com
```

5. Initialize the database:
```bash
npm run init-db
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will be running at `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Email Configuration

### Using Gmail

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Select "2-Step Verification"
   - At the bottom, select "App passwords"
   - Generate a new app password for "Mail"
3. Use the generated password in your `.env` file as `EMAIL_PASSWORD`

### Using Other SMTP Providers

Update the `.env` file with your SMTP provider's settings:
- **EMAIL_HOST**: SMTP server hostname
- **EMAIL_PORT**: SMTP port (usually 587 or 465)
- **EMAIL_SECURE**: true for port 465, false for other ports
- **EMAIL_USER**: Your email username
- **EMAIL_PASSWORD**: Your email password or app-specific password

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `POST /api/invoices/:id/email` - Send invoice via email

## Usage

### Creating a Customer

1. Navigate to the "Customers" tab
2. Click "Add Customer"
3. Fill in customer details (name and email are required)
4. Click "Create Customer"

### Creating an Invoice

1. Navigate to the "Invoices" tab
2. Click "Create Invoice"
3. Select a customer from the dropdown
4. Set issue date and due date
5. Add line items with description, quantity, and unit price
6. Optionally add tax rate, discount, notes, and terms
7. Click "Create Invoice"

### Sending an Invoice

1. From the invoice list, click "Send Email" on any invoice
2. The system will generate a PDF and email it to the customer
3. The invoice status will be updated to show it was sent

### Downloading an Invoice

1. From the invoice list, click "Download PDF" on any invoice
2. The PDF will be generated and downloaded to your computer

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs with Vite HMR
```

### Production Build

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## Features Breakdown

### Invoice PDF
- Professional layout with company branding
- Customer billing information
- Itemized line items with quantities and prices
- Subtotal, tax, discount, and total calculations
- Notes and terms sections
- Clean, print-ready format

### Email Template
- HTML email with responsive design
- Invoice summary with key details
- Professional branding with company information
- PDF attachment

### User Interface
- Clean, modern design with Tailwind CSS
- Responsive layout for mobile and desktop
- Status badges for invoice tracking
- Real-time calculation of totals
- Form validation and error handling

## Troubleshooting

### Email not sending
- Verify your SMTP credentials in `.env`
- Check if you're using an app-specific password (required for Gmail)
- Ensure your email provider allows SMTP access
- Check firewall settings

### Database errors
- Run `npm run init-db` to recreate the database
- Check file permissions on the database file
- Ensure DATABASE_PATH in `.env` is correct

### PDF generation errors
- Check that the output directory has write permissions
- Verify all invoice data is properly formatted
- Check console logs for specific errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
