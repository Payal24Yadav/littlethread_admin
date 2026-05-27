import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Upload, Package, FileText, Tag as TagIcon, Plus, Trash2, ChevronRight, Image as ImageIcon, LayoutGrid, Layers, Settings, Search, Zap } from 'lucide-react';
import BulkVariantModal from '../components/BulkVariantModal';

const normalizeVariantText = (value = '') => String(value || '').trim().replace(/\s+/g, ' ');

const slugifyProductName = (value = '') =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
    .replace(/-+$/g, '');

const parseVariantTitle = (title = '') => {
  const rawTitle = normalizeVariantText(title);
  if (!rawTitle) return [];

  if (rawTitle.includes(':')) {
    return rawTitle.split(',').map((part) => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) {
        return { name: 'option', value: normalizeVariantText(part) };
      }

      return {
        name: normalizeVariantText(part.slice(0, colonIdx)),
        value: normalizeVariantText(part.slice(colonIdx + 1)),
      };
    }).filter((attr) => attr.name && attr.value);
  }

  const slashParts = rawTitle.split('/').map((part) => normalizeVariantText(part)).filter(Boolean);
  if (slashParts.length >= 2) {
    return [
      { name: 'Color', value: slashParts[0] },
      { name: 'Size', value: slashParts[1] },
    ];
  }

  return [{ name: 'Option', value: rawTitle }];
};

const createInitialFormData = (product) => {
  if (!product) {
    return {
      name: '',
      subtitle: '',
      handle: '',
      description: '',
      price: '',
      stock: '',
      weight: '',
      length: '',
      breadth: '',
      height: '',
      categoryIds: [],
      collectionIds: [],
      images: [],
      thumbnailUrl: '',
      hoverThumbnailUrl: '',
      variants: [],
      isDiscountable: false,
      discountPrice: '',
      discountPercentage: '',
      productType: '',
      gender: '',
      ageGroup: '',
      season: '',
      brandName: '',
      tags: '',
      compareAtPrice: '',
      costPrice: '',
      active: true,
    };
  }

  const compareAt = Number(product.compareAtPrice || 0);
  const price = Number(product.price || 0);
  const discountPercentage = compareAt > price
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : '';

  return {
    ...product,
    name: product.name ?? '',
    subtitle: product.subtitle ?? '',
    handle: product.handle ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    stock: product.stock ?? '',
    weight: product.weight ?? '',
    length: product.length ?? '',
    breadth: product.breadth ?? '',
    height: product.height ?? '',
    categoryIds: product.categories?.map((category) => category.id) || [],
    collectionIds: product.collections?.map((collection) => collection.id) || [],
    images: Array.isArray(product.images) ? product.images : [],
    thumbnailUrl: product.thumbnailUrl ?? '',
    hoverThumbnailUrl: product.hoverThumbnailUrl ?? '',
    variants:
      product.variants?.map((variant) => {
        const attributes = parseVariantTitle(variant.title);

        return {
          ...variant,
          attributes,
          useDefaultPrice: variant.price === null || variant.price === undefined,
          price: variant.price ?? '',
          stock: variant.stock ?? '',
          images: Array.isArray(variant.images) ? variant.images : [],
        };
      }) || [],
    isDiscountable: Boolean(product.isDiscountable),
    discountPrice: product.discountPrice ?? '',
    discountPercentage: product.discountPercentage ?? discountPercentage,
    productType: product.productType ?? '',
    gender: product.gender ?? '',
    ageGroup: product.ageGroup ?? '',
    season: product.season ?? '',
    brandName: product.brand?.name ?? product.brandName ?? '',
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags ?? ''),
    compareAtPrice: product.compareAtPrice ?? '',
    costPrice: product.costPrice ?? '',
    active: product.active ?? true,
  };
};

