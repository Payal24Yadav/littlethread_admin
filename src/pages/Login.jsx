import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, verifyAdminOtp, resetAdminPassword } from '../services/adminAuth';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth') === 'true';
    const token = localStorage.getItem('adminToken');
    if (adminAuth && token) {
      navigate('/', { replace: true });
    } else {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await loginAdmin(email, password);
      if (data.requires2FA) {
        setRequires2FA(true);
        setOtp('');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ID or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyAdminOtp(email, otp);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage('');
    setError('');
    
    try {
      await resetAdminPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#fdf7f0] dark:bg-[#0a0a0a] antialiased font-sans relative overflow-hidden">
      {/* Brand Mandalas */}
      <img src="/images/mandala_motif.png" className="absolute -left-20 -top-20 w-80 h-80 opacity-[0.05] pointer-events-none" alt="" />
      <img src="/images/mandala_motif.png" className="absolute -right-20 -bottom-20 w-80 h-80 opacity-[0.05] pointer-events-none" alt="" />
      <div className="bg-white dark:bg-[#111] p-10 w-full max-w-sm border border-gray-200 dark:border-white/5 shadow-2xl rounded-2xl animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center rounded-2xl mx-auto mb-4 font-black text-2xl shadow-xl shadow-black/10">A</div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase italic">Admin Panel</h1>
          <p className="text-gray-400 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-black leading-none">Commerce Control Center</p>
        </div>
        
        {!showForgotPassword ? (
          !requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none">Admin Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@example.com"
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none">Password</label>
                <div className="relative group/pass">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                  <p className="text-red-600 dark:text-red-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{error}</p>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-gray-100 transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center h-12"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black"></div> : 'Launch Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4">
               <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none text-center">Enter 6-digit OTP</label>
                <p className="text-[0.6rem] text-center text-gray-400 dark:text-gray-600 mb-2 font-bold uppercase">Sent to {email}</p>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="000000"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                  maxLength={6}
                  required 
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center h-12"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : 'Verify & Continue'}
              </button>

              <button 
                type="button"
                onClick={() => setRequires2FA(false)}
                className="w-full text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back to Login
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-left-4">
            <div className="space-y-1.5">
              <label className="block text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 leading-none">Admin Email</label>
              <input 
                type="email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                placeholder="admin@example.com"
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
                required 
              />
              <p className="text-[0.6rem] text-gray-500 dark:text-gray-400 mt-2">We'll send a password reset link to this email.</p>
            </div>
            
            {resetMessage && (
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                <p className="text-green-600 dark:text-green-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{resetMessage}</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                <p className="text-red-600 dark:text-red-400 text-[0.7rem] font-bold text-center uppercase tracking-tight leading-none">{error}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center h-12"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : 'Send Reset Link'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
                setError('');
              }}
              className="w-full text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
        
        {/* {!showForgotPassword && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              className="w-full text-center text-[0.65rem] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </button>
            <p className="text-center text-[0.55rem] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest leading-none mt-3">
              Secure Session Management
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Login;
