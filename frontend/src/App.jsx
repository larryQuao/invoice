import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import EditInvoice from './pages/EditInvoice';
import CustomerList from './pages/CustomerList';
import CreateCustomer from './pages/CreateCustomer';
import EditCustomer from './pages/EditCustomer';

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/edit-invoice/:id" element={<EditInvoice />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/create-customer" element={<CreateCustomer />} />
        <Route path="/edit-customer/:id" element={<EditCustomer />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
