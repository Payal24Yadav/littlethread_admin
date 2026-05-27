import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Star, Trash2, MessageSquare, User, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewImages, setSelectedReviewImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      alert('Error deleting review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-[0.8rem]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Product Reviews</h1>
      </header>

      <main className="p-10 max-w-[95%] mx-auto space-y-6">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
            <span className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Latest Feedback</span>
          </div>

          <div className="divide-y divide-gray-100 italic-none">
            {loading ? (
              <div className="p-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors group flex gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                          ))}
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{review.product?.name}</span>
                      </div>
                      <span className="text-[0.65rem] text-gray-400 font-medium flex items-center gap-1">
                        <Calendar size={12} /> {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">"{review.comment}"</p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {review.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setSelectedReviewImages(review.images);
                              setSelectedImageIndex(idx);
                            }}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-black/5"
                          >
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[0.7rem] pt-2">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">
                        <User size={12} className="text-gray-400" /> {review.userName}
                      </div>
                      <div className="text-gray-300 dark:text-white/10">•</div>
                      <div className="text-gray-400 dark:text-gray-500 font-medium lowercase italic">
                        {review.userEmail && review.userEmail !== 'anonymous@example.com' 
                          ? review.userEmail 
                          : review.userPhone || ''}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all self-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-32 text-center text-gray-400 flex flex-col items-center gap-4">
                <MessageSquare size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">Currently don't have reviews</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-tight">Feedback from your customers will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {selectedReviewImages && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-20 select-none"
          onClick={() => setSelectedReviewImages(null)}
        >
          <button 
            onClick={() => setSelectedReviewImages(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110]"
          >
            <X size={32} />
          </button>

          {selectedReviewImages.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + selectedReviewImages.length) % selectedReviewImages.length);
                }}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[110]"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % selectedReviewImages.length);
                }}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[110]"
              >
                <ChevronRight size={32} />
              </button>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black tracking-widest">
                {selectedImageIndex + 1} / {selectedReviewImages.length}
              </div>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={selectedReviewImages[selectedImageIndex]} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" 
              alt="" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
