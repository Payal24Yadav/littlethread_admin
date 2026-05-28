import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Search, Filter, Tag, ChevronDown, Upload, X } from 'lucide-react';
import ProductForm from '../forms/ProductForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [isSortFocused, setIsSortFocused] = useState(false);
  const [isPageSizeFocused, setIsPageSizeFocused] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const sortRef = React.useRef(null);
  const pageSizeRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target)) setIsPageSizeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products?limit=100&includeInactive=true');
      const productList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleImportSubmit = async (event) => {
    event.preventDefault();

    if (!importFile) {
      setImportError('Please choose a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setImportLoading(true);
    setImportError('');
    setImportResult(null);

    try {
      const response = await api.post('/products/import', formData, { timeout: 120000 });
      setImportResult(response.data);
      await fetchProducts();
    } catch (error) {
      const data = error.response?.data;
      const rowError = data?.error || data?.errors?.[0]?.error || data?.errors?.[0]?.errors?.join(', ');
      setImportError(rowError ? `${data?.message || 'Import failed'}: ${rowError}` : data?.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'asc': return a.name.localeCompare(b.name);
      case 'desc': return b.name.localeCompare(a.name);
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'high-price': return b.price - a.price;
      case 'low-price': return a.price - b.price;
      case 'max-unit': return (b.totalStock ?? (b.variants?.length > 0 ? b.variants.reduce((s,v)=>s+(v.stock||0),0) : (b.stock||0))) - (a.totalStock ?? (a.variants?.length > 0 ? a.variants.reduce((s,v)=>s+(v.stock||0),0) : (a.stock||0)));
      case 'min-unit': return (a.totalStock ?? (a.variants?.length > 0 ? a.variants.reduce((s,v)=>s+(v.stock||0),0) : (a.stock||0))) - (b.totalStock ?? (b.variants?.length > 0 ? b.variants.reduce((s,v)=>s+(v.stock||0),0) : (b.stock||0)));
      default: return 0;
    }
  });

  const displayProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Products</h1>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-6">

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-gray-50/50 dark:bg-white/5">
             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
               <div ref={sortRef} className="relative min-w-[180px]">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm transition-all hover:border-black dark:hover:border-white"
                  >
                    <div className="flex items-center gap-2">
                       <Filter size={14} className="text-gray-400" />
                       <span className="text-[0.7rem] font-black uppercase tracking-widest dark:text-white">
                         {sortBy === 'newest' && 'Newest First'}
                         {sortBy === 'oldest' && 'Oldest First'}
                         {sortBy === 'asc' && 'Name: A-Z'}
                         {sortBy === 'desc' && 'Name: Z-A'}
                         {sortBy === 'high-price' && 'Price: High to Low'}
                         {sortBy === 'low-price' && 'Price: Low to High'}
                         {sortBy === 'max-unit' && 'Stock: High to Low'}
                         {sortBy === 'min-unit' && 'Stock: Low to High'}
                       </span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                      {[
                        { val: 'newest', label: 'Newest First' },
                        { val: 'oldest', label: 'Oldest First' },
                        { val: 'asc', label: 'Name: A-Z' },
                        { val: 'desc', label: 'Name: Z-A' },
                        { val: 'high-price', label: 'Price: High to Low' },
                        { val: 'low-price', label: 'Price: Low to High' },
                        { val: 'max-unit', label: 'Stock: High to Low' },
                        { val: 'min-unit', label: 'Stock: Low to High' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => { setSortBy(opt.val); setIsSortOpen(false); }}
                          className={`w-full text-left px-5 py-2.5 text-[0.7rem] font-bold transition-all relative group flex items-center ${sortBy === opt.val ? 'bg-gray-50 dark:bg-white/5 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
                        >
                          {sortBy === opt.val && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white" />}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
               </div>

               <div ref={pageSizeRef} className="relative min-w-[120px]">
                  <button 
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    className="w-full flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm transition-all hover:border-black dark:hover:border-white"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[0.6rem] font-black text-gray-400 uppercase">Show:</span>
                       <span className="text-[0.75rem] font-black dark:text-white">{pageSize}</span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPageSizeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                      {[10, 20, 30].map((size) => (
                        <button
                          key={size}
                          onClick={() => { setPageSize(size); setCurrentPage(1); setIsPageSizeOpen(false); }}
                          className={`w-full text-left px-5 py-2.5 text-[0.75rem] font-bold transition-all relative group flex items-center ${pageSize === size ? 'bg-gray-50 dark:bg-white/5 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
                        >
                          {pageSize === size && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white" />}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
               </div>
            </div>

             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
               <div className="relative flex-1">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Find products..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="pl-9 pr-4 py-1.5 w-full md:w-64 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[0.8rem] font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                 />
               </div>
               <button
                  onClick={() => { setShowImportModal(true); setImportError(''); setImportResult(null); }}
                  className="px-4 py-2 md:py-1.5 bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:border-black dark:hover:border-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                <Upload size={14} strokeWidth={3} /> Import CSV
              </button>
               <button
                  onClick={handleCreate}
                  className="px-4 py-2 md:py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[0.65rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                <Plus size={14} strokeWidth={3} /> New Product
              </button>
             </div>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30">
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Product</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Category</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Collection</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Price</th>
                  <th className="px-6 py-4 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest leading-none">Inventory</th>
                  <th className="px-6 py-4 w-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto"></div>
                    </td>
                  </tr>
                ) : displayProducts.length > 0 ? (
                  displayProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50/80 dark:hover:bg-white/2 transition-colors group cursor-pointer text-xs font-bold"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-14 bg-gray-100 dark:bg-white/5 rounded-md overflow-hidden shadow-sm">
                            {(product.thumbnailUrl || product.images?.[0]) && (
                              <img src={product.thumbnailUrl || product.images[0]} className="w-full h-full object-cover" alt="" />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{product.name}</p>
                            <p className="text-[0.6rem] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">{product.subtitle || 'No Subtitle'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[0.6rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {product.categories?.length > 0 ? (
                          <>
                            {product.categories[0].name}
                            {product.categories.length > 1 && (
                              <span className="ml-1 text-emerald-500">+{product.categories.length - 1}</span>
                            )}
                          </>
                        ) : 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[0.6rem] font-black text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded uppercase tracking-widest">
                          {product.collections?.length > 0 ? (
                            <>
                              {product.collections[0].name}
                              {product.collections.length > 1 && (
                                <span className="ml-1 opacity-70">+{product.collections.length - 1}</span>
                              )}
                            </>
                          ) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {product.discountPrice > 0 && (
                            <span className="text-[0.6rem] text-gray-400 dark:text-gray-600 line-through">₹{parseFloat(product.price || 0) + parseFloat(product.discountPrice || 0)}</span>
                          )}
                          <span className="text-sm font-black text-gray-900 dark:text-white">₹{product.price}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const totalUnits = product.totalStock ?? (product.variants?.length > 0
                            ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                            : (product.stock || 0));
                          return (
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${totalUnits > 10 ? 'bg-emerald-500' : totalUnits > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                              <span className="text-[0.65rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{totalUnits} units</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-32 text-center">
                       <Tag size={48} className="mx-auto text-gray-200 dark:text-white/10 mb-4" strokeWidth={1} />
                       <div className="space-y-1">
                         <p className="text-[0.7rem] text-gray-900 dark:text-white font-black uppercase tracking-widest">No products found</p>
                         <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-tight">Add your first product to start selling</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-white/2">
            <p className="text-[0.6rem] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">
              Showing {Math.min(filteredProducts.length, displayProducts.length)} of {filteredProducts.length} results
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-[0.65rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg font-black text-gray-600 dark:text-gray-400 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-[0.65rem] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg font-black text-gray-600 dark:text-gray-400 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </main>

      {showModal && (
        <ProductForm 
          product={selectedProduct} 
          onClose={() => setShowModal(false)} 
          onSave={fetchProducts} 
        />
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">Import Products CSV</h2>
                <a
                  href="/example.csv"
                  download="example.csv"
                  className="inline-flex items-center mt-2 px-3 py-1.5 rounded-lg bg-black text-white text-[0.6rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Download example.csv
                </a>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-black file:text-white dark:file:bg-white dark:file:text-black"
              />

              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-700">Success</p>
                      <p className="text-2xl font-black text-emerald-900">{importResult.successCount || 0}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-amber-700">Failed</p>
                      <p className="text-2xl font-black text-amber-900">{importResult.failedCount || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">Processed</p>
                      <p className="text-2xl font-black text-gray-900">{(importResult.successCount || 0) + (importResult.failedCount || 0)}</p>
                    </div>
                  </div>

                  {importResult.failedRows?.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Failed Rows</p>
                      </div>
                      <div className="max-h-72 overflow-auto divide-y divide-gray-100 dark:divide-white/5">
                        {importResult.failedRows.map((item, index) => (
                          <div key={index} className="p-4 text-sm">
                            <p className="font-black text-gray-900 dark:text-white">{item.error}</p>
                            <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                              {JSON.stringify(item.row, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg bg-black text-white disabled:opacity-60 flex items-center gap-2"
                >
                  {importLoading ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
