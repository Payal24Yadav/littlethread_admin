import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { TrendingUp, Globe, Store, Package, DollarSign, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const [saleForm, setSaleForm] = useState({
    productId: '',
    variantTitle: '',
    quantity: 1,
    price: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMode: 'Cash',
    paymentId: '',
    notes: '',
    source: 'External'
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales'); // Assuming this endpoint exists or will be added
      setSales(res.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      // Dummy data for visualization if endpoint fails
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this sale record?')) return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSales();
      alert('Sale record deleted successfully');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale record');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const productList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleRegisterSale = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/sales/store', saleForm);
      setShowSaleModal(false);
      setSaleForm({
        productId: '',
        variantTitle: '',
        quantity: 1,
        price: 0,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        paymentMode: 'Cash',
        paymentId: '',
        notes: '',
        source: 'External'
      });
      fetchSales();
      fetchProducts();
    } catch (error) {
      alert('Error registering sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSaleDetail = (sale) => {
    navigate(`/sales/${sale.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Sales</h1>
        <button 
          onClick={() => setShowSaleModal(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] md:text-[0.7rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
        >
          <Plus size={16} /> <span className="hidden xs:inline">Register Sale</span><span className="xs:hidden">New</span>
        </button>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-10">

        {/* Stats Grid removed per request (show only transactions list) */}
        <div className="py-1" />

        {/* Transactions Table */}
         <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
               <h3 className="text-[0.7rem] font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Sales</h3>
               <div className="flex gap-2">
                  <button className="flex-1 md:flex-none flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400"><Filter size={16} /></button>
                  <button className="flex-1 md:flex-none flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400"><Search size={16} /></button>
               </div>
            </div>
           
           <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/2">
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Source</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-black/10 border-t-black dark:border-white/10 dark:border-t-white rounded-full animate-spin mb-4" />
                          <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Loading sales...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sales.length > 0 ? sales.map((sale, i) => (
                    <tr key={i} onClick={() => openSaleDetail(sale)} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors cursor-pointer">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          {sale.thumbnail ? (
                            <img src={sale.thumbnail} alt={sale.productName} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
                          )}
                          <span className="text-xs font-black uppercase tracking-tight">{sale.productName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[0.55rem] font-black uppercase tracking-widest ${sale.source === 'Website' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sale.source}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold">{sale.quantity}x</td>
                      <td className="px-8 py-4 text-xs font-black tracking-tighter">₹{sale.price}</td>
                      <td className="px-8 py-4 text-[0.65rem] text-gray-400 font-bold uppercase">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={(e) => handleDeleteSale(e, sale.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Sale"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <Package size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                        <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">No sales recorded yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </main>

      {/* Register Store Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/10">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md space-y-8"
           >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Register Sale</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Plus className="rotate-45" /></button>
              </div>
              
              <form onSubmit={handleRegisterSale} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Select Product *</label>
                    <select 
                      required
                      className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 ring-black/5"
                      value={saleForm.productId}
                      onChange={e => {
                        const p = products.find(x => x.id === e.target.value);
                        setSaleForm({ 
                          ...saleForm, 
                          productId: e.target.value, 
                          price: p?.price || 0,
                          variantTitle: '' // Reset variant when product changes
                        });
                      }}
                    >
                      <option value="">Choose product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.totalStock ?? (p.variants?.length > 0 ? p.variants.reduce((s,v)=>s+(v.stock||0),0) : (p.stock||0))})</option>
                      ))}
                    </select>
                  </div>

                  {/* Variant Selection */}
                  {saleForm.productId && products.find(p => p.id === saleForm.productId)?.variants?.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Select Variant *</label>
                      <select 
                        required
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 ring-black/5"
                        value={saleForm.variantTitle}
                        onChange={e => setSaleForm({ ...saleForm, variantTitle: e.target.value })}
                      >
                        <option value="">Choose variant (Size/Color)...</option>
                        {products.find(p => p.id === saleForm.productId).variants.map(v => (
                          <option key={v.id} value={v.title}>{v.title} (Stock: {v.stock || 0})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity *</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                        value={saleForm.quantity}
                        onChange={e => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Total Price (₹) *</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                        value={saleForm.price}
                        onChange={e => setSaleForm({ ...saleForm, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                      value={saleForm.customerName}
                      onChange={e => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Email</label>
                      <input 
                        type="email" 
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                        value={saleForm.customerEmail}
                        onChange={e => setSaleForm({ ...saleForm, customerEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Phone</label>
                      <input 
                        type="tel" 
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                        value={saleForm.customerPhone}
                        onChange={e => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Mode</label>
                      <select 
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 ring-black/5"
                        value={saleForm.paymentMode}
                        onChange={e => setSaleForm({ ...saleForm, paymentMode: e.target.value })}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. UPI Txn ID"
                        className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                        value={saleForm.paymentId}
                        onChange={e => setSaleForm({ ...saleForm, paymentId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                    <textarea 
                      rows="2"
                      className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl"
                      value={saleForm.notes}
                      onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${
                      isSubmitting 
                        ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed opacity-70' 
                        : 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] shadow-black/10'
                    }`}
                  >
                    {isSubmitting ? 'Registering...' : 'Save Sale & Update Stock'}
                  </button>
                </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Sales;
