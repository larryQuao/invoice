import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import CustomerList from './pages/CustomerList';
import CreateCustomer from './pages/CreateCustomer';

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/create-customer" element={<CreateCustomer />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
