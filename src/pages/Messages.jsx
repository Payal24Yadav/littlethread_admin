import React, { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle2, Circle, Clock, User, MessageSquare } from 'lucide-react';
import api from '../utils/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/contact/${id}`);
      setMessages(messages.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const toggleRead = async (id) => {
    try {
      const res = await api.patch(`/contact/${id}/read`);
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: res.data.isRead } : m));
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Customer Messages</h1>
      </header>

      <main className="p-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="space-y-4">
             {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-[#111] rounded-xl animate-pulse"></div>
             ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-32 text-center text-gray-400 flex flex-col items-center gap-4">
            <Mail size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
            <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">Your inbox is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`group relative border border-gray-200 dark:border-white/5 rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 ${
                  message.isRead 
                    ? 'bg-gray-100 dark:bg-[#0d0d0d]' 
                    : 'bg-white dark:bg-[#111]'
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      message.isRead 
                        ? 'bg-gray-200 dark:bg-white/5 text-gray-400' 
                        : 'bg-gray-50 dark:bg-white/5 text-gray-400'
                    }`}>
                      <User size={20} />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className={`text-sm font-black uppercase tracking-tight ${message.isRead ? 'text-gray-400 dark:text-gray-500' : 'dark:text-white'}`}>{message.name}</h3>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[0.65rem] font-bold text-gray-400 capitalize">{message.subject || 'General Inquiry'}</span>
                        </div>
                        <p className="text-[0.65rem] font-bold text-gray-400 mt-0.5">{message.email}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <p className="text-[0.8rem] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{message.message}</p>
                      </div>
                      <div className="flex items-center gap-4 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                           <Clock size={12} /> {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <MessageSquare size={12} /> ID: {message.id.slice(0, 8)}
                        </div>
                        {message.isRead && (
                          <span className="text-emerald-500 font-black">• READ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     <button 
                       onClick={() => toggleRead(message.id)}
                       className={`p-2.5 rounded-xl transition-colors ${
                         message.isRead 
                           ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' 
                           : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-300 hover:text-emerald-500'
                       }`} 
                       title={message.isRead ? 'Mark as Unread' : 'Mark as Read'}
                     >
                        <CheckCircle2 size={18} />
                     </button>
                     <button 
                       onClick={() => deleteMessage(message.id)}
                       className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" 
                       title="Delete Message"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
