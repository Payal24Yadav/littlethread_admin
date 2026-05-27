import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Package, Menu, X } from 'lucide-react';

import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Sales from './pages/Sales';
import SaleDetail from './pages/SaleDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import ColorVariants from './pages/ColorVariants';
import Login from './pages/Login';
import Messages from './pages/Messages';
import Coupons from './pages/Coupons';
import api from './utils/api';



import { useAdminAuth } from './hooks/useAdminAuth';

const ProtectedRoute = ({ children }) => {
  const { loading, isAdmin } = useAdminAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin" />
      </div>
    );
  }
  return isAdmin ? children : <Navigate to="/login" replace />;
};

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'ml-0 md:ml-60'}`}>
        {/* Mobile Header Toggle */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-30 flex items-center px-6">
           <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
             <Menu size={24} />
           </button>
           <span className="ml-4 text-sm font-black uppercase italic tracking-tight">Clothing Store</span>
        </div>
        
        {/* Spacer for fixed mobile header */}
        <div className="md:hidden h-16" />
        
        {children}
      </div>
    </div>
  );
};



const Dashboard = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
      <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Dashboard</h1>
    </header>
    <main className="p-10">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight dark:text-white">Welcome back !</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's a summary of your store's performance today.</p>
      </div>
    </main>
  </div>
);



const Settings = () => {
  const [codEnabled, setCodEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setCodEnabled(data.codEnabled);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggleCOD = async () => {
    setSaving(true);
    const next = !codEnabled;
    try {
      await api.post('/settings', { codEnabled: next });
      setCodEnabled(next);
      // Optional: keep localStorage for immediate UI feedback if needed, 
      // but the source of truth is now the DB.
      localStorage.setItem('admin_cod_enabled', String(next));
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Settings</h1>
      </header>
      <main className="p-10 space-y-6">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight dark:text-white uppercase tracking-tighter mb-1">Store Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your store configuration centrally.</p>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm relative overflow-hidden">
          {saving && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
            </div>
          )}
          
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Payment Methods</h3>

          <div className="flex items-center justify-between py-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <p className="text-sm font-bold dark:text-white">Razorpay (UPI / Cards / Netbanking)</p>
              <p className="text-[0.72rem] text-gray-400 mt-0.5">Online payment via Razorpay gateway</p>
            </div>
            <span className="text-[0.65rem] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              Always On
            </span>
          </div>

          <div className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-bold dark:text-white">Cash on Delivery (COD)</p>
              <p className="text-[0.72rem] text-gray-400 mt-0.5">
                {codEnabled
                  ? 'COD is visible to customers at checkout (₹70 extra charge)'
                  : 'COD is hidden from checkout. Customers see Razorpay only.'}
              </p>
            </div>
            <button
              onClick={toggleCOD}
              disabled={saving}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${codEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${codEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {!codEnabled && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-5 py-3">
              <p className="text-[0.7rem] text-amber-700 font-bold uppercase tracking-widest">⚠ COD is currently DISABLED — not visible to customers</p>
            </div>
          )}
          {codEnabled && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-3">
              <p className="text-[0.7rem] text-emerald-700 font-bold uppercase tracking-widest">✓ COD is ENABLED — visible to customers at checkout</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/products/:id" element={
          <ProtectedRoute>
            <Layout>
              <ProductDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/products/:id/variants" element={
          <ProtectedRoute>
            <Layout>
              <ColorVariants />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/categories" element={
          <ProtectedRoute>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/categories/:id" element={
          <ProtectedRoute>
            <Layout>
              <CategoryDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/collections" element={
          <ProtectedRoute>
            <Layout>
              <Collections />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/collections/:id" element={
          <ProtectedRoute>
            <Layout>
              <CollectionDetail />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reviews" element={
          <ProtectedRoute>
            <Layout>
              <Reviews />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetail /></Layout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
        <Route path="/sales/:id" element={<ProtectedRoute><Layout><SaleDetail /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetail /></Layout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute><Layout><Coupons /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />


      </Routes>
    </Router>
  );
}

export default App;
