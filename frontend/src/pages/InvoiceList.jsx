import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI } from '../services/api';

function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceAPI.getAll();
      // Safely extract data with fallback to empty array
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
      setInvoices([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await invoiceAPI.delete(id);
      fetchInvoices();
    } catch (err) {
      alert('Failed to delete invoice');
      console.error(err);
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    try {
      const response = await invoiceAPI.generatePDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
      console.error(err);
    }
  };

  const handleSendEmail = async (id) => {
    if (!confirm('Send this invoice via email to the customer?')) return;

    try {
      setSendingEmail(id);
      await invoiceAPI.sendEmail(id);
      alert('Invoice sent successfully!');
      fetchInvoices();
    } catch (err) {
      alert('Failed to send email. Please check your email configuration.');
      console.error(err);
    } finally {
      setSendingEmail(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/" className="hover:text-indigo-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Invoices</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Invoices</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your invoices</p>
          </div>
          <Link to="/create-invoice" className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-500 mb-4">No invoices found</p>
          <Link to="/create-invoice" className="btn-primary">
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {invoice.invoice_number}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                    {invoice.email_sent === 1 && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        ✓ Email Sent
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Customer:</span> {invoice.customer_name}
                    </div>
                    <div>
                      <span className="font-medium">Issue Date:</span>{' '}
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>{' '}
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-600">Email:</span>{' '}
                    <span className="text-sm text-gray-500">{invoice.customer_email}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    ${parseFloat(invoice.total).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  📥 Download PDF
                </button>
                <button
                  onClick={() => handleSendEmail(invoice.id)}
                  disabled={sendingEmail === invoice.id}
                  className="text-sm px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  {sendingEmail === invoice.id ? '📧 Sending...' : '📧 Send Email'}
                </button>
                <Link
                  to={`/edit-invoice/${invoice.id}`}
                  className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ✏️ Edit
                </Link>
                <button
                  onClick={() => handleDelete(invoice.id)}
                  className="text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
