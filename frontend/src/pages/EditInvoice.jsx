import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { customerAPI, invoiceAPI } from '../services/api';
import { format } from 'date-fns';

function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: '',
    due_date: '',
    status: 'draft',
    tax_rate: 0,
    discount: 0,
    notes: '',
    terms: '',
  });

  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, invoiceResponse] = await Promise.all([
          customerAPI.getAll(),
          invoiceAPI.getById(id)
        ]);

        setCustomers(customersResponse.data.data);

        const invoice = invoiceResponse.data.data;
        setFormData({
          customer_id: invoice.customer_id || '',
          issue_date: invoice.issue_date || '',
          due_date: invoice.due_date || '',
          status: invoice.status || 'draft',
          tax_rate: invoice.tax_rate || 0,
          discount: invoice.discount || 0,
          notes: invoice.notes || '',
          terms: invoice.terms || '',
        });

        if (invoice.items && invoice.items.length > 0) {
          setItems(invoice.items.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
          })));
        }
      } catch (err) {
        setError('Failed to load invoice data');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    return ((subtotal - discount) * (parseFloat(formData.tax_rate) || 0)) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_id) {
      setError('Please select a customer');
      return;
    }

    if (items.some(item => !item.description)) {
      setError('Please fill in all item descriptions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invoiceData = {
        ...formData,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total: calculateTotal(),
      };

      await invoiceAPI.update(id, invoiceData);
      navigate('/invoices');
    } catch (err) {
      setError('Failed to update invoice. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-indigo-600">Dashboard</Link>
          <span>/</span>
          <Link to="/invoices" className="hover:text-indigo-600">Invoices</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Edit Invoice</span>
        </div>
        <button
          onClick={() => navigate('/invoices')}
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>
      </div>

      <div className="card max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Invoice</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      value={`$${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`}
                      className="input-field bg-gray-50"
                      disabled
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-96 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <label className="text-sm text-gray-600">Discount:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      className="input-field w-32"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-sm font-medium">
                      ${parseFloat(formData.discount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <label className="text-sm text-gray-600">Tax Rate (%):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="tax_rate"
                      value={formData.tax_rate}
                      onChange={handleChange}
                      className="input-field w-32"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-sm font-medium">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-indigo-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Additional notes for the customer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Invoice'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditInvoice;
