import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronLeft, Package, User, CreditCard, Calendar, Globe, Store, AlertCircle, Edit3, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const sourceIcon = (source) => {
  if (!source) return <Globe size={14} className="text-gray-400" />;
  if (source.toLowerCase().includes('dcr') || source.toLowerCase().includes('manual')) return <Store size={14} className="text-amber-500" />;
  return <Globe size={14} className="text-blue-400" />;
};

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    variantTitle: '',
    quantity: 1,
    price: 0,
    paymentMode: '',
    paymentId: '',
    notes: '',
    source: ''
  });

  const fetchSale = async () => {
    try {
      const res = await api.get('/sales');
      const found = (res.data || []).find(s => s.id === id);
      if (found) {
        setSale(found);
        setEditForm({
          customerName: found.customerName || '',
          customerEmail: found.customerEmail || '',
          customerPhone: found.customerPhone || '',
          variantTitle: found.variantTitle || '',
          quantity: found.quantity || 1,
          price: found.price || 0,
          paymentMode: found.paymentMode || 'Cash',
          paymentId: found.paymentId || '',
          notes: found.notes || '',
          source: found.source || 'External'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.put(`/sales/${id}`, editForm);
      setIsEditing(false);
      fetchSale();
      alert('Sale updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update sale');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#0a0a0a]">
        <AlertCircle size={40} className="text-gray-300" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Sale not found</p>
        <button onClick={() => navigate('/sales')} className="text-xs font-black uppercase underline">Back to Sales</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Sale Details</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">#{sale.id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r dark:border-white/5">
            {sourceIcon(sale.source)}
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">{sale.source || 'Unknown'}</span>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.7rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
          >
            <Edit3 size={14} /> Edit
          </button>
        </div>
      </header>

      <main className="p-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Product Info */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4">Product</h3>
          <div className="flex items-center gap-5">
            {sale.thumbnail ? (
              <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 flex-shrink-0 ring-1 ring-black/5">
                <img src={sale.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                <Package size={24} className="text-gray-300" />
              </div>
            )}
            <div>
              <p className="text-sm font-black dark:text-white uppercase tracking-tight">{sale.productName || '—'}</p>
              <div className="flex gap-2 mt-1">
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">{sale.source || 'Store Sale'}</p>
                {sale.variantTitle && (
                  <span className="text-[0.65rem] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-500 font-black uppercase tracking-widest">
                    {sale.variantTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-white/5">
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Date</p>
              <p className="text-xs font-bold dark:text-white mt-1">{formatDate(sale.date)}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Total Amount</p>
              <p className="text-base font-black dark:text-white mt-1">₹{sale.price?.toLocaleString()} <span className="text-gray-400 text-xs font-bold">({sale.quantity}×)</span></p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Payment Mode</p>
              <p className="text-xs font-bold dark:text-white mt-1">{sale.paymentMode || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Payment ID</p>
              <p className="text-xs font-bold dark:text-white mt-1 truncate">{sale.paymentId || '—'}</p>
            </div>
          </div>

          {sale.notes && (
            <div className="pt-4 border-t dark:border-white/5">
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs font-bold dark:text-white">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/5 pb-4">Customer Info</h3>

          <div className="space-y-5">
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Name</p>
              <p className="text-sm font-bold dark:text-white mt-1">{sale.customerName || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold dark:text-white mt-1 break-all">{sale.customerEmail || '—'}</p>
            </div>
            <div>
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Phone</p>
              <p className="text-sm font-bold dark:text-white mt-1">{sale.customerPhone || '—'}</p>
            </div>
          </div>
        </div>

      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/10" onClick={() => setIsEditing(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-8"
            >
              <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-[#111] pb-4 z-10 border-b dark:border-white/10">
                <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Edit Sale Record</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/10 pb-2">Customer Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.customerEmail} onChange={e => setEditForm({...editForm, customerEmail: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                        <input type="tel" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.customerPhone} onChange={e => setEditForm({...editForm, customerPhone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Variant (Size/Color)</label>
                    <input type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.variantTitle} onChange={e => setEditForm({...editForm, variantTitle: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 border-b dark:border-white/10 pb-2">Transaction Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                      <input type="number" min="1" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Total Price (₹)</label>
                      <input type="number" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Mode</label>
                      <select className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.paymentMode} onChange={e => setEditForm({...editForm, paymentMode: e.target.value})}>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment ID</label>
                      <input type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.paymentId} onChange={e => setEditForm({...editForm, paymentId: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                    <textarea rows="2" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-white/10">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaleDetail;
