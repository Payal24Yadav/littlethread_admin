import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronLeft, Mail, Phone, MapPin, Package, ShoppingBag, Calendar, AlertCircle, Edit2 } from 'lucide-react';

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-500';
    case 'ORDERED':
    case 'PROCESSING': return 'bg-amber-500/10 text-amber-500';
    case 'SHIPPED':
    case 'AWB_ASSIGNED': return 'bg-blue-500/10 text-blue-500';
    case 'CANCELLED':
    case 'CANCELED':
    case 'FAILED': return 'bg-red-500/10 text-red-500';
    default: return 'bg-gray-500/10 text-gray-500';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/auth/customers/${id}`);
        setCustomer(res.data);
        setEditForm({ name: res.data.name || '', email: res.data.email || '' });
      } catch (err) {
        console.error('Error fetching customer:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/auth/customers/${id}`, editForm);
      setCustomer({ ...customer, ...editForm });
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#0a0a0a]">
        <AlertCircle size={40} className="text-gray-300" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Customer not found</p>
        <button onClick={() => navigate('/customers')} className="text-xs font-black uppercase underline">Back to Customers</button>
      </div>
    );
  }

  // Derive phone from profile OR from most recent order's shipping address
  const phone = customer.mobile
    || customer.orders?.find(o => o.shippingAddress?.phone)?.shippingAddress?.phone
    || null;

  const totalSpent = customer.orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Customer Profile</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[0.6rem] font-black uppercase tracking-widest rounded-xl">
            {customer.orders?.length || 0} Orders
          </span>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left: Profile + Stats */}
        <div className="space-y-8">
          {/* Profile card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm space-y-6 relative group">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={14} className="text-gray-400" />
              </button>
            )}

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-xl"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    className="w-full px-4 py-2 text-xs font-bold bg-gray-50 dark:bg-white/5 border-none rounded-xl"
                    value={editForm.email}
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={updating}
                    className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({ name: customer.name || '', email: customer.email || '' });
                    }}
                    className="flex-1 py-2 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl text-[0.6rem] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-black flex-shrink-0">
                  {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-base font-black dark:text-white uppercase tracking-tight">{customer.name || 'Unknown'}</h2>
                  <p className="text-[0.65rem] text-gray-400 font-bold mt-1">Member since {formatDate(customer.createdAt)}</p>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="space-y-4 pt-2 border-t dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl"><Mail size={14} className="text-gray-400" /></div>
                  <div>
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Email</p>
                    <p className="text-xs font-bold dark:text-white break-all">{customer.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl"><Phone size={14} className="text-gray-400" /></div>
                  <div>
                    <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest">Phone</p>
                    <p className="text-xs font-bold dark:text-white">{phone || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-2xl font-black dark:text-white">{customer.orders?.length || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-xl font-black dark:text-white">₹{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Right: Order History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Order History</h3>
              <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 text-[0.6rem] font-black rounded-xl uppercase tracking-widest">
                {customer.orders?.length || 0} orders
              </span>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {customer.orders.map(order => {
                  const addr = order.shippingAddress || {};
                  const orderPhone = addr.phone || phone;
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                            {order.invoiceNumber || `#${order.id.slice(-6).toUpperCase()}`}
                          </p>
                          <p className="text-sm font-black dark:text-white mt-0.5">₹{order.totalAmount?.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Calendar size={11} className="text-gray-400" />
                            <p className="text-[0.6rem] font-bold text-gray-400">{formatDate(order.createdAt)}</p>
                          </div>
                          {orderPhone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone size={11} className="text-gray-400" />
                              <p className="text-[0.6rem] font-bold text-gray-400">{orderPhone}</p>
                            </div>
                          )}
                          {addr.address && (
                            <div className="flex items-start gap-2 mt-1">
                              <MapPin size={11} className="text-gray-400 mt-0.5" />
                              <p className="text-[0.6rem] font-bold text-gray-400 leading-relaxed">
                                {addr.address}, {addr.city} {addr.pinCode}
                              </p>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-[0.6rem] font-black uppercase tracking-widest flex-shrink-0 ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Order items */}
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 h-10 bg-gray-50 dark:bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                                {item.product?.thumbnailUrl && (
                                  <img src={item.product.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold dark:text-white truncate">{item.product?.name}</p>
                                {item.variantTitle && (
                                  <p className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-wide">{item.variantTitle}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black dark:text-white">₹{item.price}</p>
                                <p className="text-[0.6rem] text-gray-400 font-bold">× {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 text-center">
                <ShoppingBag size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" strokeWidth={1} />
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;
