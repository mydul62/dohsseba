'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, uploadMultipleImagesApi, uploadSingleImageApi } from '@/lib/api-client';
import {
  Save, X, Image as ImageIcon, Tag, Package, DollarSign,
  Truck, Globe, Star, AlertTriangle, Plus, Trash2, Upload,
  ChevronDown, Info, Loader2, ArrowLeft, Eye, EyeOff, Sparkles,
  Layers, CheckCircle2, Sliders, ExternalLink
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  tags: string;
  categoryId: string;
  subCategoryId: string;
  sku: string;
  barcode: string;
  price: string;
  salePrice: string;
  costPrice: string;
  discount: string;
  stock: string;
  lowStockAlert: string;
  unit: string;
  unitAmount: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  images: string[];
  imageInput: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  isVisible: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  videoUrl: string;
  relatedProducts: RelatedProduct[];
}

interface ProductFormProps {
  mode: 'add' | 'edit';
  productId?: string;
  initialData?: any;
}

const DEFAULT: ProductFormData = {
  name: '',
  description: '',
  brand: '',
  tags: '',
  categoryId: '',
  subCategoryId: '',
  sku: '',
  barcode: '',
  price: '',
  salePrice: '',
  costPrice: '',
  discount: '',
  stock: '',
  lowStockAlert: '10',
  unit: 'kg',
  unitAmount: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  images: [],
  imageInput: '',
  metaTitle: '',
  metaDescription: '',
  slug: '',
  status: 'ACTIVE',
  isVisible: true,
  isFeatured: false,
  isFlashSale: false,
  videoUrl: '',
  relatedProducts: [],
};

