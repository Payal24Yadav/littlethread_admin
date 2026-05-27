import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronLeft, Image as ImageIcon, CheckCircle2, Save, X, Trash2 } from 'lucide-react';

const ColorVariants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateVariantImage = async (variantId, field, url) => {
    const updatedVariants = product.variants.map(v => 
      v.id === variantId ? { ...v, [field]: url } : v
    );
    setProduct({ ...product, variants: updatedVariants });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // We only need to send the variants to the PATCH endpoint
      // Ensure we format them correctly as expected by the backend
      const formattedVariants = product.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price === null ? null : parseFloat(v.price),
        stock: parseInt(v.stock),
        images: v.images || [],
        thumbnailUrl: v.thumbnailUrl,
        hoverThumbnailUrl: v.hoverThumbnailUrl
      }));

      await api.patch(`/products/${id}`, { variants: formattedVariants });
      alert("Variants updated successfully");
      navigate(`/products/${id}`);
    } catch (err) {
      alert("Error saving variations");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20 italic-none">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/products/${id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">Color Variants Management</h1>
            <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{product.name}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[0.7rem] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'} <Save size={16} />
        </button>
      </header>

      <main className="p-10 space-y-10">
        {product.variants?.map((variant) => (
          <div key={variant.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="px-8 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{variant.title}</h3>
              <span className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{variant.stock} in stock</span>
            </div>
            
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Thumbnail Selection */}
              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Select Thumbnail</label>
                <div className="grid grid-cols-4 gap-3">
                  {product.images?.map((img, i) => (
                    <button 
                      key={i}
                      onClick={() => updateVariantImage(variant.id, 'thumbnailUrl', img)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden group border-2 transition-all ${variant.thumbnailUrl === img ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-transparent hover:border-gray-200'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      {variant.thumbnailUrl === img && (
                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hover Selection */}
              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Select Hover Image</label>
                <div className="grid grid-cols-4 gap-3">
                  {product.images?.map((img, i) => (
                    <button 
                      key={i}
                      onClick={() => updateVariantImage(variant.id, 'hoverThumbnailUrl', img)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden group border-2 transition-all ${variant.hoverThumbnailUrl === img ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-transparent hover:border-gray-200'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      {variant.hoverThumbnailUrl === img && (
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-blue-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!product.variants || product.variants.length === 0) && (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-20 text-center flex flex-col items-center gap-4">
             <ImageIcon size={48} strokeWidth={1} className="text-gray-200" />
             <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">No variants found for this product</p>
             <button onClick={() => navigate(`/products/${id}`)} className="text-xs font-black underline underline-offset-4">Create Variants First</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ColorVariants;
