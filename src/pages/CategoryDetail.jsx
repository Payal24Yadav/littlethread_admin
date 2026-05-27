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
  CheckCircle2,
  Circle
} from 'lucide-react';

const CategoryDetail = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categories/${id}`);
      setCategory(res.data);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
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

      setAvailableProducts(products.filter((p) => !p.categories?.some((cat) => cat.id === id)));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductsToCategoryBulk = async () => {
    if (selectedProductIds.length === 0) return;
    setIsAddingBulk(true);
    try {
      for (const productId of selectedProductIds) {
        const productRes = await api.get(`/products/${productId}`);
        const currentCategoryIds = productRes.data.categories?.map(c => c.id) || [];
        
        if (!currentCategoryIds.includes(id)) {
          await api.patch(`/products/${productId}`, { 
            categoryIds: [...currentCategoryIds, id] 
          });
        }
      }
      setShowAddModal(false);
      setSelectedProductIds([]);
      fetchCategory();
    } catch (error) {
      alert('Error adding products');
    } finally {
      setIsAddingBulk(false);
    }
  };

  const removeProductFromCategory = async (productId) => {
    if (!window.confirm('Remove this product from the category?')) return;
    try {
      const productRes = await api.get(`/products/${productId}`);
      const currentCategoryIds = productRes.data.categories?.map(c => c.id) || [];
      
      await api.patch(`/products/${productId}`, { 
        categoryIds: currentCategoryIds.filter(catId => catId !== id) 
      });
      fetchCategory();
    } catch (error) {
      alert('Error removing product');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
    </div>
  );

  if (!category) return <div>Category not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
       <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <Link to="/categories" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all text-gray-500">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-none">Categories</span>
            <span className="text-gray-300">/</span>
            <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{category.name}</h1>
          </div>
        </div>
      </header>

      <main className="p-10 max-w-[95%] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         

          {/* Products List */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                 <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none">Products in this Category</h2>
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
                    {category.products?.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-100 p-1 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/products/${product.id}`} className="flex items-center gap-3">
                            <div className="w-8 h-10 bg-gray-100 dark:bg-white/5 rounded overflow-hidden">
                              {(product.thumbnailUrl || product.images?.[0]) && (
                                <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <span className="text-xs font-bold dark:text-white">{product.name}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs font-black dark:text-white">₹{product.price}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => removeProductFromCategory(product.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!category.products || category.products.length === 0) && (
                      <tr>
                        <td colSpan="3" className="px-6 py-20 text-center text-gray-400 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                          No products linked to this category
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
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
               <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 leading-none">Category Info</h2>
               <div className="space-y-4">
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Name</label>
                    <p className="text-sm font-bold dark:text-white">{category.name}</p>
                  </div>
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Handle</label>
                    <p className="text-xs font-mono text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded inline-block">/{category.name?.toLowerCase().replace(/ /g, '-') || 'category'}</p>
                  </div>
                  <div>
                    <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Products Count</label>
                    <p className="text-sm font-bold dark:text-white">{category.products?.length || 0}</p>
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
                <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Select products to add to {category.name}</p>
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
                            <CheckCircle2 size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">{product.name}</p>
                        <p className="text-[0.6rem] text-gray-400 font-bold uppercase leading-none mt-1">₹{product.price}</p>
                      </div>
                      <div className={`transition-all ${isSelected ? 'text-emerald-500' : 'text-gray-300 group-hover:text-black dark:group-hover:text-white'}`}>
                        {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/2">
               <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">{selectedProductIds.length} Products Selected</p>
               <button 
                 onPointerUp={addProductsToCategoryBulk}
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

export default CategoryDetail;