export function ProductForm({ mode, productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(DEFAULT);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general');

  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);

  const [showAddRelatedModal, setShowAddRelatedModal] = useState(false);

  // 🖼️ Media Picker Modal State
  const [showMediaPickerModal, setShowMediaPickerModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ filename: string; url: string; size: number }[]>([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ProductFormData, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // Load Categories & Brands & Seller Products
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [catRes, brandRes, prodRes] = await Promise.allSettled([
          fetchApi<any>('/product-categories'),
          fetchApi<any>('/brands'),
          fetchApi<any>('/products/seller/my-products'),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.data)) {
          setCategories(catRes.value.data);
        }

        let dbBrands: any[] = [];
        if (brandRes.status === 'fulfilled' && brandRes.value?.success && Array.isArray(brandRes.value.data)) {
          dbBrands = brandRes.value.data;
        }

        let localBrands: any[] = [];
        try {
          const saved = localStorage.getItem('dohssheba_seller_brands');
          if (saved) {
            localBrands = JSON.parse(saved);
          }
        } catch (_) {}

        const map = new Map();
        [...localBrands, ...dbBrands].forEach((b) => {
          if (b && b.name) map.set(b.name.trim().toLowerCase(), b);
        });
        setBrands(Array.from(map.values()));

        if (prodRes.status === 'fulfilled' && prodRes.value?.success && Array.isArray(prodRes.value.data)) {
          setAvailableProducts(prodRes.value.data);
        }
      } catch (err) {
        console.error('Init data load error:', err);
      }
    };
    loadInitData();
  }, []);

  // Populate initial data when editing
  useEffect(() => {
    if (initialData) {
      const matchedCat = categories.find((c) => c.id === initialData.categoryId);
      let pId = initialData.categoryId || '';
      let subId = '';

      if (matchedCat) {
        if (matchedCat.parentId) {
          pId = matchedCat.parentId;
          subId = matchedCat.id;
        } else {
          pId = matchedCat.id;
        }
      }

      setForm({
        ...DEFAULT,
        name:            initialData.name           || '',
        description:     initialData.description    || '',
        brand:           initialData.brand          || '',
        categoryId:      pId,
        subCategoryId:   subId,
        price:           String(initialData.price   || ''),
        salePrice:       String(initialData.salePrice || ''),
        costPrice:       String(initialData.costPrice || ''),
        discount:        String(initialData.discount  || ''),
        stock:           String(initialData.stock    || ''),
        unit:            initialData.unit           || 'kg',
        unitAmount:      initialData.unitAmount !== undefined && initialData.unitAmount !== null ? String(initialData.unitAmount) : (initialData.amount !== undefined && initialData.amount !== null ? String(initialData.amount) : ''),
        images:          Array.isArray(initialData.images) && initialData.images.length > 0
                           ? initialData.images
                           : initialData.image ? [initialData.image] : [],
        slug:            initialData.slug           || '',
        sku:             initialData.sku            || '',
        status:          initialData.isActive === false ? 'DRAFT' : 'ACTIVE',
        isVisible:       initialData.isActive !== false,
        isFeatured:      !!initialData.isFeatured,
        isFlashSale:     !!initialData.isFlashSale,
        relatedProducts: Array.isArray(initialData.relatedProducts) ? initialData.relatedProducts : [],
      });
    }
  }, [initialData, categories]);

  // Handle Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingImages(true);
      const urls = await uploadMultipleImagesApi(files);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
    } catch (err: any) {
      alert(err?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addImageUrl = () => {
    if (!form.imageInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, prev.imageInput.trim()],
      imageInput: '',
    }));
  };

  // Name change auto slug
  const handleNameChange = (val: string) => {
    set('name', val);
    if (mode === 'add') {
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      set('slug', generated);
    }
  };

  // Add related product
  const handleAddRelated = (prod: any) => {
    if (form.relatedProducts.some((r) => r.id === prod.id)) return;
    const item: RelatedProduct = {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200',
    };
    setForm((prev) => ({
      ...prev,
      relatedProducts: [...prev.relatedProducts, item],
    }));
    setShowAddRelatedModal(false);
  };

  const removeRelated = (id: string) => {
    setForm((prev) => ({
      ...prev,
      relatedProducts: prev.relatedProducts.filter((r) => r.id !== id),
    }));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('Please specify a valid price.'); return; }

    setError('');
    setSuccess('');
    setSaving(true);

    const finalCategoryId = form.subCategoryId || form.categoryId;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      brand: form.brand,
      categoryId: finalCategoryId || undefined,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      price: Number(form.price),
      discount: form.discount ? Number(form.discount) : 0,
      stock: form.stock ? Number(form.stock) : 0,
      unit: form.unit,
      unitAmount: form.unitAmount !== '' && form.unitAmount !== undefined && form.unitAmount !== null ? Number(form.unitAmount) : undefined,
      images: form.images.length > 0 ? form.images : ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'],
      slug: form.slug.trim() || undefined,
      isActive: form.status !== 'DRAFT' && form.isVisible !== false,
      isFeatured: form.isFeatured,
      isFlashSale: form.isFlashSale,
    };

    try {
      if (mode === 'edit' && productId) {
        await fetchApi(`/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Product updated successfully!');
      } else {
        await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Product published successfully!');
      }
      setTimeout(() => router.push('/seller/dashboard/products'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to save product. Is backend server connected?');
    } finally {
      setSaving(false);
    }
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const subCategoriesList = categories.filter((c) => c.parentId === form.categoryId);

  const mainCoverImage = form.images[0] || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-[1720px] mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ── Top Header Navigation Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/seller/dashboard/products')}
            className="p-2.5 rounded-2xl bg-[#1e1f32] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-black text-white text-xl">
              {mode === 'add' ? 'Add Product' : 'Edit Product'}
            </h1>
            <p className="text-xs text-slate-400">Manage catalog information, media gallery, pricing and visibility</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { set('status', 'DRAFT'); set('isVisible', false); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#1e1f32] text-slate-300 text-xs font-bold hover:bg-white/5 transition-all shadow"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-60 active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : mode === 'add' ? 'Publish Product' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ══ Master 2-Column Dashboard Layout (Matches User Mockup Exactly) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Media Gallery, Visibility, Preview, Related Items) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Media Gallery Box (Cover + 4-Grid Thumbnails) */}
          <div className="p-5 rounded-3xl bg-[#1e1f32] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Media Gallery
              </h2>
              <span className="text-[11px] text-slate-400 font-semibold">{form.images.length} uploaded</span>
            </div>

            {/* Gallery Layout Grid */}
            <div className="grid grid-cols-12 gap-3">
              {/* Large Cover Image Card */}
              <div className="col-span-7 relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group shadow-lg">
                {mainCoverImage ? (
                  <>
                    <img src={mainCoverImage} alt="Cover" className="w-full h-full object-cover" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/70 backdrop-blur-md text-white border border-white/20 shadow">
                      Cover
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(0)}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No Cover Image</p>
                    <p className="text-[10px] text-slate-500 mt-1">First image becomes product cover</p>
                  </div>
                )}
              </div>

              {/* 4-Thumbnail Grid (Right Side) */}
              <div className="col-span-5 grid grid-cols-2 gap-2">
                {[1, 2, 3].map((slotIndex) => {
                  const img = form.images[slotIndex];
                  return (
                    <div key={slotIndex} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/10 group shadow">
                      {img ? (
                        <>
                          <img src={img} alt={`Thumb ${slotIndex}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(slotIndex)}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <ImageIcon className="w-4 h-4 text-slate-700" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Upload Button (+) Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="aspect-square rounded-xl border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 flex flex-col items-center justify-center gap-1 transition-all text-indigo-400 hover:text-indigo-300"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">{uploadingImages ? '...' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Quick URL Input & Media Picker Launcher */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowMediaPickerModal(true);
                  if (galleryImages.length === 0) {
                    setLoadingGallery(true);
                    fetchApi<{ total: number; media: any[] }>('/upload/gallery')
                      .then((res) => {
                        if (res.success && Array.isArray(res.data?.media)) {
                          setGalleryImages(res.data.media);
                        }
                      })
                      .finally(() => setLoadingGallery(false));
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all active:scale-98 border border-white/10"
              >
                <ImageIcon className="w-4 h-4 text-pink-200 animate-pulse" />
                <span>🖼️ Add from Media Gallery (Select 500+ Images)</span>
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.imageInput}
                  onChange={(e) => set('imageInput', e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#12131f] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* 2. Visibility Card */}
          <div className="p-5 rounded-3xl bg-[#1e1f32] border border-white/10 shadow-2xl space-y-3">
            <div>
              <h3 className="font-bold text-white text-sm">Visibility</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                You can change the visibility of this product for customers
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                {form.isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                {form.isVisible ? 'Visible to Customers' : 'Hidden from Store'}
              </span>
              <button
                type="button"
                onClick={() => set('isVisible', !form.isVisible)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.isVisible ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.isVisible ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Preview Card */}
          <div className="p-5 rounded-3xl bg-[#1e1f32] border border-white/10 shadow-2xl space-y-3">
            <div>
              <h3 className="font-bold text-white text-sm">Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Want to see how your product will look like in store?
              </p>
            </div>
            <a
              href={form.slug ? `/services/shopping/product/${form.slug}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow"
            >
              <span>Preview Product Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </a>
          </div>

          {/* 4. Related Items Card */}
          <div className="p-5 rounded-3xl bg-[#1e1f32] border border-white/10 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Related Items</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add related items to cross-sell with this product</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRelatedModal(true)}
                className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                title="Add Related Product"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of Linked Related Products */}
            {form.relatedProducts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#12131f] border border-dashed border-white/10 text-center text-xs text-slate-500">
                No related items linked yet
              </div>
            ) : (
              <div className="space-y-2">
                {form.relatedProducts.map((rel) => (
                  <div key={rel.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#12131f] border border-white/10 group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                        <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{rel.name}</p>
                        <p className="text-[11px] font-extrabold text-indigo-300">৳{rel.price}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRelated(rel.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Right Column (Main Form Details Card with Tabs) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main Product Details Box */}
          <div className="p-6 rounded-3xl bg-[#1e1f32] border border-white/10 shadow-2xl space-y-5">
            {/* Header + Status Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="font-black text-white text-base">Product Details</h2>
                <p className="text-xs text-slate-400">Key info to describe and display your product</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  form.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  Status: {form.status}
                </span>
              </div>
            </div>

            {/* Segmented Tab Switcher (General | Advanced) */}
            <div className="p-1 rounded-2xl bg-[#12131f] border border-white/10 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'general'
                    ? 'bg-[#1e1f32] text-white shadow border border-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                General Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'advanced'
                    ? 'bg-[#1e1f32] text-white shadow border border-white/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Advanced & Shipping
              </button>
            </div>

            {/* General Tab Fields */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Product Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Natural Glow Face Moisturizer, Fresh Broiler Chicken..."
                    className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                {/* 2. Status & Brand Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => set('status', e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ACTIVE">Active (Published)</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Brand <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.brand}
                      onChange={(e) => set('brand', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select the brand name</option>
                      {brands.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Category & Subcategory Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Main Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => {
                        const pId = e.target.value;
                        set('categoryId', pId);
                        set('subCategoryId', '');
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">Select main category</option>
                      {parentCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          📁 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Subcategory
                    </label>
                    <select
                      value={form.subCategoryId}
                      onChange={(e) => set('subCategoryId', e.target.value)}
                      disabled={!form.categoryId}
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!form.categoryId ? 'Select main category first' : 'Select subcategory'}
                      </option>
                      {subCategoriesList.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          🏷️ {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Price & Discount Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Price (৳) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="e.g. 290 BDT"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discount}
                        onChange={(e) => set('discount', e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                {/* 5. Stock & Measurement Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => set('stock', e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.unitAmount}
                      onChange={(e) => set('unitAmount', e.target.value)}
                      placeholder="e.g. 1, 5, 500, 2, 750"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Unit Type
                    </label>
                    <select
                      value={form.unit}
                      onChange={(e) => set('unit', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      {['kg', 'gram', 'liter', 'ml', 'piece', 'dozen', 'pack', 'box'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Write a short description highlighting key benefits, origin, and features..."
                    className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Advanced Tab Fields */}
            {activeTab === 'advanced' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">SKU Code</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => set('sku', e.target.value)}
                      placeholder="e.g. DH-MILK-001"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Barcode</label>
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => set('barcode', e.target.value)}
                      placeholder="e.g. 8901234567890"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Cost Price (৳)</label>
                    <input
                      type="number"
                      value={form.costPrice}
                      onChange={(e) => set('costPrice', e.target.value)}
                      placeholder="Supplier purchase cost"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">URL Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => set('slug', e.target.value)}
                      placeholder="product-url-slug"
                      className="w-full px-4 py-3 rounded-xl bg-[#12131f] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs text-indigo-300"
                    />
                  </div>
                </div>

                {/* Featured / Flash Sale toggles */}
                <div className="p-4 rounded-2xl bg-[#12131f] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white block">Promotional Badges</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Featured Product (Shows on Homepage)</span>
                    <button
                      type="button"
                      onClick={() => set('isFeatured', !form.isFeatured)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${form.isFeatured ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Flash Sale Item</span>
                    <button
                      type="button"
                      onClick={() => set('isFlashSale', !form.isFlashSale)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${form.isFlashSale ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${form.isFlashSale ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Related Products Picker Modal */}
      {showAddRelatedModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f32] border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Add Related Item</h3>
              <button type="button" onClick={() => setShowAddRelatedModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {availableProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No other products available in catalog</p>
              ) : (
                availableProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddRelated(p)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#12131f] hover:bg-indigo-600/20 border border-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <p className="text-[11px] text-indigo-300 font-extrabold">৳{p.price}</p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🖼️ Media Picker Modal (Select from 500+ Uploaded Images) */}
      {showMediaPickerModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#1e1f32] border border-pink-500/30 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#181928]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    Media Gallery Picker
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {galleryImages.length} Files
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Click to select one or multiple images to attach to this product</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMediaPickerModal(false);
                  setSelectedGalleryUrls([]);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Grid */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#141522]">
              {loadingGallery ? (
                <div className="min-h-[250px] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold">Fetching your 500+ uploaded media files...</p>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-600 mb-1" />
                  <p className="text-xs font-bold text-slate-300">No media files available</p>
                  <p className="text-[11px] text-slate-500">Upload product images via the file upload button first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {galleryImages.map((img) => {
                    const isSelected = selectedGalleryUrls.includes(img.url);
                    return (
                      <div
                        key={img.filename}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGalleryUrls(selectedGalleryUrls.filter((u) => u !== img.url));
                          } else {
                            setSelectedGalleryUrls([...selectedGalleryUrls, img.url]);
                          }
                        }}
                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-pink-500 shadow-lg shadow-pink-500/30 scale-95'
                            : 'border-white/10 hover:border-pink-500/50 hover:scale-102 bg-[#1e1f32]'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Checkbox Tick Overlay */}
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white transition-transform ${
                            isSelected
                              ? 'bg-pink-500 scale-100 shadow-md'
                              : 'bg-black/40 border border-white/30 group-hover:scale-110'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-white/80" />
                          )}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-1 bg-black/70 backdrop-blur-xs truncate text-[9px] text-slate-300 text-center font-mono">
                          {img.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 border-t border-white/10 bg-[#181928] flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold text-slate-300">
                {selectedGalleryUrls.length > 0
                  ? `Selected ${selectedGalleryUrls.length} image(s)`
                  : 'Select images to attach'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaPickerModal(false);
                    setSelectedGalleryUrls([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedGalleryUrls.length === 0}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      images: [...prev.images, ...selectedGalleryUrls],
                    }));
                    setShowMediaPickerModal(false);
                    setSelectedGalleryUrls([]);
                  }}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  Attach ({selectedGalleryUrls.length}) Selected Image(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

