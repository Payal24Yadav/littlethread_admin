import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ShoppingCart, 
  Tag, 
  Layers, 
  Users, 
  Star,
  Mail,
  Settings, 
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  MoreVertical,
  TrendingUp,
  TicketPercent,
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { logoutAdmin } from '../services/adminAuth';
import api from '../utils/api';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const email = localStorage.getItem('adminEmail') || 'admin@ansupal.com';
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(localStorage.getItem('2fa_enabled') === 'true');

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const toggle2FA = async () => {
    const nextState = !is2FAEnabled;
    try {
      await api.post('/auth/toggle-2fa', { email, enabled: nextState });
      setIs2FAEnabled(nextState);
      localStorage.setItem('2fa_enabled', nextState);
    } catch (error) {
      alert('Error updating 2FA status');
    }
  };

  return (
    <aside className={`fixed top-0 bottom-0 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/5 flex flex-col transition-all duration-300 z-50 ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-60'}`}>
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 h-16 ${isCollapsed ? 'md:justify-center' : ''}`}>

        {!isCollapsed && (
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-7 h-7 bg-black dark:bg-white dark:text-black text-white flex items-center justify-center rounded-lg text-[0.7rem] font-black shadow-lg shadow-black/10">LT</div>
            <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white uppercase italic">Little Threads</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md text-gray-400 transition-colors">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-6 px-2 space-y-1">
        {!isCollapsed && <div className="px-3 pt-2 pb-2 text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">General</div>}
        
        <NavLink to="/orders" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <ShoppingCart size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Orders</span>}
        </NavLink>

        <NavLink to="/sales" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <TrendingUp size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Sales</span>}
        </NavLink>
        
        <NavLink to="/products" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Tag size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Products</span>}
        </NavLink>

        <NavLink to="/categories" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Layers size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Categories</span>}
        </NavLink>
        
        <NavLink to="/collections" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Layers size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Collections</span>}
        </NavLink>

        <NavLink to="/customers" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Users size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Customers</span>}
        </NavLink>

        <NavLink to="/messages" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Mail size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Messages</span>}
        </NavLink>

        <NavLink to="/coupons" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <TicketPercent size={18} />
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Coupons</span>}
        </NavLink>


        <NavLink to="/reviews" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Star size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Reviews</span>}
        </NavLink>

        {!isCollapsed && <div className="px-3 pt-6 pb-2 text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">System</div>}
        
        <NavLink to="/settings" className={({isActive}) => `flex items-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl shadow-black/10 active:scale-95' : ''} ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Settings size={18} /> 
          {!isCollapsed && <span className="text-[0.8rem] font-bold">Settings</span>}
        </NavLink>
      </div>
      
      <div className={`p-4 border-t border-gray-200 dark:border-white/5 relative bg-white dark:bg-[#111111]`}>
        {showProfileMenu && !isCollapsed && (
          <div 
            ref={profileMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-300"
          >
            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-2">
               <p className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Appearance</p>
               <div className="flex items-center gap-2 mt-2 bg-gray-50 dark:bg-white/5 p-1 rounded-lg">
                  <button onClick={() => toggleTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[0.65rem] font-black transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>
                    <Sun size={12} /> LIGHT
                  </button>
                  <button onClick={() => toggleTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[0.65rem] font-black transition-all ${theme === 'dark' ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm' : 'text-gray-400'}`}>
                    <Moon size={12} /> DARK
                  </button>
               </div>
            </div>

            {/* <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-2">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span className="text-[0.7rem] font-black dark:text-white uppercase tracking-tight">Two-Factor Auth</span>
                 </div>
                 <button 
                  onClick={toggle2FA}
                  className={`w-8 h-4 rounded-full transition-all relative ${is2FAEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'}`}
                 >
                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${is2FAEnabled ? 'left-4.5' : 'left-0.5'}`} />
                 </button>
               </div>
               <p className="text-[0.55rem] text-gray-400 mt-1">Receive OTP on every login</p>
            </div> */}

            <button onClick={async () => {
                try {
                  await logoutAdmin();
                } catch (err) {
                  console.error('Error signing out', err);
                } finally {
                  navigate('/login');
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 rounded-xl transition-all font-bold text-[0.75rem]">
              <LogOut size={16} /> SIGN OUT
            </button>
          </div>
        )}

        <div 
          ref={triggerRef}
          onClick={() => !isCollapsed && setShowProfileMenu(!showProfileMenu)}
          className={`flex items-center transition-all ${isCollapsed ? 'justify-center' : 'gap-3 p-2 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-white/5 cursor-pointer group'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[0.7rem] font-black shadow-sm group-hover:scale-105 transition-transform">
            {email.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-[0.75rem] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight leading-none">{email.split('@')[0]}</p>
              <p className="text-[0.6rem] text-gray-400 dark:text-gray-500 font-bold truncate mt-0.5">{email}</p>
            </div>
          )}
          {!isCollapsed && <MoreVertical size={14} className="text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
