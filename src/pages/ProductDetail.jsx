import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Package, 
  Tag, 
  Layers, 
  Image as ImageIcon,
  Star,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  Clock,
  X,
  Plus,
  CheckCircle2,
  Upload,
  Settings,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import ProductForm from '../forms/ProductForm';
import BulkVariantModal from '../components/BulkVariantModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoEditModal, setShowInfoEditModal] = useState(false);
  const [showMediaManageModal, setShowMediaManageModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showBulkVariantModal, setShowBulkVariantModal] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantImages, setVariantImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [editVariantAttributes, setEditVariantAttributes] = useState([]); // [{ name, value }]
  const [activeDropdown, setActiveDropdown] = useState(null); // 'categories' or 'collections'
  const [showVariantImagePicker, setShowVariantImagePicker] = useState(false);
  const [useDefaultVariantPrice, setUseDefaultVariantPrice] = useState(true);
  const [selectedReviewImages, setSelectedReviewImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const categoryRef = React.useRef(null);
  const collectionRef = React.useRef(null);
  const variantImagePickerRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        if (activeDropdown === 'categories') setActiveDropdown(null);
      }
      if (collectionRef.current && !collectionRef.current.contains(event.target)) {
        if (activeDropdown === 'collections') setActiveDropdown(null);
      }
      if (variantImagePickerRef.current && !variantImagePickerRef.current.contains(event.target)) {
        setShowVariantImagePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, colRes] = await Promise.all([
        api.get('/categories'),
        api.get('/collections')
      ]);
      const categoryData = Array.isArray(catRes.data?.data) ? catRes.data.data : catRes.data;
      const collectionData = Array.isArray(colRes.data?.data) ? colRes.data.data : colRes.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setCollections(Array.isArray(collectionData) ? collectionData : []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleSetImageRole = async (url, role) => {
    try {
      const payload = {};
      if (role === 'thumbnail') {
        payload.thumbnailUrl = product.thumbnailUrl === url ? '' : url;
      } else if (role === 'hover') {
        payload.hoverThumbnailUrl = product.hoverThumbnailUrl === url ? '' : url;
      }
      await api.patch(`/products/${id}`, payload);
      fetchProduct();
    } catch (err) {
      console.error(`Error setting ${role} image:`, err);
      alert(`Error setting ${role} image`);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 font-bold uppercase tracking-widest">Product not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 italic-none">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[0.6rem] font-black uppercase rounded ring-1 ring-emerald-100 dark:ring-emerald-500/20">Published</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[0.7rem] font-bold uppercase tracking-widest shadow-lg shadow-black/10 dark:shadow-none active:scale-95 transition-all"
          >
            Edit Product
          </button>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Info Card */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Information</h3>
              <button 
                onClick={() => setShowInfoEditModal(true)}
                className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="px-8 py-6 space-y-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                <div className="space-y-2">
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Description</label>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{product.description || '-'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Subtitle</label>
                  <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{product.subtitle || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Handle</label>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">/{product.handle || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Discountable</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.isDiscountable ? 'True' : 'False'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">₹{product.price || '0'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Compare At Price</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">₹{product.compareAtPrice || '0'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cost Price</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">₹{product.costPrice || '0'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Discount Info</label>
                  <p className="mt-1 text-sm font-bold text-emerald-600">₹{product.discountAmount || '0'} ({product.discountPercentage || '0'}% OFF)</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Net Profit</label>
                  <p className="mt-1 text-sm font-bold text-blue-600">₹{product.profit || '0'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Product Type</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.productType || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Gender</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.gender || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Age Group</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.ageGroup || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Season</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.season || '-'}</p>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Brand Name</label>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{product.brand?.name || product.brandName || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(product.tags) && product.tags.length > 0 ? (
                      product.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-md text-[0.6rem] font-bold uppercase tracking-widest">{tag}</span>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Media Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Media</h3>
              <button 
                onClick={() => setShowMediaManageModal(true)}
                className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
              >
                Manage
              </button>
            </div>
            <div className="p-8">
              <div className="flex flex-wrap gap-4">
                {product.images?.map((img, i) => (
                  <div key={i} className="relative group h-48 w-36 bg-gray-50 rounded-xl overflow-hidden ring-1 ring-black/5">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
                {(!product.images || product.images.length === 0) && (
                  <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
                    <ImageIcon size={40} strokeWidth={1} />
                    <p className="text-[0.65rem] font-black uppercase tracking-widest mt-2">No media found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Variants Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Variants</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setBulkEditMode(true);
                    setShowBulkVariantModal(true);
                  }} 
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[0.6rem] font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-bold"
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    setBulkEditMode(false);
                    setShowBulkVariantModal(true);
                  }} 
                  className="px-4 py-2 bg-black text-white border border-black rounded-lg text-[0.6rem] font-black uppercase tracking-widest hover:bg-gray-800 transition-all font-bold"
                >
                   Create
                </button>
                {/* <button 
                  onClick={() => {
                    setSelectedVariant(null);
                    setVariantImages([]);
                    setShowVariantModal(true);
                  }} 
                  className=z"px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[0.6rem] font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-bold"
                >
                  Create
                </button> */}
              </div>
            </div>
            <div className="overflow-x-auto text-[0.7rem]">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Option</th>
                    <th className="px-8 py-4">Value</th>
                    <th className="px-8 py-4">Price</th>
                    <th className="px-8 py-4">Inventory</th>
                    <th className="px-8 py-4 w-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {product.variants?.map((variant) => {
                    const titleParts = variant.title.split(', ');
                    const optNames = [];
                    const optVals = [];
                    
                    titleParts.forEach(part => {
                      if (part.includes(': ')) {
                        const [k, v] = part.split(': ');
                        optNames.push(k);
                        optVals.push(v);
                      } else {
                        optVals.push(part);
                      }
                    });

                    const displayOptName = optNames.length > 0 ? optNames.join(' / ') : 'Option';
                    const displayOptVal = optVals.join(' / ');
                    
                    return (
                      <tr key={variant.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-8 py-4">
                          <span className="font-bold text-gray-900 uppercase tracking-tight">{displayOptName}</span>
                        </td>
                        <td className="px-8 py-4 flex items-center gap-3">
                          <div className="w-8 h-10 bg-gray-50 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                            {variant.images?.[0] ? <img src={variant.images[0]} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="mx-auto mt-3 text-gray-200" />}
                          </div>
                          <span className="font-bold text-gray-900 uppercase tracking-tight">{displayOptVal}</span>
                        </td>
                        <td className="px-8 py-4 text-gray-600 font-bold">
                          {variant.price ? `₹${variant.price}` : <span className="text-gray-400">Same as product</span>}
                        </td>
                        <td className="px-8 py-4">
                          <span className="font-bold text-gray-500 uppercase">{variant.stock} available</span>
                        </td>
                        <td className="px-8 py-4">
                          <button 
                            onClick={() => {
                              setSelectedVariant(variant);
                              setVariantImages(variant.images || []);
                              setUseDefaultVariantPrice(variant.price === null);
                              // Initialize editable attributes
                              const parts = variant.title.split(', ');
                              const initialAttrs = parts.map(p => {
                                const [n, v] = p.includes(': ') ? p.split(': ') : ['Option', p];
                                return { name: n, value: v };
                              });
                              setEditVariantAttributes(initialAttrs);
                              setShowVariantModal(true);
                            }}
                            className="p-1.5 text-gray-300 hover:text-gray-900 transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!product.variants || product.variants.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-8 py-10 text-center text-gray-400 uppercase font-black text-[0.6rem] tracking-widest">No variants configured</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>

        {/* Right Column - Organization & Metadata */}
        <div className="space-y-8">
          
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Organize</h3>
                <button 
                  onClick={() => setShowOrganizeModal(true)}
                  className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest block mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {product.categories?.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600">
                        <Tag size={14} /> {cat.name}
                      </div>
                    )) || <span className="text-gray-400 text-xs">-</span>}
                  </div>
                </div>
                <div>
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest block mb-2">Collections</label>
                  <div className="flex flex-wrap gap-2">
                    {product.collections?.map(col => (
                      <div key={col.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600">
                        <Layers size={14} /> {col.name}
                      </div>
                    )) || <span className="text-gray-400 text-xs">-</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5 p-8 space-y-6">
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Status</h3>
             <div className="flex items-center justify-between text-[0.7rem] pt-2">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-tight">
                  <Clock size={16} /> Created
                </div>
                <div className="text-gray-900 font-black">{new Date(product.createdAt).toLocaleDateString()}</div>
             </div>
             <div className="flex items-center justify-between text-[0.7rem]">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-tight">
                  <Package size={16} /> Inventory
                </div>
                <div className="text-gray-900 font-black">
                  {(() => {
                    const hasVariants = product.variants && product.variants.length > 0;
                     return hasVariants
                       ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                       : (product.stock || 0);
                  })()} Units
                </div>
             </div>
             <div className="pt-4 border-t border-gray-50">
               <button 
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
                    try {
                      await api.delete(`/products/${id}`);
                      navigate('/products');
                    } catch (err) {
                      alert("Error deleting product");
                    }
                  }
                }}
                className="w-full py-3 text-red-100 bg-red-500 rounded-xl text-[0.7rem] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
               >
                 <Trash2 size={16} /> Delete Product
               </button>
             </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Customer Reviews</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {product.reviews?.map((review) => (
                <div key={review.id} className="p-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{review.userName}</span>
                    </div>
                    <span className="text-[0.6rem] text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {review.images.map((img, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setSelectedReviewImages(review.images);
                            setSelectedImageIndex(idx);
                          }}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-black/5"
                        >
                          <img src={img} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(!product.reviews || product.reviews.length === 0) && (
                <p className="p-12 text-center text-gray-400 uppercase font-black text-[0.6rem] tracking-widest">No reviews for this product yet</p>
              )}
            </div>
          </div>

        </div>

      </main>

      {showBulkVariantModal && (
        <BulkVariantModal 
          product={product} 
          mode={bulkEditMode ? 'edit' : 'create'}
          onClose={() => setShowBulkVariantModal(false)}
          onGenerate={async (newVariants) => {
            try {
              // If bulk edit, we replace matching categories of variants or just replace all?
              // User usually expects bulk edit to "reset" the variant set to what's in the modal.
              const payload = bulkEditMode ? newVariants : [...(product.variants || []), ...newVariants];
              
              await api.patch(`/products/${id}`, { 
                variants: payload 
              });
              fetchProduct();
              setShowBulkVariantModal(false);
            } catch (error) {
              console.error("Error saving bulk variants:", error);
              alert("Error saving variants");
            }
          }}
        />
      )}

      {showEditModal && (
        <ProductForm 
          product={product} 
          onClose={() => setShowEditModal(false)} 
          onSave={() => {
            fetchProduct();
            setShowEditModal(false);
          }} 
        />
      )}

      {/* Info Edit Modal */}
      {showInfoEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Edit Information</h2>
              <button onClick={() => setShowInfoEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.target);
                const payload = Object.fromEntries(data.entries());
                payload.isDiscountable = payload.isDiscountable === 'on';
                payload.active = payload.active === 'on';
                if (payload.tags) {
                  payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
                }
                try {
                  await api.patch(`/products/${id}`, payload);
                  fetchProduct();
                  setShowInfoEditModal(false);
                } catch (err) {
                  alert("Error updating information");
                }
              }}
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Subtitle</label>
                  <input name="subtitle" defaultValue={product.subtitle} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Handle</label>
                  <input name="handle" defaultValue={product.handle} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                  <input name="price" type="number" min="0" step="0.01" defaultValue={product.price} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Compare At Price (₹)</label>
                  <input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={product.compareAtPrice} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Cost Price (₹)</label>
                  <input name="costPrice" type="number" min="0" step="0.01" defaultValue={product.costPrice} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Discount Amount (₹)</label>
                  <input name="discountPrice" type="number" min="0" step="0.01" defaultValue={product.discountPrice} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Product Type</label>
                  <input name="productType" defaultValue={product.productType} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                  <select name="gender" defaultValue={product.gender} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all appearance-none">
                    <option value="">None</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Age Group</label>
                  <input name="ageGroup" defaultValue={product.ageGroup} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Season</label>
                  <input name="season" defaultValue={product.season} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Brand</label>
                  <input name="brandName" defaultValue={product.brand?.name || product.brandName} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Tags (comma separated)</label>
                <input name="tags" defaultValue={Array.isArray(product.tags) ? product.tags.join(', ') : product.tags} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea name="description" defaultValue={product.description} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all resize-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl flex-1">
                  <input type="checkbox" name="isDiscountable" defaultChecked={product.isDiscountable} id="isDiscountable" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                  <label htmlFor="isDiscountable" className="text-xs font-black text-gray-700 uppercase tracking-widest flex-1">Is Discountable</label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl flex-1">
                  <input type="checkbox" name="active" defaultChecked={product.active !== false} id="active" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                  <label htmlFor="active" className="text-xs font-black text-gray-700 uppercase tracking-widest flex-1">Active Status</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowInfoEditModal(false)} className="px-6 py-3 text-[0.65rem] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-black text-white rounded-xl text-[0.65rem] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Manage Modal */}
      {showMediaManageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Manage Media</h2>
                <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Upload or remove visual assets</p>
              </div>
              <button onClick={() => setShowMediaManageModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Upload Section */}
              <div className="flex items-center gap-4">
                <label className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-black hover:bg-black/5 transition-all group ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={24} className="text-gray-400 group-hover:text-black transition-colors" />
                  <span className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mt-3 group-hover:text-black">{uploading ? 'Processing...' : 'Click to Upload New Asset'}</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Check 2MB limit
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Image size must be less than 2MB");
                        return;
                      }

                      setUploading(true);
                      const formData = new FormData();
                      formData.append('image', file);
                      formData.append('productName', product.name);
                      try {
                        const res = await api.post('/upload', formData);
                        const newImages = [...(product.images || []), res.data.url];
                        await api.patch(`/products/${id}`, { images: newImages });
                        fetchProduct();
                      } catch (err) {
                        alert("Error uploading image");
                      } finally {
                        setUploading(false);
                      }
                    }} 
                  />
                </label>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {product.images?.map((url, i) => (
                  <div key={i} className="relative aspect-[3/4] group">
                    <img src={url} className={`w-full h-full object-cover rounded-2xl border-2 ring-1 transition-all ${product.thumbnailUrl === url ? 'border-amber-500 ring-amber-500' : product.hoverThumbnailUrl === url ? 'border-sky-500 ring-sky-500' : 'border-white ring-black/5'}`} alt="" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.thumbnailUrl === url && (
                        <div className="bg-amber-500 text-[8px] text-white px-2 py-0.5 rounded-md font-black tracking-widest uppercase shadow-lg ring-2 ring-white/20">Main</div>
                      )}
                      {product.hoverThumbnailUrl === url && (
                        <div className="bg-sky-500 text-[8px] text-white px-2 py-0.5 rounded-md font-black tracking-widest uppercase shadow-lg ring-2 ring-white/20">Hover</div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center gap-2">
                       <button 
                         onClick={() => handleSetImageRole(url, 'thumbnail')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all ${product.thumbnailUrl === url ? 'bg-amber-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                       >
                         <Star size={10} fill={product.thumbnailUrl === url ? "currentColor" : "none"} /> {product.thumbnailUrl === url ? 'Main Image' : 'Set as Main'}
                       </button>
                       <button 
                         onClick={() => handleSetImageRole(url, 'hover')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all ${product.hoverThumbnailUrl === url ? 'bg-sky-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                       >
                         <Sparkles size={10} fill={product.hoverThumbnailUrl === url ? "currentColor" : "none"} /> {product.hoverThumbnailUrl === url ? 'Hover Image' : 'Set as Hover'}
                       </button>
                       <button 
                         onClick={async () => {
                           if (!window.confirm("Permanently delete this image from server?")) return;
                           try {
                             await api.delete('/upload', { data: { url } });
                             const newImages = product.images.filter(img => img !== url);
                             const patchPayload = { images: newImages };
                             if (product.thumbnailUrl === url) patchPayload.thumbnailUrl = '';
                             if (product.hoverThumbnailUrl === url) patchPayload.hoverThumbnailUrl = '';
                             
                             await api.patch(`/products/${id}`, patchPayload);
                             fetchProduct();
                           } catch (err) {
                             alert("Error deleting image");
                           }
                         }}
                         className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-all mt-1"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{selectedVariant ? 'Edit Variation' : 'Create Variation'}</h3>
                  <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-1">Configure options and pricing</p>
                </div>
                <button onClick={() => setShowVariantModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} /></button>
             </div>
             <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.target);
                const payload = Object.fromEntries(data.entries());
                
                // Collect all attribute inputs from state + form
                const attributeParts = editVariantAttributes.map(attr => {
                  const val = data.get(`attr_val_${attr.name}`);
                  return `${attr.name}: ${val}`;
                });

                // Fallback for custom entries if any (though new UI uses fixed labels)
                if (attributeParts.length === 0 && payload.optionName && payload.optionValue) {
                  attributeParts.push(`${payload.optionName}: ${payload.optionValue}`);
                }

                const variantData = {
                  title: attributeParts.join(', '),
                  price: payload.useDefaultPrice === 'on' ? null : parseFloat(payload.price) || 0,
                  stock: parseInt(payload.stock) || 0,
                  images: variantImages
                };

                try {
                  const currentVariants = [...(product.variants || [])];
                  if (selectedVariant) {
                    const idx = currentVariants.findIndex(v => v.id === selectedVariant.id);
                    currentVariants[idx] = { ...currentVariants[idx], ...variantData };
                  } else {
                    currentVariants.push(variantData);
                  }
                  
                  await api.patch(`/products/${id}`, { variants: currentVariants });
                  fetchProduct();
                  setShowVariantModal(false);
                } catch (err) {
                  alert("Error saving variant");
                }
              }}
              className="p-8 space-y-6"
             >
                <div className="space-y-4">
                  {(() => {
                    if (!selectedVariant) {
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Option Name</label>
                            <input name="optionName" required placeholder='size, color' className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Value</label>
                            <input name="optionValue" required placeholder='m, xl, blue, green' className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" />
                          </div>
                        </div>
                      );
                    }

                    return editVariantAttributes.map((attr, pIdx) => {
                      return (
                        <div key={pIdx} className="grid grid-cols-[1fr_1fr_40px] gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Attribute</label>
                            <div className="px-4 py-3 bg-gray-100/50 border border-transparent rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest cursor-not-allowed">
                              {attr.name}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Value</label>
                            <input 
                              name={`attr_val_${attr.name}`} 
                              defaultValue={attr.value} 
                              required 
                              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-black transition-all" 
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditVariantAttributes(prev => prev.filter((_, i) => i !== pIdx));
                            }}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                         <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              name="useDefaultPrice" 
                              id="useDefaultPrice" 
                              checked={useDefaultVariantPrice}
                              onChange={(e) => setUseDefaultVariantPrice(e.target.checked)}
                              className="w-3 h-3 rounded" 
                            />
                            <label htmlFor="useDefaultPrice" className="text-[0.55rem] font-black text-gray-400 uppercase">Use Default</label>
                         </div>
                       </div>
                       {!useDefaultVariantPrice && (
                         <input name="price" type="number" min="0" defaultValue={selectedVariant?.price || product.price} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black focus:bg-white focus:border-black transition-all animate-in slide-in-from-top-2 duration-200" />
                       )}
                    </div>

                <div className="space-y-1">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Inventory Status</label>
                  <input name="stock" type="number" min="0" defaultValue={selectedVariant?.stock || 0} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black focus:bg-white focus:border-black transition-all" />
                </div>

                <div className="space-y-4">
                  <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Variant Images</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl min-h-[50px] border border-transparent hover:border-black/5 transition-all">
                    {variantImages.map((vImg, vI) => (
                      <div key={vI} className="relative group/vimg w-10 h-14">
                        <img src={vImg} className="w-full h-full object-cover rounded shadow-sm ring-1 ring-black/5" />
                        <button
                          type="button"
                          onClick={() => {
                            setVariantImages(prev => prev.filter((_, i) => i !== vI));
                          }}
                          className="absolute -top-1 -right-1 bg-black text-white p-0.5 rounded-full opacity-0 group-hover/vimg:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    
                    <div className="relative group/add" ref={variantImagePickerRef}>
                      <button
                        type="button"
                        className="w-10 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 hover:border-black hover:text-black transition-all"
                        onClick={() => setShowVariantImagePicker(!showVariantImagePicker)}
                      >
                        <Plus size={16} />
                      </button>

                      {showVariantImagePicker && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest p-2 border-b mb-2">Select Product Media</p>
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                            {product.images?.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => {
                                  if (!variantImages.includes(img)) {
                                    setVariantImages(prev => [...prev, img]);
                                  }
                                  setShowVariantImagePicker(false);
                                }}
                                className={`aspect-[3/4] rounded-lg border transition-all overflow-hidden ${variantImages.includes(img) ? 'ring-2 ring-black border-black' : 'hover:border-black'}`}
                              >
                                <img src={img} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6">
                  {selectedVariant && (
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!window.confirm("Delete this variant?")) return;
                        const newVariants = product.variants.filter(v => v.id !== selectedVariant.id);
                        await api.patch(`/products/${id}`, { variants: newVariants });
                        fetchProduct();
                        setShowVariantModal(false);
                      }}
                      className="px-4 py-2 text-red-500 text-[0.6rem] font-black uppercase tracking-widest"
                    >
                      Delete
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={() => setShowVariantModal(false)} className="px-6 py-3 text-[0.6rem] font-black uppercase text-gray-400">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-black text-white rounded-xl text-[0.6rem] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">Save Variant</button>
                  </div>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* Organize Modal */}
      {showOrganizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-[#111] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 ring-1 ring-white/5">
             <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Organize Product</h3>
                  <p className="text-[0.6rem] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Assign categories and collections</p>
                </div>
                <button onClick={() => setShowOrganizeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400"><X size={18} /></button>
             </div>
             <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const categoryIds = Array.from(formData.getAll('categoryIds'));
                const collectionIds = Array.from(formData.getAll('collectionIds'));
                
                try {
                  await api.patch(`/products/${id}`, { categoryIds, collectionIds });
                  fetchProduct();
                  setShowOrganizeModal(false);
                } catch (err) {
                  alert("Error updating organization");
                }
              }}
              className="p-8 space-y-6"
             >
                <div className="space-y-6">
                  {/* Category Searchable Multi-select */}
                  <div className="space-y-3" ref={categoryRef}>
                    <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Categories</label>
                    <div className="relative group/cat">
                       <Plus size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="Select categories..." 
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl text-xs font-bold dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-black dark:focus:border-white/20 transition-all"
                         onFocus={() => setActiveDropdown('categories')}
                         onBlur={() => { /* Handled by useEffect click-outside */ }}
                       />
                       {activeDropdown === 'categories' && (
                         <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2">
                            {categories.map(cat => (
                              <div key={cat.id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  name="categoryIds" 
                                  value={cat.id} 
                                  id={`cat-${cat.id}`}
                                  defaultChecked={product.categories?.some(c => c.id === cat.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <label htmlFor={`cat-${cat.id}`} className="flex-1 px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[0.65rem] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest cursor-pointer">
                                  {cat.name}
                                </label>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Collection Searchable Multi-select */}
                  <div className="space-y-3" ref={collectionRef}>
                    <label className="text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Collections</label>
                    <div className="relative group/coll">
                       <Plus size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="Select collections..." 
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl text-xs font-bold dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-black dark:focus:border-white/20 transition-all"
                         onFocus={() => setActiveDropdown('collections')}
                         onBlur={() => { /* Handled by useEffect click-outside */ }}
                       />
                       {activeDropdown === 'collections' && (
                         <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2">
                            {collections.map(col => (
                              <div key={col.id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  name="collectionIds" 
                                  value={col.id} 
                                  id={`col-${col.id}`}
                                  defaultChecked={product.collections?.some(c => c.id === col.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <label htmlFor={`col-${col.id}`} className="flex-1 px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[0.65rem] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest cursor-pointer">
                                  {col.name}
                                </label>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                  <button type="button" onClick={() => setShowOrganizeModal(false)} className="px-6 py-3 text-[0.6rem] font-black uppercase text-gray-400 hover:text-black dark:hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">Save Changes</button>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* Review Image Lightbox */}
      {selectedReviewImages && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-10 select-none"
          onClick={() => setSelectedReviewImages(null)}
        >
          <button 
            onClick={() => setSelectedReviewImages(null)}
            className="absolute top-10 right-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[1100]"
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
                className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-20 md:h-20 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[1100]"
              >
                <ChevronLeft size={48} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % selectedReviewImages.length);
                }}
                className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 md:w-20 md:h-20 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md z-[1100]"
              >
                <ChevronRight size={48} />
              </button>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white text-[0.65rem] font-black uppercase tracking-widest">
                {selectedImageIndex + 1} / {selectedReviewImages.length}
              </div>
            </>
          )}

          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={selectedReviewImages[selectedImageIndex]} 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200" 
              alt="" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
