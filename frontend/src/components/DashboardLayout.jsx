import Sidebar from './Sidebar';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="lg:hidden w-12"></div> {/* Spacer for mobile menu button */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Invoice Management</h2>
                  <p className="text-sm text-gray-500">Manage your invoices and customers</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="px-6 py-4">
            <p className="text-center text-gray-500 text-sm">
              Modern Invoice Management System - Generate and send invoices with ease
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