const ProductForm = ({ onClose, onSave, product }) => {
  
    const getSaveErrorMessage = (error) => {
      const apiData = error?.response?.data;
      const status = error?.response?.status;
    
      if (apiData?.message && apiData?.detail) {
        return `${apiData.message}\n${apiData.detail}`;
      }
    
      if (apiData?.message) return apiData.message;
      if (apiData?.error) return apiData.error;
      if (error?.message === 'Network Error') {
        return 'Could not reach server. Please check internet or backend connection.';
      }
      if (status) {
        return `Failed to save product (HTTP ${status}).`;
      }
    
      return error?.message || 'Error saving product';
    };
  const [formData, setFormData] = useState(() => createInitialFormData(product));
  const [isHandleManuallyEdited, setIsHandleManuallyEdited] = useState(Boolean(product?.handle));
  const [handleStatus, setHandleStatus] = useState({ state: 'idle', message: '' });

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [stagedImages, setStagedImages] = useState([]); // Array of { file, previewUrl }
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // 'categories' or 'collections'
  const [openVariantMenuIndex, setOpenVariantMenuIndex] = useState(null);
  const [showBulkVariantModal, setShowBulkVariantModal] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const categoryRef = React.useRef(null);
  const collectionRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        if (activeDropdown === 'categories') setActiveDropdown(null);
      }
      if (collectionRef.current && !collectionRef.current.contains(event.target)) {
        if (activeDropdown === 'collections') setActiveDropdown(null);
      }
      if (openVariantMenuIndex !== null) {
        if (!event.target.closest(`#variant-image-dropdown-${openVariantMenuIndex}`)) {
          setOpenVariantMenuIndex(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, openVariantMenuIndex]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    setFormData(createInitialFormData(product));
    setIsHandleManuallyEdited(Boolean(product?.handle));
    setHandleStatus({ state: 'idle', message: '' });
    setStagedImages([]);
  }, [product]);

  useEffect(() => {
    if (isHandleManuallyEdited) return;

    const generatedHandle = slugifyProductName(formData.name);
    setFormData((current) => (
      current.handle === generatedHandle
        ? current
        : { ...current, handle: generatedHandle }
    ));
  }, [formData.name, isHandleManuallyEdited]);

  useEffect(() => {
    const handle = slugifyProductName(formData.handle);
    if (!handle) {
      setHandleStatus({ state: 'idle', message: '' });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setHandleStatus({ state: 'checking', message: 'Checking slug availability...' });
      try {
        const response = await api.get('/products', {
          params: {
            search: handle,
            includeInactive: true,
            limit: 100,
          },
        });
        const productList = Array.isArray(response.data?.data) ? response.data.data : response.data;
        const duplicate = (Array.isArray(productList) ? productList : []).find((item) =>
          item.handle === handle && item.id !== product?.id
        );

        if (cancelled) return;
        setHandleStatus(duplicate
          ? { state: 'duplicate', message: `Slug exists. Backend will save as ${handle}-1 or next available.` }
          : { state: 'available', message: 'Slug available.' }
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Error checking product slug:', error);
        setHandleStatus({ state: 'idle', message: '' });
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formData.handle, product?.id]);

  const fetchMetadata = async () => {
    try {
      const [catRes, collRes] = await Promise.all([
        api.get('/categories'),
        api.get('/collections')
      ]);
      const categoryData = Array.isArray(catRes.data?.data) ? catRes.data.data : catRes.data;
      const collectionData = Array.isArray(collRes.data?.data) ? collRes.data.data : collRes.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setCollections(Array.isArray(collectionData) ? collectionData : []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleAddCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await api.post('/categories', { name });
      const createdCategory = res.data?.data || res.data;
      setCategories((current) => [...current, createdCategory]);
      setFormData((current) => ({ ...current, categoryIds: [...current.categoryIds, createdCategory.id] }));
      setShowAddCategory(false);
      setNewName('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding category');
    }
  };

  const handleAddCollection = async () => {
    if (!newName) return;
    try {
      const res = await api.post('/collections', { name: newName });
      setCollections([...collections, res.data]);
      setFormData({ ...formData, collectionIds: [...formData.collectionIds, res.data.id] });
      setShowAddCollection(false);
      setNewName('');
    } catch (error) {
      console.error('Error adding collection:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error adding collection';
      alert(errorMsg);
    }
  };

  const processImages = (files) => {
    const newStaged = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image "${file.name}" is larger than 5MB and will be skipped.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newStaged.push({ file, previewUrl });
    }
    setStagedImages(prev => [...prev, ...newStaged]);
  };

  const handleImageUpload = (e) => {
    processImages(Array.from(e.target.files));
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        files.push(item.getAsFile());
      }
    }
    if (files.length > 0) processImages(files);
  };


  const removeImage = (index, isStaged = false) => {
    let removedUrl = '';
    if (isStaged) {
      setStagedImages(prev => {
        const item = prev[index];
        removedUrl = item?.previewUrl;
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setFormData(prev => {
        removedUrl = prev.images[index];
        return {
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        };
      });
    }

    if (removedUrl) {
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: prev.thumbnailUrl === removedUrl ? '' : prev.thumbnailUrl,
        hoverThumbnailUrl: prev.hoverThumbnailUrl === removedUrl ? '' : prev.hoverThumbnailUrl
      }));
    }
  };

  // const addVariant = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     variants: [...prev.variants, {
  //       attributes: [{ name: '', value: '' }],
  //       price: prev.price || 0,
  //       useDefaultPrice: true,
  //       stock: 0,
  //       images: []
  //     }]
  //   }));
  // };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // 1. Upload staged images first
      const uploadedUrls = [];
      const blobToRealUrl = {};
      
      for (const staged of stagedImages) {
        const uploadData = new FormData();
        uploadData.append('image', staged.file);
        const res = await api.post('/upload', uploadData);
        uploadedUrls.push(res.data.url);
        blobToRealUrl[staged.previewUrl] = res.data.url;
      }

      // 2. Prepare payload
      const sellingPrice = parseFloat(formData.price) || 0;
      const compareAtPrice = parseFloat(formData.compareAtPrice) || 0;
      const costPrice = parseFloat(formData.costPrice) || 0;

      const payload = {
        ...formData,
        price: sellingPrice,
        compareAtPrice: compareAtPrice || null,
        costPrice: costPrice || null,
        images: [...formData.images, ...uploadedUrls],
        handle: slugifyProductName(formData.handle || formData.name) || null,
        categoryIds: formData.categoryIds || [],
        collectionIds: formData.collectionIds || [],
        thumbnailUrl: formData.thumbnailUrl || (formData.images[0] || uploadedUrls[0]),
        hoverThumbnailUrl: formData.hoverThumbnailUrl || (formData.images[1] || uploadedUrls[1]),
        variants: formData.variants.map(v => {
          const realImageUrls = (v.images || [])
            .map(img => blobToRealUrl[img] || img)
            .filter(img => img && !img.startsWith('blob:'));
          
          const title = v.attributes
            .filter(attr => attr.name && attr.value)
            .map(attr => `${attr.name}: ${attr.value}`)
            .join(', ');
            
          return {
            id: v.id,
            title: title || 'Default Variant',
            sku: v.sku || null,
            barcode: v.barcode || null,
            price: v.useDefaultPrice ? null : parseFloat(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            weight: v.weight ? parseFloat(v.weight) : null,
            length: v.length ? parseFloat(v.length) : null,
            breadth: v.breadth ? parseFloat(v.breadth) : null,
            height: v.height ? parseFloat(v.height) : null,
            images: Array.from(new Set(realImageUrls)),
            active: v.active ?? true,
          };
        }),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        productType: formData.productType || null,
        gender: formData.gender || null,
        ageGroup: formData.ageGroup || null,
        season: formData.season || null,
        brandName: formData.brandName || null,
        active: !!formData.active
      };


      delete payload.categories;
      delete payload.collections;
      delete payload.categoryId;
      delete payload.collectionId;

      const response = product?.id
        ? await api.put(`/products/${product.id}`, payload)
        : await api.post('/products', payload);
      console.log('[ProductForm] Product saved', {
        id: response.data?.data?.id || response.data?.id || product?.id,
        mode: product?.id ? 'update' : 'create',
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(getSaveErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      onPaste={handlePaste}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-10 transition-all duration-500 outline-none"
      tabIndex="0"
    >
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 ring-1 ring-black/5">

        {/* Header - Not Sticky Inside to avoid overlap, controlled by flex layout */}
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
              {product ? 'Edit Product' : 'Create New Product'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">General & Variations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-95 group">
            <X size={24} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-16 bg-gray-50/30">

          {/* General Info */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white rounded-lg shadow-lg">
                <FileText size={16} />
              </div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Detailed Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
                <input
                  type="text"
                  placeholder="Vogue Black Shirt"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.name}
                  onChange={e => setFormData((current) => ({ ...current, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Subtitle (Optional)</label>
                <input
                  type="text"
                  placeholder="Premium Summer Collection"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Handle / Slug</label>
                <input
                  type="text"
                  placeholder="vogue-black-shirt"
                  className={`w-full px-5 py-4 bg-white border rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 transition-all ${
                    handleStatus.state === 'duplicate'
                      ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                      : handleStatus.state === 'available'
                        ? 'border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500'
                        : 'border-gray-200 focus:ring-black/5 focus:border-black'
                  }`}
                  value={formData.handle}
                  onChange={e => {
                    setIsHandleManuallyEdited(true);
                    setFormData((current) => ({ ...current, handle: slugifyProductName(e.target.value) }));
                  }}
                />
                {handleStatus.message && (
                  <p className={`ml-1 text-[0.65rem] font-bold ${
                    handleStatus.state === 'duplicate' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {handleStatus.message}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Category</label>
                  <button type="button" onClick={() => setShowAddCategory(true)} className="text-[0.6rem] font-black text-black dark:text-white underline decoration-2 underline-offset-4">Add New</button>
                </div>
                {showAddCategory ? (
                  <div className="flex gap-2">
                    <input autoFocus className="flex-1 px-4 py-3 bg-white dark:bg-white/5 border border-black dark:border-white/20 rounded-xl text-xs font-bold dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => !newName && setShowAddCategory(false)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                    <button type="button" onClick={handleAddCategory} className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl"><Plus size={16} /></button>
                  </div>
                ) : (
                   <div className="space-y-3" ref={categoryRef}>
                    <div className="relative group">
                       <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="Look up categories..." 
                         className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-[0.75rem] font-bold focus:border-black transition-all"
                         onFocus={() => setActiveDropdown('categories')}
                       />
                       {activeDropdown === 'categories' && (
                         <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar p-2">
                            {categories.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (!formData.categoryIds.includes(c.id)) {
                                    setFormData({ ...formData, categoryIds: [...formData.categoryIds, c.id] });
                                  }
                                  setActiveDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-[0.7rem] font-black uppercase tracking-tight transition-colors"
                              >
                                {c.name}
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.categoryIds.map(id => {
                        const cat = categories.find(c => c.id === id);
                        return cat ? (
                          <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 animate-in">
                            <span className="text-[0.6rem] font-black uppercase tracking-widest">{cat.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setFormData({ ...formData, categoryIds: formData.categoryIds.filter(cid => cid !== id) })}
                              className="text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Collection</label>
                  <button type="button" onClick={() => setShowAddCollection(true)} className="text-[0.6rem] font-black text-black dark:text-white underline decoration-2 underline-offset-4">Add New</button>
                </div>
                {showAddCollection ? (
                  <div className="flex gap-2">
                    <input autoFocus className="flex-1 px-4 py-3 bg-white dark:bg-white/5 border border-black dark:border-white/20 rounded-xl text-xs font-bold dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => !newName && setShowAddCollection(false)} onKeyDown={e => e.key === 'Enter' && handleAddCollection()} />
                    <button type="button" onClick={handleAddCollection} className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl"><Plus size={16} /></button>
                  </div>
                ) : (
                   <div className="space-y-3" ref={collectionRef}>
                    <div className="relative group">
                       <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="Look up collections..." 
                         className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-[0.75rem] font-bold focus:border-black transition-all"
                         onFocus={() => setActiveDropdown('collections')}
                       />
                       {activeDropdown === 'collections' && (
                         <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar p-2">
                            {collections.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (!formData.collectionIds.includes(c.id)) {
                                    setFormData({ ...formData, collectionIds: [...formData.collectionIds, c.id] });
                                  }
                                  setActiveDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-[0.7rem] font-black uppercase tracking-tight transition-colors"
                              >
                                {c.name}
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.collectionIds.map(id => {
                        const coll = collections.find(c => c.id === id);
                        return coll ? (
                          <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 animate-in">
                            <span className="text-[0.6rem] font-black uppercase tracking-widest">{coll.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setFormData({ ...formData, collectionIds: formData.collectionIds.filter(cid => cid !== id) })}
                              className="text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 text-gray-700 rounded-lg shadow-sm">
                  <Package size={16} />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Shipping Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Weight (kg)"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Length (cm)"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.length}
                  onChange={e => setFormData({ ...formData, length: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Breadth (cm)"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.breadth}
                  onChange={e => setFormData({ ...formData, breadth: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Height (cm)"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.height}
                  onChange={e => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">
                Optional values used for shipping and courier calculations.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Product Story / Description</label>
              <textarea
                placeholder="Narrate the craftsmanship and details..."
                rows={4}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold leading-relaxed focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Classification */}
            <div className="space-y-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black text-white rounded-lg shadow-lg">
                  <LayoutGrid size={16} />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Classification & Attributes</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Product Type</label>
                  <input
                    type="text"
                    placeholder="e.g. T-Shirt, Dress"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                  <select
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all appearance-none"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Age Group</label>
                  <input
                    type="text"
                    placeholder="e.g. Kids, Adult, 2-5 Years"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.ageGroup}
                    onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Season</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer 2024, Winter"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.season}
                    onChange={e => setFormData({ ...formData, season: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Little Threads"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.brandName}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="New, Cotton, Sustainable"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white rounded-lg shadow-lg">
                <ImageIcon size={16} />
              </div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Visual Assets</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {formData.images.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-[3/4] group animate-in zoom-in duration-300">
                  <img src={url} className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-xl ring-1 ring-black/5 transition-all" alt="" />
                  <button
                    type="button"
                    onClick={() => removeImage(i, false)}
                    className="absolute -top-2 -right-2 bg-black text-white p-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {stagedImages.map((staged, i) => (
                <div key={`staged-${i}`} className="relative aspect-[3/4] group animate-in zoom-in duration-300 border-2 border-emerald-500 rounded-2xl">
                  <img src={staged.previewUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
                  <div className="absolute top-1 left-1 bg-emerald-500 text-[10px] text-white px-1.5 py-0.5 rounded-md font-bold tracking-tighter uppercase">Staged</div>
                  <button
                    type="button"
                    onClick={() => removeImage(i, true)}
                    className="absolute -top-2 -right-2 bg-black text-white p-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
              <label className={`aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-2xl cursor-pointer hover:border-black hover:bg-black/5 transition-all group ${uploading ? 'opacity-50 cursor-wait pointer-events-none' : ''}`}>
                <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
                  <Upload size={24} className="text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mt-4 group-hover:text-black">{uploading ? 'Syncing...' : 'Upload Asset'}</span>
                <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} accept="image/*" multiple />
              </label>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white rounded-lg shadow-lg">
                <TagIcon size={16} />
              </div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Pricing & Inventory</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-emerald-600 uppercase tracking-widest ml-1">Selling Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full pl-10 pr-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-emerald-900"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Compare At Price (MRP)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full pl-10 pr-5 py-4 bg-white border border-gray-200 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.compareAtPrice}
                    onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full pl-10 pr-5 py-4 bg-white border border-gray-200 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest ml-1">Global Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Dynamic Pricing Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const sPrice = parseFloat(formData.price) || 0;
                const cPrice = parseFloat(formData.compareAtPrice) || 0;
                const cost = parseFloat(formData.costPrice) || 0;
                
                const hasDiscount = cPrice > sPrice;
                const discountAmount = hasDiscount ? cPrice - sPrice : 0;
                const discountPercent = hasDiscount ? Math.round((discountAmount / cPrice) * 100) : 0;
                const profit = sPrice - cost;
                const margin = sPrice > 0 ? Math.round((profit / sPrice) * 100) : 0;

                return (
                  <>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.6rem] font-black text-emerald-600 uppercase tracking-widest">Profit Margin</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${margin > 20 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-700'}`}>
                          {margin}%
                        </span>
                      </div>
                      <div className="text-2xl font-black text-emerald-900">₹{profit}</div>
                      <p className="text-[0.65rem] text-emerald-600/70 font-bold mt-1">Earnings after product cost</p>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.6rem] font-black text-amber-600 uppercase tracking-widest">Discount Info</span>
                        {hasDiscount && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-amber-900">₹{discountAmount}</div>
                      <p className="text-[0.65rem] text-amber-600/70 font-bold mt-1">Saving for the customer</p>
                    </div>

                    <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100/50 flex flex-col justify-center">
                      {cPrice > 0 && cPrice < sPrice ? (
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                          <X size={16} strokeWidth={3} />
                          <span className="text-[0.65rem] font-black uppercase tracking-widest">MRP must be ≥ Price</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest block">Standard Status</span>
                          <span className="text-xs font-bold text-zinc-600">
                            {hasDiscount ? 'Discounted Item' : 'Full Price Item'}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* Variants Section */}
          <section className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black text-white rounded-lg shadow-lg">
                  <Layers size={16} />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Product Variations</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* <button
                  type="button"
                  onClick={() => {
                    setBulkEditMode(true);
                    setShowBulkVariantModal(true);
                  }}
                  className="group flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all"
                >
                  <Settings size={14} className="text-gray-400" /> Bulk Edit
                </button> */}
                <button
                  type="button"
                  onClick={() => {
                    setBulkEditMode(false);
                    setShowBulkVariantModal(true);
                  }}
                  className="group flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg shadow-black/10"
                >
                  <Zap size={14} className="text-amber-500" /> Create
                </button>
                {/* <button
                  type="button"
                  onClick={addVariant}
                  className="group flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-[0.65rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                >
                  <Plus size={14} strokeWidth={3} /> Add Variation
                </button> */}
              </div>
            </div>

            <div className="space-y-6">
              {formData.variants?.map((variant, index) => (
                <div key={index} className="p-8 bg-white border border-gray-100 rounded-[2rem] relative group border-l-8 border-l-black hover:shadow-2xl transition-all shadow-xl shadow-black/[0.02]">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute top-6 right-6 p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pr-10 items-end">
                    <div className="space-y-4 col-span-1">
                      {variant.attributes.map((attr, aIdx) => (
                        <div key={aIdx} className="space-y-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 relative group/attr">
                          <button
                            type="button"
                            onClick={() => {
                              const newAttrs = variant.attributes.filter((_, i) => i !== aIdx);
                              updateVariant(index, 'attributes', newAttrs);
                            }}
                            className="absolute -top-1 -right-1 p-1 bg-white border border-gray-100 text-red-400 hover:text-red-500 rounded-lg opacity-0 group-hover/attr:opacity-100 transition-all shadow-sm"
                          >
                            <Trash2 size={10} />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest leading-none block">Attribute</label>
                            <input
                              type="text"
                              placeholder="e.g. Size"
                              className="w-full px-3 py-2 bg-transparent border-b border-gray-200 text-[0.7rem] font-black uppercase tracking-widest focus:border-black transition-all outline-none"
                              value={attr.name}
                              onChange={e => {
                                const newAttrs = [...variant.attributes];
                                newAttrs[aIdx].name = e.target.value;
                                updateVariant(index, 'attributes', newAttrs);
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest leading-none block">Value</label>
                            <input
                              type="text"
                              placeholder="e.g. XL"
                              className="w-full px-3 py-2 bg-transparent text-[0.7rem] font-bold focus:bg-white rounded-lg transition-all outline-none"
                              value={attr.value}
                              onChange={e => {
                                const newAttrs = [...variant.attributes];
                                newAttrs[aIdx].value = e.target.value;
                                updateVariant(index, 'attributes', newAttrs);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          updateVariant(index, 'attributes', [...variant.attributes, { name: '', value: '' }]);
                        }}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[0.6rem] font-black text-gray-400 uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={10} /> Add Attribute
                      </button>
                    </div>

                    <div className="space-y-2 col-span-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => updateVariant(index, 'useDefaultPrice', !variant.useDefaultPrice)}>
                          <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${variant.useDefaultPrice ? 'bg-black border-black text-white' : 'border-gray-300'}`}>
                            {variant.useDefaultPrice && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="text-[0.55rem] font-black text-gray-400 uppercase">Default</span>
                        </div>
                      </div>
                      <input
                        type="number"
                        disabled={variant.useDefaultPrice}
                        className={`w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black transition-all ${variant.useDefaultPrice ? 'opacity-50 cursor-not-allowed' : 'focus:bg-white focus:border-black'}`}
                        value={variant.useDefaultPrice ? formData.price : variant.price}
                        onChange={e => updateVariant(index, 'price', parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2 col-span-1">
                      <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Inventory</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black focus:bg-white focus:border-black transition-all"
                        value={variant.stock}
                        onChange={e => updateVariant(index, 'stock', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2 col-span-1">
                      <label className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest block mb-1">Variant Images</label>
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-xl min-h-[44px] border border-transparent hover:border-black/10 transition-all">
                        {variant.images.map((vImg, vI) => (
                          <div key={vI} className="relative group/vimg">
                            <img src={vImg} className="w-8 h-10 object-cover rounded shadow-sm ring-1 ring-black/5" />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...variant.images];
                                newImages.splice(vI, 1);
                                updateVariant(index, 'images', newImages);
                              }}
                              className="absolute -top-1 -right-1 bg-black text-white p-0.5 rounded-full opacity-0 group-hover/vimg:opacity-100 transition-opacity"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}

                        <div className="relative" id={`variant-image-dropdown-${index}`}>
                          <button
                            type="button"
                            className="w-8 h-10 border-2 border-dashed border-gray-200 dark:border-white/10 rounded flex items-center justify-center text-gray-300 hover:border-black hover:text-black transition-all"
                            onClick={() => {
                              setOpenVariantMenuIndex(openVariantMenuIndex === index ? null : index);
                            }}
                          >
                            <Plus size={12} />
                          </button>

                          {openVariantMenuIndex === index && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-2">
                              <p className="text-[0.5rem] font-black text-gray-400 uppercase tracking-widest p-2 border-b dark:border-white/5 mb-1">Select from Product Media</p>
                              <div className="grid grid-cols-4 gap-1 p-1 max-h-32 overflow-y-auto">
                                {[...formData.images, ...stagedImages.map(s => s.previewUrl)].map((img, imgIdx) => {
                                  const isSelected = variant.images.includes(img);
                                  return (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          updateVariant(index, 'images', variant.images.filter(i => i !== img));
                                        } else {
                                          updateVariant(index, 'images', [...variant.images, img]);
                                        }
                                      }}
                                      className={`aspect-[3/4] rounded border transition-all overflow-hidden relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'hover:border-black'}`}
                                    >
                                      <img src={img} className="w-full h-full object-cover" />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                          </div>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="p-2 pt-2 border-t dark:border-white/5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = prompt("Or paste external URL:");
                                    if (url) {
                                      if (variant.images.includes(url)) {
                                        alert("This image is already available in this variant.");
                                      } else {
                                        updateVariant(index, 'images', [...variant.images, url]);
                                      }
                                    }
                                    setOpenVariantMenuIndex(null);
                                  }}
                                  className="w-full py-1.5 text-[0.6rem] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                                >
                                  PASTE URL
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variant Details Expansion */}
                    <div className="col-span-4 grid grid-cols-1 md:grid-cols-6 gap-4 pt-4 border-t border-gray-50 mt-4">
                       <div className="space-y-1 col-span-2">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">SKU</label>
                         <input type="text" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.sku || ''} onChange={e => updateVariant(index, 'sku', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-2">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode</label>
                         <input type="text" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.barcode || ''} onChange={e => updateVariant(index, 'barcode', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Compare At</label>
                         <input type="number" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.compareAtPrice || ''} onChange={e => updateVariant(index, 'compareAtPrice', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Cost</label>
                         <input type="number" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.costPrice || ''} onChange={e => updateVariant(index, 'costPrice', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">Wt (kg)</label>
                         <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.weight || ''} onChange={e => updateVariant(index, 'weight', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">L (cm)</label>
                         <input type="number" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.length || ''} onChange={e => updateVariant(index, 'length', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">B (cm)</label>
                         <input type="number" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.breadth || ''} onChange={e => updateVariant(index, 'breadth', e.target.value)} />
                       </div>
                       <div className="space-y-1 col-span-1">
                         <label className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest ml-1">H (cm)</label>
                         <input type="number" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[0.7rem] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black" value={variant.height || ''} onChange={e => updateVariant(index, 'height', e.target.value)} />
                       </div>
                       <div className="col-span-2 flex items-center gap-3 pl-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={variant.active !== false} onChange={e => updateVariant(index, 'active', e.target.checked)} />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                          <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Active</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {formData.variants?.length === 0 && (
                <div className="py-16 text-center border-4 border-dashed border-gray-100 rounded-[3rem] bg-white group hover:border-black/5 transition-all">
                  <div className="inline-block p-4 bg-gray-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Layers size={32} className="text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest">No Variations Defined</p>
                  <p className="text-[0.6rem] text-gray-300 mt-1 max-w-[200px] mx-auto font-bold uppercase">Add sizes and colors for this SKU</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer - Sticky/Fixed at Bottom of the modal via flex */}
        <div className="px-10 py-8 border-t border-gray-100 bg-white flex justify-end gap-6 shrink-0 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">
            Discard
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={uploading}
            className="group flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                {product ? 'Synchronizing...' : 'Posting...'}
              </>
            ) : (
              <>
                {product ? 'Synchronize Data' : 'Post Project'} <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {showBulkVariantModal && (
        <BulkVariantModal 
          product={formData}
          mediaAssets={[...formData.images, ...stagedImages.map((staged) => staged.previewUrl)]}
          mode={bulkEditMode ? 'edit' : 'create'}
          onClose={() => setShowBulkVariantModal(false)}
          onGenerate={(newBulkVariants) => {
            const parsedVariants = newBulkVariants.map(v => {
              const attributes = parseVariantTitle(v.title);
              return { ...v, attributes, useDefaultPrice: v.price === null };
            });
            
            setFormData(prev => ({
              ...prev,
              variants: bulkEditMode ? parsedVariants : [...prev.variants, ...parsedVariants]
            }));
            setShowBulkVariantModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ProductForm;
