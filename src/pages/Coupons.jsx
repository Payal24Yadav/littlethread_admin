import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, TicketPercent, Trash2 } from 'lucide-react';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    code: '',
    percentage: '',
    type: 'PERCENTAGE',
    maxUses: '',
    allowedEmails: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!form.code.trim()) {
      nextErrors.code = 'Coupon code is required.';
    }

    const percentage = parseFloat(form.percentage);
    if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
      nextErrors.percentage = 'Enter a discount percentage between 1 and 100.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await api.post('/coupons', {
        code: form.code,
        percentage,
        type: form.type,
        maxUses: form.maxUses,
        allowedEmails: form.allowedEmails,
        isActive: form.isActive
      });
      setCoupons((prev) => [res.data, ...prev]);
      setForm({ code: '', percentage: '', type: 'PERCENTAGE', maxUses: '', allowedEmails: '', isActive: true });
      setErrors({});
    } catch (error) {
      setErrors({
        submit: error.response?.data?.error || 'Error creating coupon.'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      const res = await api.put(`/coupons/${coupon.id}`, {
        isActive: !coupon.isActive
      });
      setCoupons((prev) => prev.map((item) => (item.id === coupon.id ? res.data : item)));
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating coupon.');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${couponId}`);
      setCoupons((prev) => prev.filter((item) => item.id !== couponId));
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting coupon.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Coupons</h1>
      </header>

      <main className="p-10 max-w-[95%] mx-auto space-y-8">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Create Coupon</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. SAVE10)"
                  value={form.code}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                    if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
                  }}
                  className={`w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 transition-all text-gray-900 dark:text-white ${errors.code ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 dark:border-white/5 focus:ring-black/5 dark:focus:ring-white/5'}`}
                />
                {errors.code && <p className="ml-1 text-[0.7rem] font-bold text-red-500">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Discount Value"
                  value={form.percentage}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, percentage: e.target.value }));
                    if (errors.percentage) setErrors((prev) => ({ ...prev, percentage: '' }));
                  }}
                  className={`w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 transition-all text-gray-900 dark:text-white ${errors.percentage ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 dark:border-white/5 focus:ring-black/5 dark:focus:ring-white/5'}`}
                />
                {errors.percentage && <p className="ml-1 text-[0.7rem] font-bold text-red-500">{errors.percentage}</p>}
              </div>

              <div className="space-y-2">
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-gray-900 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Max Total Uses (e.g. 10)"
                  value={form.maxUses}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-gray-900 dark:text-white"
                />
                <p className="ml-1 text-[0.6rem] text-gray-400 uppercase tracking-widest font-bold">Leave empty for unlimited</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <input
                  type="text"
                  placeholder="Allowed Emails (comma separated for targeted users)"
                  value={form.allowedEmails}
                  onChange={(e) => setForm((prev) => ({ ...prev, allowedEmails: e.target.value }))}
                  className="w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-gray-900 dark:text-white"
                />
                <p className="ml-1 text-[0.6rem] text-gray-400 uppercase tracking-widest font-bold">Leave empty so anyone can use it</p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Active Coupon</span>
            </label>

            {errors.submit && <p className="ml-1 text-[0.7rem] font-bold text-red-500">{errors.submit}</p>}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
            >
              <Plus size={16} strokeWidth={3} />
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center gap-2">
            <TicketPercent size={16} className="text-gray-400" />
            <span className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Available Coupons</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/10">
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Value</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Uses</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Targeted</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 w-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                    </td>
                  </tr>
                ) : coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white uppercase">{coupon.code}</td>
                      <td className="px-6 py-4 text-xs font-black text-gray-700 dark:text-gray-300">{coupon.type === 'FLAT' ? '₹' : ''}{coupon.percentage}{coupon.type === 'PERCENTAGE' ? '%' : ''}</td>
                      <td className="px-6 py-4 text-[0.6rem] font-black text-gray-500 uppercase tracking-widest">{coupon.type}</td>
                      <td className="px-6 py-4 text-[0.65rem] font-bold text-gray-500">
                         {coupon.usedCount} / {coupon.maxUses || '∞'}
                      </td>
                      <td className="px-6 py-4">
                         {coupon.allowedEmails && coupon.allowedEmails.length > 0 ? (
                           <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[0.6rem] font-black uppercase rounded-lg">Yes ({coupon.allowedEmails.length})</span>
                         ) : (
                           <span className="text-[0.6rem] font-bold text-gray-400 uppercase">No</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(coupon)}
                          className={`px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteCoupon(coupon.id)}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">
                      No coupons created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Coupons;
