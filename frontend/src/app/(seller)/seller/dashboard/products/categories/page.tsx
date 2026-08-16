'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tag, Plus, Search, Edit2, Trash2, Package, Loader2, FolderTree, AlertTriangle, 
  X, Image as ImageIcon, Sparkles, Upload, ChevronRight, Layers, Lock, RefreshCw, 
  ArrowUp, ArrowDown, Star, Check, GripVertical 
} from 'lucide-react';
import { fetchApi, uploadSingleImageApi } from '@/lib/api-client';
import { generateCategorySlug, cleanSlugInput, isValidSlug } from '@/utils/slug.util';

const SUGGESTED_IMAGES = [
  { label: 'Vegetables & Fruits', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80' },
  { label: 'Meat & Poultry',      url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80' },
  { label: 'Seafood & Fish',     url: 'https://images.unsplash.com/photo-1534942519507-769d4679447d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Milk & Dairy',       url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bakery & Snacks',    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
  { label: 'Beverages & Juices', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rice & Spices',      url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Household',          url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80' },
];

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add modal state
  const [adding, setAdding] = useState(false);
  const [categoryType, setCategoryType] = useState<'PARENT' | 'SUB'>('PARENT');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isNewSlugTouched, setIsNewSlugTouched] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [parentId, setParentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [isEditSlugTouched, setIsEditSlugTouched] = useState(true);
  const [editImage, setEditImage] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete confirm state
  const [deletingCat, setDeletingCat] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Uploading status
  const [uploadingImage, setUploadingImage] = useState(false);

  // Media Gallery Picker Modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'NEW' | 'EDIT'>('NEW');
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [gallerySearch, setGallerySearch] = useState('');

  // Drag and Drop State for Parent Categories
  const [draggedParentIndex, setDraggedParentIndex] = useState<number | null>(null);
  const [dragOverParentIndex, setDragOverParentIndex] = useState<number | null>(null);

  // Drag and Drop State for Subcategories
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any[]>('/product-categories').catch(() => null);
      if (res && res.success && Array.isArray(res.data)) {
        setCats(res.data);
      } else {
        setCats([]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMediaGalleryModal = async (target: 'NEW' | 'EDIT') => {
    setMediaTarget(target);
    setShowMediaModal(true);
    if (galleryList.length === 0) {
      try {
        setLoadingGallery(true);
        const res = await fetchApi<any>('/upload/gallery');
        if (res && res.success && Array.isArray(res.data?.media)) {
          setGalleryList(res.data.media);
        }
      } catch (err) {
        console.error('Failed to load media gallery:', err);
      } finally {
        setLoadingGallery(false);
      }
    }
  };

  const handleSelectMedia = (url: string) => {
    if (mediaTarget === 'NEW') {
      setNewImage(url);
    } else {
      setEditImage(url);
    }
    setShowMediaModal(false);
  };

  const moveCategory = async (cat: any, direction: 'up' | 'down', list: any[]) => {
    const currentIndex = list.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const targetCat = list[targetIndex];
    const itemsToUpdate = [
      { id: cat.id, displayOrder: targetIndex },
      { id: targetCat.id, displayOrder: currentIndex },
    ];

    try {
      await fetchApi('/product-categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: itemsToUpdate }),
      });
      await loadCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to reorder categories');
    }
  };

  const togglePopular = async (cat: any) => {
    try {
      await fetchApi('/product-categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          items: [{ id: cat.id, isPopular: cat.isPopular === false ? true : false }],
        }),
      });
      await loadCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to update popular status');
    }
  };

  // ─── Drag and Drop Handlers for Parent Categories ───
  const handleParentDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedParentIndex(index);
  };

  const handleParentDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedParentIndex !== null && draggedParentIndex !== index) {
      setDragOverParentIndex(index);
    }
  };

  const handleParentDrop = async (e: React.DragEvent, dropIndex: number, currentFilteredParents: any[]) => {
    e.preventDefault();
    if (draggedParentIndex === null || draggedParentIndex === dropIndex) {
      setDraggedParentIndex(null);
      setDragOverParentIndex(null);
      return;
    }

    const reorderedParents = [...currentFilteredParents];
    const [movedCat] = reorderedParents.splice(draggedParentIndex, 1);
    reorderedParents.splice(dropIndex, 0, movedCat);

    setDraggedParentIndex(null);
    setDragOverParentIndex(null);

    // Optimistically update local state immediately (No page reload!)
    const updatedItems = reorderedParents.map((cat, idx) => ({
      id: cat.id,
      displayOrder: idx,
    }));

    setCats((prev) => {
      const parentIdsMap = new Map(updatedItems.map((c) => [c.id, c.displayOrder]));
      return prev.map((c) => (parentIdsMap.has(c.id) ? { ...c, displayOrder: parentIdsMap.get(c.id) } : c));
    });

    // Save to backend silently in background
    try {
      await fetchApi('/product-categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: updatedItems }),
      });
    } catch (err) {
      console.error('Silent reorder save error:', err);
    }
  };

  // ─── Drag and Drop Handlers for Subcategories ───
  const handleSubDragStart = (e: React.DragEvent, subId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSubId(subId);
  };

  const handleSubDragOver = (e: React.DragEvent, subId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSubId && draggedSubId !== subId) {
      setDragOverSubId(subId);
    }
  };

  const handleSubDrop = async (e: React.DragEvent, dropSubId: string, subList: any[]) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedSubId || draggedSubId === dropSubId) {
      setDraggedSubId(null);
      setDragOverSubId(null);
      return;
    }

    const dragIdx = subList.findIndex((s) => s.id === draggedSubId);
    const dropIdx = subList.findIndex((s) => s.id === dropSubId);
    if (dragIdx === -1 || dropIdx === -1) return;

    const reorderedSubs = [...subList];
    const [movedSub] = reorderedSubs.splice(dragIdx, 1);
    reorderedSubs.splice(dropIdx, 0, movedSub);

    setDraggedSubId(null);
    setDragOverSubId(null);

    const updatedSubItems = reorderedSubs.map((sub, idx) => ({
      id: sub.id,
      displayOrder: idx,
    }));

    // Optimistically update local state immediately (No page reload!)
    setCats((prev) => {
      const subMap = new Map(updatedSubItems.map((s) => [s.id, s.displayOrder]));
      return prev.map((c) => (subMap.has(c.id) ? { ...c, displayOrder: subMap.get(c.id) } : c));
    });

    // Save to backend silently
    try {
      await fetchApi('/product-categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: updatedSubItems }),
      });
    } catch (err) {
      console.error('Silent subcategory reorder error:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadedUrl = await uploadSingleImageApi(file);
      if (isEdit) {
        setEditImage(uploadedUrl);
      } else {
        setNewImage(uploadedUrl);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddForParent = (parentCategory?: any) => {
    if (parentCategory) {
      setCategoryType('SUB');
      setParentId(parentCategory.id);
    } else {
      setCategoryType('PARENT');
      setParentId('');
    }
    setNewName('');
    setNewSlug('');
    setIsNewSlugTouched(false);
    setNewImage('');
    setNewDesc('');
    setAdding(true);
  };

  const handleNewNameChange = (val: string) => {
    setNewName(val);
    if (!isNewSlugTouched) {
      setNewSlug(generateCategorySlug(val));
    }
  };

  const handleNewSlugChange = (val: string) => {
    const cleaned = val.replace(/^\/+/, '');
    setNewSlug(cleaned);
    setIsNewSlugTouched(true);
  };

  const handleResetNewSlug = () => {
    setNewSlug(generateCategorySlug(newName));
    setIsNewSlugTouched(false);
  };

  const addCat = async () => {
    if (!newName.trim()) {
      alert('Please enter category name.');
      return;
    }
    if (categoryType === 'SUB' && !parentId) {
      alert('Please select a Parent Category for this subcategory.');
      return;
    }

    const finalSlug = cleanSlugInput(newSlug || generateCategorySlug(newName));
    if (!finalSlug) {
      alert('Category slug cannot be empty.');
      return;
    }
    if (!isValidSlug(finalSlug)) {
      alert('Invalid slug format. Slug can only contain lowercase letters, numbers, and hyphens (e.g. rice-dal-flour).');
      return;
    }

    const duplicate = cats.find((c) => c.slug?.toLowerCase() === finalSlug.toLowerCase());
    if (duplicate) {
      alert(`⚠️ Duplicate Slug Error!\n\nThe slug "${finalSlug}" is already assigned to category "${duplicate.name}". Please enter a unique slug.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchApi<any>('/product-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          slug: finalSlug,
          image: newImage.trim() || undefined,
          description: newDesc.trim() || undefined,
          parentId: categoryType === 'SUB' ? parentId : undefined,
        }),
      });
      if (res.success) {
        setNewName('');
        setNewSlug('');
        setIsNewSlugTouched(false);
        setNewImage('');
        setNewDesc('');
        setParentId('');
        setAdding(false);
        await loadCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cat: any) => {
    setEditingCat(cat);
    setEditName(cat.name || '');
    setEditSlug(cat.slug || '');
    setIsEditSlugTouched(true);
    setEditImage(cat.image || '');
    setEditDesc(cat.description || '');
    setEditParentId(cat.parentId || '');
  };

  const handleEditNameChange = (val: string) => {
    setEditName(val);
    if (!isEditSlugTouched) {
      setEditSlug(generateCategorySlug(val));
    }
  };

  const handleEditSlugChange = (val: string) => {
    const cleaned = val.replace(/^\/+/, '');
    setEditSlug(cleaned);
    setIsEditSlugTouched(true);
  };

  const handleResetEditSlug = () => {
    setEditSlug(generateCategorySlug(editName));
    setIsEditSlugTouched(false);
  };

  const updateCat = async () => {
    if (!editingCat || !editName.trim()) return;

    const finalSlug = cleanSlugInput(editSlug || generateCategorySlug(editName));
    if (!finalSlug) {
      alert('Category slug cannot be empty.');
      return;
    }
    if (!isValidSlug(finalSlug)) {
      alert('Invalid slug format. Slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    const duplicate = cats.find(
      (c) => c.id !== editingCat.id && c.slug?.toLowerCase() === finalSlug.toLowerCase()
    );
    if (duplicate) {
      alert(`⚠️ Duplicate Slug Error!\n\nThe slug "${finalSlug}" is already assigned to category "${duplicate.name}". Please enter a unique slug.`);
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await fetchApi<any>(`/product-categories/${editingCat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          slug: finalSlug,
          image: editImage.trim() || null,
          description: editDesc.trim() || null,
          parentId: editParentId || null,
        }),
      });
      if (res.success) {
        setEditingCat(null);
        await loadCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;

    const prodCount = deletingCat._count?.products ?? deletingCat.products ?? 0;

    if (prodCount > 0) {
      alert(`⚠️ Cannot Delete Category!\n\n"${deletingCat.name}" is currently in use by ${prodCount} active product(s). Please reassign or delete those products before deleting this category.`);
      setDeletingCat(null);
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await fetchApi<any>(`/product-categories/${deletingCat.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setDeletingCat(null);
        await loadCategories();
      }
    } catch (err: any) {
      alert(`⚠️ Category Deletion Blocked!\n\n${err.message || 'This category is currently in use by products.'}`);
      setDeletingCat(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Grouping categories into Parents and Subcategories sorted by displayOrder
  const mainParentCategories = cats
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    
  const subCategoriesList = cats.filter((c) => !!c.parentId);

  const filterCat = (cat: any) =>
    !search ||
    cat.name?.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(search.toLowerCase());

  const filteredParents = mainParentCategories.filter(filterCat);

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden file input elements */}
      <input ref={addFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
      <input ref={editFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="hidden" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Products / Category Hierarchy</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Parent Categories & Subcategories
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ✨ Tip: Click & drag any category card to re-order items instantly with smooth Drag & Drop!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddForParent()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Parent Category
          </button>
          <button
            onClick={() => {
              if (mainParentCategories.length === 0) {
                alert('Please create a Parent Category first!');
                return;
              }
              openAddForParent(mainParentCategories[0]);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            <FolderTree className="w-4 h-4" /> Add Subcategory
          </button>
        </div>
      </div>

      {/* Add Category Modal Card */}
      {adding && (
        <div className="rounded-2xl bg-[#1e1f32] border border-indigo-500/40 p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400" />
              <h3 className="font-bold text-white text-sm">
                Create {categoryType === 'PARENT' ? '📁 Main Parent Category' : '🏷️ Subcategory under Parent'}
              </h3>
            </div>
            <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#12131f] border border-white/10 max-w-md">
            <button
              type="button"
              onClick={() => setCategoryType('PARENT')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                categoryType === 'PARENT'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📁 Main Parent Category
            </button>
            <button
              type="button"
              onClick={() => {
                if (mainParentCategories.length === 0) {
                  alert('Please create a Parent Category first!');
                  return;
                }
                setCategoryType('SUB');
                if (!parentId && mainParentCategories[0]) setParentId(mainParentCategories[0].id);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                categoryType === 'SUB'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏷️ Subcategory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Left Inputs */}
            <div className="space-y-3">
              {categoryType === 'SUB' && (
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                    Select Parent Category *
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-purple-500/40 text-white text-xs font-bold focus:outline-none focus:border-purple-400"
                  >
                    <option value="">-- Choose Parent Category --</option>
                    {mainParentCategories.map((p) => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {categoryType === 'PARENT' ? 'Parent Category Name *' : 'Subcategory Name *'}
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => handleNewNameChange(e.target.value)}
                  placeholder={categoryType === 'PARENT' ? 'e.g. Meat & Poultry, Beverages...' : 'e.g. Broiler Chicken, Soft Drinks...'}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Slug Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Slug *
                  </label>
                  {isNewSlugTouched ? (
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <span>✎ Manually edited</span>
                      <button
                        type="button"
                        onClick={handleResetNewSlug}
                        className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[9px] font-mono transition-colors"
                        title="Reset auto-generated slug from title"
                      >
                        Reset Auto
                      </button>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ⚡ Auto-generated
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">/</span>
                  <input
                    value={newSlug}
                    onChange={(e) => handleNewSlugChange(e.target.value)}
                    placeholder="e.g. cal-dal-moyda"
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>URL Identifier: <code className="text-indigo-300 font-mono">/{newSlug || '...'}</code></span>
                  <span className="text-slate-500 text-[9px]">Lowercase, numbers & hyphens</span>
                </p>
              </div>

              {/* Direct Upload Button, Media Gallery Picker & URL input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Category Picture (Device, Media Gallery or URL)
                </label>
                
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingImage ? 'Uploading...' : 'Device Upload'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openMediaGalleryModal('NEW')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Media Gallery 🖼️</span>
                  </button>
                </div>

                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Description (Optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short tagline or summary..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Right Image Preview & Presets */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Image Preview</label>
              <div className="h-36 rounded-2xl bg-[#12131f] border border-dashed border-white/15 overflow-hidden flex items-center justify-center relative group">
                {newImage ? (
                  <>
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <p className="text-xs text-indigo-300 font-bold">Uploading file to server...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-400 font-medium">No image selected yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Click "Upload" or "Media Gallery 🖼️" above</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Picture Presets */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Or pick a sample picture preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setNewImage(img.url)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-white/10 text-[10px] font-semibold transition-all"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addCat}
              disabled={submitting || uploadingImage}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                categoryType === 'SUB' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save {categoryType === 'PARENT' ? 'Parent Category' : 'Subcategory'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Category Modal Card */}
      {editingCat && (
        <div className="rounded-2xl bg-[#1e1f32] border border-amber-500/40 p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" /> Edit Category: {editingCat.name}
            </h3>
            <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => handleEditNameChange(e.target.value)}
                  placeholder="Category name…"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Slug Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Slug *
                  </label>
                  {isEditSlugTouched ? (
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <span>✎ Custom Slug</span>
                      <button
                        type="button"
                        onClick={handleResetEditSlug}
                        className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[9px] font-mono transition-colors"
                        title="Reset auto-generated slug from title"
                      >
                        Reset Auto
                      </button>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ⚡ Auto-generated
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">/</span>
                  <input
                    value={editSlug}
                    onChange={(e) => handleEditSlugChange(e.target.value)}
                    placeholder="e.g. cal-dal-moyda"
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>URL Identifier: <code className="text-amber-300 font-mono">/{editSlug || '...'}</code></span>
                  <span className="text-slate-500 text-[9px]">Lowercase, numbers & hyphens</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Parent Category</label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Main Parent Category (No Parent)</option>
                  {mainParentCategories
                    .filter((p) => p.id !== editingCat.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>Subcategory of: {p.name}</option>
                    ))}
                </select>
              </div>

              {/* Direct Upload Button & URL input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Category Picture (Device, Media Gallery or URL)
                </label>
                
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingImage ? 'Uploading...' : 'Device Upload'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openMediaGalleryModal('EDIT')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Media Gallery 🖼️</span>
                  </button>
                </div>

                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short tagline or summary..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Right Image Preview & Presets */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Image Preview</label>
              <div className="h-36 rounded-2xl bg-[#12131f] border border-dashed border-white/15 overflow-hidden flex items-center justify-center relative">
                {editImage ? (
                  <>
                    <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                        <p className="text-xs text-amber-300 font-bold">Uploading file to server...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-400 font-medium">No picture set for this category</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Picture Presets */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Or pick a sample picture preset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setEditImage(img.url)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-600/30 text-slate-300 hover:text-amber-200 border border-white/10 text-[10px] font-semibold transition-all"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setEditingCat(null)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={updateCat}
              disabled={editSubmitting || uploadingImage}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Update Category
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parent categories & subcategories…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e1f32] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Nested Parent & Subcategory Hierarchy View with Drag & Drop */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-[#1e1f32] border border-white/5" />
          ))}
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1e1f32] border border-white/10 text-center text-slate-400 space-y-2">
          <Tag className="w-10 h-10 mx-auto opacity-40 text-indigo-400" />
          <p className="font-bold text-sm">No parent categories found</p>
          <p className="text-xs text-slate-500">Click "Add Parent Category" above to create your first main category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredParents.map((parent, parentIndex) => {
            const children = subCategoriesList
              .filter((sub) => sub.parentId === parent.id)
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

            const childProdSum = children.reduce((acc, child) => acc + (child._count?.products ?? child.products ?? 0), 0);
            const parentProductCount = (parent._count?.products ?? parent.products ?? 0) + childProdSum;
            const parentImg = parent.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';

            const isParentDragging = draggedParentIndex === parentIndex;
            const isParentDragOver = dragOverParentIndex === parentIndex;

            return (
              <div
                key={parent.id}
                draggable
                onDragStart={(e) => handleParentDragStart(e, parentIndex)}
                onDragOver={(e) => handleParentDragOver(e, parentIndex)}
                onDrop={(e) => handleParentDrop(e, parentIndex, filteredParents)}
                onDragEnd={() => {
                  setDraggedParentIndex(null);
                  setDragOverParentIndex(null);
                }}
                className={`rounded-3xl bg-[#1e1f32] border overflow-hidden shadow-2xl transition-all duration-200 ${
                  isParentDragging
                    ? 'opacity-40 border-dashed border-indigo-500 scale-[0.99]'
                    : isParentDragOver
                    ? 'ring-2 ring-indigo-500 border-indigo-400 scale-[1.01]'
                    : 'border-white/10 hover:border-indigo-500/30'
                }`}
              >
                {/* Parent Category Header Banner */}
                <div className="relative p-4 sm:p-5 bg-gradient-to-r from-[#181928] via-[#1a1c30] to-[#1e1f32] border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Grip Handle */}
                    <div 
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors shrink-0"
                      title="Click & Drag to reorder category"
                    >
                      <GripVertical className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-white/15 shrink-0 shadow-lg">
                      <img src={parentImg} alt={parent.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          📁 Main Parent Category
                        </span>
                        <span className="text-xs text-slate-400 font-mono">/{parent.slug}</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white mt-0.5 truncate">{parent.name}</h2>
                      {parent.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{parent.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Add Subcategory button & Reorder / Popular */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePopular(parent)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                        parent.isPopular !== false
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                      title="Toggle Popular status on homepage"
                    >
                      <Star className={`w-3.5 h-3.5 ${parent.isPopular !== false ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{parent.isPopular !== false ? 'Popular ★' : 'Standard'}</span>
                    </button>

                    <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
                      <button
                        type="button"
                        onClick={() => moveCategory(parent, 'up', filteredParents)}
                        disabled={filteredParents.indexOf(parent) === 0}
                        className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-colors"
                        title="Move Up in homepage order"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(parent, 'down', filteredParents)}
                        disabled={filteredParents.indexOf(parent) === filteredParents.length - 1}
                        className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-colors"
                        title="Move Down in homepage order"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => openAddForParent(parent)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Sub
                    </button>
                    <button
                      onClick={() => handleEditClick(parent)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 transition-colors"
                      title="Edit Parent Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {parentProductCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => alert(`⚠️ Deletion Blocked!\n\n"${parent.name}" is currently in use by ${parentProductCount} active product(s). Please reassign or delete those products first.`)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                        title="Cannot delete: Category is in use by active products"
                      >
                        <Lock className="w-4 h-4 text-slate-500" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeletingCat(parent)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 transition-colors"
                        title="Delete Parent Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories Container under this Parent */}
                <div className="p-4 sm:p-5 bg-[#171827]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-purple-400" />
                      Subcategories under "{parent.name}" ({children.length})
                    </span>
                    <span className="text-[10px] text-purple-300/70 font-semibold">
                      ✋ Drag & drop subcategory cards to re-order
                    </span>
                  </div>

                  {children.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
                      <p className="text-xs text-slate-400">No subcategories created under "{parent.name}" yet.</p>
                      <button
                        onClick={() => openAddForParent(parent)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create first subcategory
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {children.map((sub) => {
                        const subImg = sub.image || parentImg;
                        const subProdCount = sub._count?.products ?? sub.products ?? 0;
                        const isSubDragging = draggedSubId === sub.id;
                        const isSubDragOver = dragOverSubId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            draggable
                            onDragStart={(e) => handleSubDragStart(e, sub.id)}
                            onDragOver={(e) => handleSubDragOver(e, sub.id)}
                            onDrop={(e) => handleSubDrop(e, sub.id, children)}
                            onDragEnd={() => {
                              setDraggedSubId(null);
                              setDragOverSubId(null);
                            }}
                            className={`rounded-2xl bg-[#1e1f32] border p-3.5 transition-all flex flex-col justify-between space-y-3 group shadow ${
                              isSubDragging
                                ? 'opacity-40 border-dashed border-purple-500 scale-95'
                                : isSubDragOver
                                ? 'ring-2 ring-purple-500 border-purple-400 scale-[1.02]'
                                : 'border-white/10 hover:border-purple-500/40'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Subcategory Drag Handle */}
                              <div className="p-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0">
                                <GripVertical className="w-4 h-4 text-purple-400/70" />
                              </div>

                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                                <img src={subImg} alt={sub.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">🏷️ Subcategory</span>
                                <h4 className="font-bold text-white text-xs truncate group-hover:text-purple-300 transition-colors">
                                  {sub.name}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-mono block truncate">/{sub.slug}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-bold text-[11px] text-purple-300">
                                <Package className="w-3.5 h-3.5 text-purple-400" /> {subProdCount} items
                              </span>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveCategory(sub, 'up', children)}
                                    disabled={children.indexOf(sub) === 0}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveCategory(sub, 'down', children)}
                                    disabled={children.indexOf(sub) === children.length - 1}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleEditClick(sub)}
                                  className="font-bold text-amber-400 hover:text-amber-300 hover:underline text-[11px]"
                                >
                                  Edit
                                </button>

                                {subProdCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => alert(`⚠️ Deletion Blocked!\n\n"${sub.name}" is currently assigned to ${subProdCount} active product(s). It cannot be deleted until those products are reassigned or deleted.`)}
                                    className="font-bold text-slate-500 flex items-center gap-1 cursor-not-allowed text-[11px]"
                                    title="Cannot delete: Subcategory in use by products"
                                  >
                                    <Lock className="w-3 h-3 text-slate-500" /> Locked
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingCat(sub)}
                                    className="font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors flex items-center gap-1 text-[11px]"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f32] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Delete Category?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{deletingCat.name}"</strong>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingCat(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Gallery Selection Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f32] border border-pink-500/40 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-[#171827] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Select Photo from Media Gallery</h3>
                  <p className="text-xs text-slate-400">Click any uploaded image to set it as the category picture</p>
                </div>
              </div>
              <button
                onClick={() => setShowMediaModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery Search */}
            <div className="p-4 bg-[#141524] border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="Search media files by name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e1f32] border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Gallery Content */}
            <div className="p-5 flex-1 overflow-y-auto min-h-[300px]">
              {loadingGallery ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  <p className="text-xs">Loading media gallery images...</p>
                </div>
              ) : galleryList.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <ImageIcon className="w-10 h-10 opacity-30 text-pink-400" />
                  <p className="text-xs font-bold">No media images uploaded yet</p>
                  <p className="text-[11px] text-slate-500">Go to Media Gallery tab to upload photos from your PC</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {galleryList
                    .filter((m) => !gallerySearch || m.filename?.toLowerCase().includes(gallerySearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.filename}
                        onClick={() => handleSelectMedia(item.url)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-[#141522] border border-white/10 hover:border-pink-500 hover:ring-2 hover:ring-pink-500/50 cursor-pointer transition-all shadow-md"
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                          <span className="text-[10px] font-bold text-white truncate block">{item.filename}</span>
                          <span className="text-[9px] text-pink-300 font-extrabold flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Select Picture
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#171827] border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total {galleryList.length} media photos available
              </span>
              <button
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
