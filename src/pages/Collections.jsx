import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Layers, Tag as TagIcon, Search, Filter, Upload, Image as ImageIcon, X, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import { useNavigate, Link } from 'react-router-dom';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCollection, setNewCollection] = useState({ name: '', description: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [nameError, setNameError] = useState('');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/collections');
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setCollections(list.slice().sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const processImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e) => {
    processImageUpload(e.target.files[0]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        processImageUpload(item.getAsFile());
        break;
      }
    }
  };


  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.name.trim()) {
      setNameError('Collection name is required.');
      return;
    }

    setNameError('');

    setUploading(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        const formData = new FormData();
        formData.append('uploadType', 'collection');
        formData.append('image', selectedImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.url;
      }

      const res = await api.post('/collections', { ...newCollection, imageUrl });
      setCollections([...collections, res.data]);
      setNewCollection({ name: '', description: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setNameError('');
    } catch (error) {
      console.error('Error adding collection:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error adding collection';
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      await api.delete(`/collections/${id}`);
      setCollections(collections.filter(c => c.id !== id));
    } catch (error) {
      alert('Error deleting collection');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setCollections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        setOrderDirty(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };


  const saveOrder = async () => {
    if (!orderDirty) return;
    setUploading(true);
    try {
      const items = collections.map((c, i) => ({ id: c.id, order: i }));
      await api.post('/collections/reorder', { items });
      setOrderDirty(false);
      alert('Order saved successfully!');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Collections</h1>
        <button 
          onClick={saveOrder}
          disabled={!orderDirty || loading || uploading}
          className={`px-4 md:px-6 py-2 rounded-xl text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all ${orderDirty && !loading && !uploading ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-105' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-300 cursor-not-allowed'} ${!orderDirty || loading || uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          Save Order
        </button>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Add Collection Form */}
        <div 
          onPaste={handlePaste}
          className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all outline-none"
          tabIndex="0"
        >

          <form onSubmit={handleAddCollection} className="space-y-4">
             <h2 className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Create New Collection</h2>
              <div className="flex flex-col gap-4">
                 <input 
                   type="text" 
                   placeholder="Collection Name (e.g. Winter Sale)" 
                   className={`w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 dark:focus:ring-white/5 transition-all text-gray-900 dark:text-white ${nameError ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 dark:border-white/5 focus:ring-black/5'}`}
                   value={newCollection.name}
                   onChange={e => {
                     setNewCollection({...newCollection, name: e.target.value});
                     if (e.target.value.trim()) {
                       setNameError('');
                     }
                   }}
                 />
                 {nameError && (
                   <p className="mt-[-0.35rem] ml-1 text-[0.7rem] font-bold text-red-500">
                     {nameError}
                   </p>
                 )}
                 <input 
                   type="text" 
                   placeholder="Short Description" 
                   className="w-full px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-gray-900 dark:text-white"
                   value={newCollection.description}
                   onChange={e => setNewCollection({...newCollection, description: e.target.value})}
                 />
                 <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-5 py-2">
                    <label className="flex items-center gap-2 cursor-pointer group flex-1">
                       {imagePreview ? (
                         <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                           <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <Upload size={12} className="text-white" />
                           </div>
                         </div>
                       ) : (
                         <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-400 group-hover:border-black dark:group-hover:border-white group-hover:text-black dark:group-hover:text-white transition-all">
                           <Upload size={16} />
                         </div>
                       )}
                       <div className="flex flex-col">
                         <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Collection Image</span>
                         <span className="text-[0.65rem] font-bold text-gray-900 dark:text-white">{imagePreview ? 'Change Image' : 'Click to Upload'}</span>
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                    {imagePreview && (
                      <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="text-gray-400 hover:text-red-500 p-1">
                         <X size={14} />
                      </button>
                    )}
                 </div>
              </div>
             <button 
              type="submit" 
              disabled={uploading}
              className="px-6 py-3 bg-black dark:bg-white dark:text-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent animate-spin rounded-full" />
              ) : <Plus size={16} strokeWidth={3} />}
              {uploading ? 'Processing...' : 'Create Collection'}
            </button>
          </form>
        </div>

        {/* Collections List */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Layers size={16} className="text-gray-400" />
               <span className="text-[0.65rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Collections</span>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-gray-50/10">
                  <th className="px-6 py-3 w-4"></th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Image</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-3 text-[0.6rem] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest text-center">Products</th>
                  <th className="px-6 py-3 w-4"></th>
                </tr>
              </thead>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={collections.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                        </td>
                      </tr>
                    ) : collections.length > 0 ? (
                      collections.map((collection, index) => (
                        <SortableRow 
                          key={collection.id} 
                          collection={collection} 
                          index={index} 
                          onDelete={handleDelete}
                          onNavigate={() => navigate(`/collections/${collection.id}`)}
                        />
                      ))
                    ) : (
                      <tr className="h-[240px]">
                        <td colSpan="6" className="px-6 py-0">
                          <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                             <Layers size={48} strokeWidth={1} className="text-gray-200 dark:text-white/10" />
                             <p className="font-black uppercase tracking-widest text-[0.65rem] text-gray-900 dark:text-white">No collections found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>

          </div>
        </div>
      </main>
    </div>
  );
};

const SortableRow = ({ collection, index, onDelete, onNavigate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group cursor-default ${isDragging ? 'bg-gray-50 dark:bg-white/5' : ''}`}
      onClick={onNavigate}
    >
      <td className="px-6 py-4 w-4">
        <button 
          {...attributes} 
          {...listeners}
          className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded cursor-grab active:cursor-grabbing text-gray-400"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="px-6 py-4">
        <span className="text-[0.65rem] font-black bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-100 dark:border-white/5">
          {index + 1}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
          {collection.imageUrl ? (
            <img src={collection.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
               <ImageIcon size={20} />
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
        {collection.name}
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
        {collection.description || '—'}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[0.6rem] font-black rounded-lg">
          {collection.productsCount ?? collection.products?.length ?? 0}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(collection.id);
          }}
          className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export default Collections;
