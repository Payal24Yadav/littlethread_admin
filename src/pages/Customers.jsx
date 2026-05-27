import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Package, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setError('');
      const res = await api.get('/auth/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer.id);
    setEditForm({ name: customer.name || '', email: customer.email || '' });
  };

  const handleSaveEdit = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/auth/customers/${id}`, editForm);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert('Failed to update customer');
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingCustomer(null);
  };

  const openCustomerDetail = (customer) => {
    if (editingCustomer === customer.id) return;
    navigate(`/customers/${customer.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Customers</h1>
      </header>
      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-t-2 border-black dark:border-white rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-[#111] border border-red-200 dark:border-red-500/20 rounded-xl p-10 text-center">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl p-32 text-center text-gray-400 flex flex-col items-center gap-4">
            <Package size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
            <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">No customers yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Email</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Join Date</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400 text-right">Orders</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} onClick={() => openCustomerDetail(customer)} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[0.7rem] font-black">
                          {customer.name?.charAt(0) || 'U'}
                        </div>
                        {editingCustomer === customer.id ? (
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={e => setEditForm({...editForm, name: e.target.value})}
                             onClick={e => e.stopPropagation()}
                             className="text-sm font-bold dark:text-white bg-white dark:bg-[#222] border border-gray-300 dark:border-white/10 rounded px-2 py-1"
                           />
                        ) : (
                           <span className="text-sm font-bold dark:text-white">{customer.name || 'N/A'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {editingCustomer === customer.id ? (
                           <input 
                             type="email" 
                             value={editForm.email} 
                             onChange={e => setEditForm({...editForm, email: e.target.value})}
                             onClick={e => e.stopPropagation()}
                             className="text-sm dark:text-white bg-white dark:bg-[#222] border border-gray-300 dark:border-white/10 rounded px-2 py-1 w-full"
                           />
                        ) : (
                           <span>{customer.email || 'N/A'}</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold dark:text-white text-right">
                      {customer.orders?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {editingCustomer === customer.id ? (
                          <div className="flex justify-end gap-2">
                             <button onClick={(e) => handleSaveEdit(customer.id, e)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check size={14}/></button>
                             <button onClick={handleCancelEdit} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X size={14}/></button>
                          </div>
                       ) : (
                          <button onClick={(e) => handleEditClick(customer, e)} className="p-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20">
                             <Edit2 size={14}/>
                          </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

    </div>
  );
};

export default Customers;
