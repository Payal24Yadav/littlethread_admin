import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layout, Image as ImageIcon, Monitor, Smartphone, Save, ChevronUp, ChevronDown, Upload, GripVertical } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import api from '../utils/api';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {

    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      // Fetch all banners for management
      const response = await api.get('/banners?all=true');
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBanner = (type = 'DESKTOP') => {
    const newBanner = {
      id: `temp-${Date.now()}`,
      imageUrl: '',
      altText: '',
      type,
      order: banners.filter(b => b.type === type).length,
      isActive: true,
      isNew: true
    };
    setBanners([...banners, newBanner]);
  };

  const updateBannerField = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const processImageUpload = async (file, id) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await api.post('/upload', formData);
      updateBannerField(id, 'imageUrl', res.data.url);
    } catch (error) {
       console.error('Upload failed:', error);
       alert('Upload failed');
    }
  };

  const handleImageUpload = (e, id) => {
    processImageUpload(e.target.files[0], id);
  };

  const handlePaste = (e, id) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processImageUpload(file, id);
        }
      }
    }
  };

  const removeBanner = async (id, isNew) => {

    if (isNew) {
      setBanners(banners.filter(b => b.id !== id));
      return;
    }
    if (!window.confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(banners.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const saveBanner = async (banner) => {
    try {
      if (banner.isNew) {
        const { isNew, ...data } = banner;
        if (typeof data.id === 'string' && data.id.startsWith('temp-')) {
          delete data.id;
        }
        const response = await api.post('/banners', data);
        // Update the local state with the saved banner (especially the DB ID)
        setBanners(prev => prev.map(b => b.id === banner.id ? response.data : b));
      } else {
        await api.put(`/banners/${banner.id}`, banner);
      }
      alert('Banner saved successfully!');
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error saving banner');
    }
  };

  const handleDragEnd = (event, type) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const typeBanners = banners.filter(b => b.type === type);
      const oldIndex = typeBanners.findIndex(b => b.id === active.id);
      const newIndex = typeBanners.findIndex(b => b.id === over.id);
      
      const updatedTypeBanners = arrayMove(typeBanners, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
      
      const otherBanners = banners.filter(b => b.type !== type);
      setBanners([...otherBanners, ...updatedTypeBanners].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.order - b.order;
      }));
    }
  };




  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
        <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Banner Management</h1>
        <div className="flex gap-2 md:gap-4">
          {/* Global save button removed as requested */}
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-[95%] mx-auto space-y-16">
        <BannerSection 
          type="DESKTOP" 
          title="Desktop Banners" 
          icon={Monitor} 
          banners={banners}
          addBanner={addBanner}
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          updateBannerField={updateBannerField}
          removeBanner={removeBanner}
          processImageUpload={processImageUpload}
          handlePaste={handlePaste}
          saveBanner={saveBanner}
        />
        <BannerSection 
          type="MOBILE" 
          title="Mobile Banners" 
          icon={Smartphone} 
          banners={banners}
          addBanner={addBanner}
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          updateBannerField={updateBannerField}
          removeBanner={removeBanner}
          processImageUpload={processImageUpload}
          handlePaste={handlePaste}
          saveBanner={saveBanner}
        />
      </main>
    </div>
  );
};


const BannerCard = ({ banner, index, updateBannerField, removeBanner, processImageUpload, handlePaste, saveBanner }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1
  };

  const [localFile, setLocalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onUploadClick = () => {
    if (localFile) {
      processImageUpload(localFile, banner.id);
      setLocalFile(null);
      setPreviewUrl(null);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onPaste={(e) => handlePaste(e, banner.id)}
      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm relative group animate-in fade-in slide-in-from-bottom-2 duration-300 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all outline-none"
      tabIndex="0"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div 
                {...attributes} 
                {...listeners} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded cursor-grab active:cursor-grabbing text-gray-400"
              >
                <GripVertical size={16} />
              </div>
              <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[0.6rem] font-black">{index + 1}</span>
           </div>
           <button onClick={() => removeBanner(banner.id, banner.isNew)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
           </button>
        </div>

        <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/2 relative group-hover:shadow-inner transition-all">
          {(previewUrl || banner.imageUrl) ? (
            <img src={previewUrl || banner.imageUrl} className="w-full h-full object-cover" alt={banner.altText || 'Banner'} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
               <ImageIcon size={32} strokeWidth={1} />
               <span className="text-[0.6rem] font-black uppercase tracking-widest">No Image</span>
            </div>
          )}
          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px]">
             <div className="flex flex-col items-center gap-2 text-white">
                <Upload size={24} />
                <span className="text-[0.6rem] font-black uppercase tracking-widest">{banner.imageUrl ? 'Change Image' : 'Select Image'}</span>
             </div>
             <input type="file" className="hidden" accept="image/*" onChange={onFileSelect} />
          </label>
        </div>

        {localFile && (
          <button 
            onClick={onUploadClick}
            className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[0.6rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] transition-all"
          >
            <Upload size={14} /> Upload Now
          </button>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
             Alt Text
          </div>
          <input 
            type="text" 
            value={banner.altText || ''}
            onChange={(e) => updateBannerField(banner.id, 'altText', e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-black/5 dark:ring-white/5 font-bold text-xs"
            placeholder="e.g. Summer sale banner 2024"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
             Redirect URL
          </div>
          <input 
            type="text" 
            value={banner.linkUrl || ''}
            onChange={(e) => updateBannerField(banner.id, 'linkUrl', e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3 rounded-xl outline-none focus:ring-2 ring-black/5 dark:ring-white/5 font-bold text-xs"
            placeholder="e.g. /collections/all or https://..."
          />
        </div>

        <div className="flex items-center justify-between pt-2">
           <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Status</span>
           <button 
             onClick={() => updateBannerField(banner.id, 'isActive', !banner.isActive)}
             className={`w-10 h-5 rounded-full transition-all relative ${banner.isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`}
           >
             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${banner.isActive ? 'left-6' : 'left-1'}`} />
           </button>
        </div>

        <button 
          onClick={() => saveBanner(banner)}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <Save size={14} /> Save Changes
        </button>
      </div>
    </div>
  );
};

const BannerSection = ({ type, title, icon: Icon, banners, addBanner, sensors, handleDragEnd, updateBannerField, removeBanner, processImageUpload, handlePaste, saveBanner }) => {
  const sectionBanners = banners.filter(b => b.type === type);
  
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">
              <Icon size={18} />
           </div>
           <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
           <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-full text-[0.6rem] font-bold text-gray-400">{sectionBanners.length} Banners</span>
        </div>
        <button 
          onClick={() => addBanner(type)}
          className="text-[0.6rem] font-black underline uppercase tracking-widest hover:text-gray-400 transition-colors"
        >
          Add New
        </button>
      </div>

      {sectionBanners.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2rem]">
           <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">No {title.toLowerCase()} banners added yet</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(event, type)}
        >
          <SortableContext 
            items={sectionBanners.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectionBanners.map((banner, index) => (
                <BannerCard 
                  key={banner.id}
                  banner={banner}
                  index={index}
                  updateBannerField={updateBannerField}
                  removeBanner={removeBanner}
                  processImageUpload={processImageUpload}
                  handlePaste={handlePaste}
                  saveBanner={saveBanner}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
};

export default Banners;

