import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Package, 
  Search, 
  X,
  Layers,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

const CollectionDetail = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/collections/${id}`);
      setCollection(res.data);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const processImagePaste = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUpdatingImage(true);
    try {
      const formData = new FormData();
      formData.append('uploadType', 'collection');
      formData.append('image', file);
      const uploadRes = await api.post('/upload', formData);
      const newImageUrl = uploadRes.data.url;

      await api.put(`/collections/${id}`, { 
        name: collection.name, 
        description: collection.description, 
        imageUrl: newImageUrl 
      });
      
      setCollection(prev => ({ ...prev, imageUrl: newImageUrl }));
    } catch (error) {
      console.error('Error updating image:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Error updating image');
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const handleImageUpdate = (e) => {
    processImagePaste(e.target.files[0]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        processImagePaste(item.getAsFile());
        break;
      }
    }
  };


  const fetchAvailableProducts = async () => {
    try {
      const res = await api.get('/products');
      const products = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // Filter out products already in this collection
      setAvailableProducts(products.filter(p => !p.collections?.some(col => col.id === id)));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductsToCollectionBulk = async () => {
    if (selectedProductIds.length === 0) return;
    setIsAddingBulk(true);
    try {
      for (const productId of selectedProductIds) {
        const productRes = await api.get(`/products/${productId}`);
        const currentCollectionIds = productRes.data.collections?.map(c => c.id) || [];
        
        if (!currentCollectionIds.includes(id)) {
          await api.patch(`/products/${productId}`, { 
            collectionIds: [...currentCollectionIds, id] 
          });
        }
      }
      setShowAddModal(false);
      setSelectedProductIds([]);
      fetchCollection();
    } catch (error) {
      alert('Error adding products');
    } finally {
      setIsAddingBulk(false);
    }
  };

  const removeProductFromCollection = async (productId) => {
    if (!window.confirm('Remove this product from the collection?')) return;
    try {
      const productRes = await api.get(`/products/${productId}`);
      const currentCollectionIds = productRes.data.collections?.map(c => c.id) || [];
      
      await api.patch(`/products/${productId}`, { 
        collectionIds: currentCollectionIds.filter(colId => colId !== id) 
      });
      fetchCollection();
    } catch (error) {
      alert('Error removing product');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
    </div>
  );

  if (!collection) return <div>Collection not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
       <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <Link to="/collections" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all text-gray-500">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-none">Collections</span>
            <span className="text-gray-300">/</span>
            <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{collection.name}</h1>
          </div>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          

          {/* Products List */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                 <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none">Included Products</h2>
                 <button 
                  onClick={() => {
                    setShowAddModal(true);
                    setSelectedProductIds([]);
                    fetchAvailableProducts();
                  }}
                  className="px-3 py-1.5 bg-black dark:bg-white dark:text-black text-white rounded-lg text-[0.6rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={12} strokeWidth={3} /> Add Product
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/10">
                      <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Product</th>
                      <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Price</th>
                      <th className="px-6 py-3 w-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {collection.products?.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/products/${product.id}`} className="flex items-center gap-3">
                            <div className="w-8 h-10 bg-gray-100 dark:bg-white/5 rounded overflow-hidden">
                              {(product.thumbnailUrl || product.images?.[0]) && (
                                <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <span className="text-xs font-bold dark:text-white group-hover:underline">{product.name}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs font-black dark:text-white">₹{product.price}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => removeProductFromCollection(product.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!collection.products || collection.products.length === 0) && (
                      <tr>
                        <td colSpan="3" className="px-6 py-20 text-center text-gray-400 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                          No products in this collection
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="md:col-span-1 space-y-6">
            <div 
              onPaste={handlePaste}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all outline-none"
              tabIndex="0"
            >

               <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 leading-none">Collection Info</h2>
               
               <div className="mb-6 relative group">
                  <div className="w-full aspect-video bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm relative">
                    {collection.imageUrl ? (
                      <img src={collection.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                         <ImageIcon size={32} strokeWidth={1} />
                         <span className="text-[0.6rem] font-black uppercase tracking-widest">No Image</span>
                      </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-2 scale-105 group-hover:scale-100">
                      {isUpdatingImage ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Upload size={20} />
                          <span className="text-[0.6rem] font-black uppercase tracking-widest leading-none">Update Cover</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpdate} disabled={isUpdatingImage} />
                    </label>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Name</label>
                    <p className="text-sm font-bold dark:text-white">{collection.name}</p>
                  </div>
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{collection.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Products</label>
                    <p className="text-sm font-bold dark:text-white">{collection.products?.length || 0}</p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* Add Products Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-white/5">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Add Products</h3>
                <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Select products to add to {collection.name}</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 flex items-center gap-3">
                <Search size={16} className="text-gray-400 ml-2" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="bg-transparent border-none outline-none focus:ring-0 text-xs font-bold w-full dark:text-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableProducts
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => {
                        if (isSelected) setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                        else setSelectedProductIds([...selectedProductIds, product.id]);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group ${isSelected ? 'border-emerald-500 bg-emerald-500/5' : 'border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <div className="relative">
                        <div className="w-10 h-14 bg-gray-100 dark:bg-white/10 rounded overflow-hidden">
                          {(product.thumbnailUrl || product.images?.[0]) && (
                            <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" />
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                            <Plus size={10} strokeWidth={3} className="rotate-45" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">{product.name}</p>
                        <p className="text-[0.6rem] text-gray-400 font-bold uppercase leading-none mt-1">₹{product.price}</p>
                      </div>
                      <div className={`transition-all ${isSelected ? 'text-emerald-500' : 'text-gray-300 group-hover:text-black dark:group-hover:text-white'}`}>
                         <Plus size={18} strokeWidth={2} className={isSelected ? 'rotate-45' : ''} />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/2">
               <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">{selectedProductIds.length} Products Selected</p>
               <button 
                 onClick={addProductsToCollectionBulk}
                 disabled={selectedProductIds.length === 0 || isAddingBulk}
                 className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.7rem] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
               >
                 {isAddingBulk ? (
                    <div className="w-3 h-3 border-2 border-t-transparent border-white dark:border-black rounded-full animate-spin" />
                 ) : <Plus size={14} strokeWidth={3} />}
                 Add Selected
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;
