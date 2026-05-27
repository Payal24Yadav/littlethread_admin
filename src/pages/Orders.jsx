import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ShoppingCart, Package, Clock, CheckCircle2, AlertCircle, Search, Filter, TrendingUp, DollarSign, CreditCard, RotateCcw, Plus, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusUpdatingOrderId, setStatusUpdatingOrderId] = useState(null);
  const [orderForm, setOrderForm] = useState({
    customer: { name: '', email: '', phone: '', address: '', city: '', state: '', pinCode: '' },
    items: [{ productId: '', quantity: 1, price: 0, variantTitle: '' }],
    paymentMethod: 'Manual',
    paymentId: '',
    status: 'ORDERED',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const productList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/orders/admin/create', orderForm);
      setShowCreateModal(false);
      setOrderForm({
        customer: { name: '', email: '', phone: '', address: '', city: '', state: '', pinCode: '' },
        items: [{ productId: '', quantity: 1, price: 0, variantTitle: '' }],
        paymentMethod: 'Manual',
        paymentId: '',
        status: 'ORDERED',
        notes: ''
      });
      fetchOrders(selectedStatus);
      alert('Order created successfully!');
    } catch (error) {
      alert('Error creating order');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await api.delete(`/orders/${id}`);
      fetchOrders(selectedStatus);
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handleMarkDelivered = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Mark this order as delivered? This will update the saved order status and delivery date.')) return;

    setStatusUpdatingOrderId(id);
    try {
      await api.put(`/orders/${id}`, { status: 'DELIVERED' });
      await fetchOrders(selectedStatus);
      alert('Order marked as delivered');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(error.response?.data?.message || 'Error updating order status');
    } finally {
      setStatusUpdatingOrderId(null);
    }
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Ordered', value: 'ordered' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Canceled', value: 'canceled' },
  ];

  useEffect(() => {
    fetchOrders(selectedStatus);
  }, [selectedStatus]);

  const fetchOrders = async (statusFilter = 'all') => {
    setLoading(true);
    try {
      const query = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/orders${query}`);
      const nextOrders = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setOrders(nextOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ordered':
      case 'paid':
      case 'cod_confirmed':
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery': return 'text-blue-500 bg-blue-500/10';
      case 'delivered': return 'text-emerald-600 bg-emerald-500/10';
      case 'pending':
      case 'cod_pending':
      case 'processing': return 'text-amber-500 bg-amber-500/10';
      case 'cancelled':
      case 'canceled':
      case 'failed': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Orders</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] md:text-[0.7rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10"
        >
          <Plus size={16} /> <span className="hidden xs:inline">Create Order</span><span className="xs:hidden">New</span>
        </button>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-10">

        {/* Stats Grid removed per request (show only order list) */}
        <div className="py-1" />

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-gray-50/50 dark:bg-white/5">
             <div className="flex items-center gap-3">
               {statusFilters.map((filter) => (
                 <button
                   key={filter.value}
                   type="button"
                   onClick={() => setSelectedStatus(filter.value)}
                   className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 border rounded-lg text-[0.7rem] font-bold transition-colors shadow-sm ${selectedStatus === filter.value
                     ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                     : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                 >
                   <Filter size={14} /> {filter.label}
                 </button>
               ))}
             </div>
             <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search orders..." 
                 className="pl-9 pr-4 py-1.5 w-full md:w-64 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
               />
             </div>
          </div>


          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <div className="p-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/30 dark:bg-white/2">
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Order ID</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Customer</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Date</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Total</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Payment</th>
                      <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Status</th>
                       <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {orders.map((order) => {
                      const normalizedStatus = String(order.status || '').toLowerCase();
                      return (
                      <tr 
                        key={order.id} 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-gray-50/80 dark:hover:bg-white/2 transition-colors cursor-pointer text-xs font-bold"
                      >
                        <td className="px-6 py-4 text-gray-900 dark:text-white uppercase tracking-tighter">#{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{order.customer?.name || 'Guest'}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-black">₹{order.total}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                          <div className="font-black">{order.paymentMethod || 'Manual'}</div>
                          <div className="text-[0.6rem] text-gray-400">{order.paymentStatus || 'PENDING'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[0.6rem] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                          {order.returnRequest && order.returnRequest.status === 'PENDING' && (
                            <span className={`ml-2 px-2 py-1 rounded-md text-[0.6rem] font-black uppercase tracking-widest ${order.returnRequest.type === 'EXCHANGE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                              {order.returnRequest.type === 'EXCHANGE' ? 'Exchange Req' : 'Return Req'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {normalizedStatus !== 'delivered' && !['cancelled', 'canceled', 'failed'].includes(normalizedStatus) && (
                            <button
                              onClick={(e) => handleMarkDelivered(e, order.id)}
                              disabled={statusUpdatingOrderId === order.id}
                              className="mr-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors text-[0.6rem] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              {statusUpdatingOrderId === order.id ? 'Updating...' : 'Mark Delivered'}
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteOrder(e, order.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-32 text-center text-gray-400 flex flex-col items-center gap-4">
                <ShoppingCart size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">Currently don't have orders</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-tight">Your order history will appear here once customers start buying.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/10" onClick={() => setShowCreateModal(false)}>
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             onClick={e => e.stopPropagation()}
             className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto space-y-6"
           >
              <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-[#111] pb-4 z-10 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Create Manual Order</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-8">
                {/* Customer Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-white/10 pb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                      <input required type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.name} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, name: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                      <input type="email" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.email} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, email: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Phone *</label>
                      <input required type="tel" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.phone} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, phone: e.target.value}})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Address *</label>
                    <input required type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.address} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, address: e.target.value}})} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">City *</label>
                      <input required type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.city} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, city: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">State *</label>
                      <input required type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.state} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, state: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">PIN Code *</label>
                      <input required type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.customer.pinCode} onChange={e => setOrderForm({...orderForm, customer: {...orderForm.customer, pinCode: e.target.value}})} />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-2">
                     <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Products</h3>
                     <button type="button" onClick={() => setOrderForm({...orderForm, items: [...orderForm.items, { productId: '', quantity: 1, price: 0, variantTitle: '' }]})} className="text-[0.65rem] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100">+ Add Item</button>
                  </div>
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex items-end gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl relative">
                      {orderForm.items.length > 1 && (
                         <button type="button" onClick={() => setOrderForm({...orderForm, items: orderForm.items.filter((_, i) => i !== index)})} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm"><X size={12} /></button>
                      )}
                      <div className="flex-1 space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Product *</label>
                        <select 
                          required
                          className="w-full px-5 py-3 text-xs font-bold bg-white dark:bg-[#222] border-none rounded-xl focus:ring-2 ring-black/5"
                          value={item.productId}
                          onChange={e => {
                            const p = products.find(x => x.id === e.target.value);
                            const newItems = [...orderForm.items];
                            newItems[index] = { ...item, productId: e.target.value, price: p?.price || 0, variantTitle: '' };
                            setOrderForm({ ...orderForm, items: newItems });
                          }}
                        >
                          <option value="">Select product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.totalStock ?? (p.variants?.length > 0 ? p.variants.reduce((s,v)=>s+(v.stock||0),0) : (p.stock||0))})</option>)}
                        </select>
                      </div>
                      {products.find(p => p.id === item.productId)?.variants?.length > 0 && (
                        <div className="w-48 space-y-2">
                           <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Variant</label>
                           <select 
                             className="w-full px-5 py-3 text-xs font-bold bg-white dark:bg-[#222] border-none rounded-xl focus:ring-2 ring-black/5"
                             value={item.variantTitle}
                             onChange={e => {
                               const newItems = [...orderForm.items];
                               const variant = products.find(p => p.id === item.productId)?.variants?.find(v => v.title === e.target.value);
                               newItems[index] = { ...item, variantTitle: e.target.value, price: variant?.price || newItems[index].price };
                               setOrderForm({ ...orderForm, items: newItems });
                             }}
                           >
                             <option value="">Default</option>
                             {products.find(p => p.id === item.productId)?.variants?.map(v => <option key={v.id} value={v.title}>{v.title}</option>)}
                           </select>
                        </div>
                      )}
                      <div className="w-24 space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Qty *</label>
                        <input required type="number" min="1" className="w-full px-5 py-3 text-xs font-bold bg-white dark:bg-[#222] border-none rounded-xl" value={item.quantity} onChange={e => { const newItems = [...orderForm.items]; newItems[index].quantity = parseInt(e.target.value); setOrderForm({ ...orderForm, items: newItems }); }} />
                      </div>
                      <div className="w-32 space-y-2">
                        <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Unit Price (₹) *</label>
                        <input required type="number" className="w-full px-5 py-3 text-xs font-bold bg-white dark:bg-[#222] border-none rounded-xl" value={item.price} onChange={e => { const newItems = [...orderForm.items]; newItems[index].price = parseFloat(e.target.value); setOrderForm({ ...orderForm, items: newItems }); }} />
                      </div>
                    </div>
                  ))}
                  <div className="text-right mt-4">
                     <p className="text-sm font-black dark:text-white uppercase tracking-tighter">Total: ₹{orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                  </div>
                </div>

                {/* Payment & Settings */}
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-white/10 pb-2">Payment</h3>
                     <div className="space-y-2">
                       <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                       <select className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.paymentMethod} onChange={e => setOrderForm({...orderForm, paymentMethod: e.target.value})}>
                          <option value="Manual">Manual / Offline</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Payment/Transaction ID</label>
                       <input type="text" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.paymentId} onChange={e => setOrderForm({...orderForm, paymentId: e.target.value})} />
                     </div>
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-200 dark:border-white/10 pb-2">Settings</h3>
                     <div className="space-y-2">
                       <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Status</label>
                       <select className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.status} onChange={e => setOrderForm({...orderForm, status: e.target.value})}>
                          <option value="ORDERED">ORDERED (Pending)</option>
                          <option value="PAID">PAID</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Notes</label>
                       <textarea rows="2" className="w-full px-5 py-3 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-2xl" value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} />
                     </div>
                   </div>
                </div>

                <div className="pt-4 sticky bottom-0 bg-white dark:bg-[#111] py-4 border-t border-gray-100 dark:border-white/10 mt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${
                      isSubmitting 
                        ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed opacity-70' 
                        : 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] shadow-black/10'
                    }`}
                  >
                    {isSubmitting ? 'Creating Order...' : 'Create Order & Update Inventory'}
                  </button>
                </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Orders;
