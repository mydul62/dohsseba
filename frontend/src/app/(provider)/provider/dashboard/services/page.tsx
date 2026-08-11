'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  Wrench, Plus, Check, Edit, Trash2, Power, Star, Loader2, X, Upload, Clock,
  Image as ImageIcon, Sparkles, Layers, Tag, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

export default function ProviderServicesPage() {
  const { confirm, dialogProps } = useConfirm();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter & Pagination State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Service Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Service Addons State
  const [formAddons, setFormAddons] = useState<any[]>([]);
  const [newAddonTitle, setNewAddonTitle] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonDesc, setNewAddonDesc] = useState('');

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Wrench');
  const [catImage, setCatImage] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
  const [savingCat, setSavingCat] = useState(false);

  const CATEGORY_IMAGE_PRESETS = [
    { label: 'AC Service', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80' },
    { label: 'Electrician', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80' },
    { label: 'Plumbing', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80' },
    { label: 'Deep Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80' },
    { label: 'Pest Control', url: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500&q=80' },
    { label: 'Appliance Repair', url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80' },
    { label: 'Carpenter', url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&q=80' },
    { label: 'Painting', url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&q=80' },
    { label: 'CCTV Security', url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&q=80' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetchApi<any>('/services?limit=100').catch(() => null),
        fetchApi<any>('/service-categories').catch(() => null),
      ]);

      if (sRes?.success && Array.isArray(sRes.data?.services)) {
        setServices(sRes.data.services);
      } else if (sRes?.success && Array.isArray(sRes.data)) {
        setServices(sRes.data);
      }

      if (cRes?.success && Array.isArray(cRes.data)) {
        setCategories(cRes.data);
        if (cRes.data.length > 0) setFormCategory(cRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Services
  const filteredServices = services.filter((srv) => {
    const categoryName = typeof srv.category === 'object' ? srv.category?.name : (srv.category || '');
    const categoryId = srv.categoryId || srv.category?.id || '';

    // Category Filter
    if (selectedCategory !== 'ALL') {
      const isMatchCat = categoryId === selectedCategory || categoryName.toLowerCase() === selectedCategory.toLowerCase();
      if (!isMatchCat) return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (srv.title || '').toLowerCase().includes(q);
      const matchDesc = (srv.description || '').toLowerCase().includes(q);
      const matchCat = categoryName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Calculate Pagination
  const totalItems = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const getCategoryCount = (catId: string, catName?: string) => {
    if (catId === 'ALL') return services.length;
    return services.filter((s) => {
      const sCatId = s.categoryId || s.category?.id;
      const sCatName = typeof s.category === 'object' ? s.category?.name : s.category;
      return sCatId === catId || (catName && sCatName?.toLowerCase() === catName.toLowerCase());
    }).length;
  };

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormTitle('');
    setFormPrice('');
    setFormDescription('');
    setFormAddons([]);
    setNewAddonTitle('');
    setNewAddonPrice('');
    setNewAddonDesc('');
    if (categories.length > 0) setFormCategory(categories[0].id);
    setShowModal(true);
  };

  const handleOpenEditModal = (service: any) => {
    setEditingService(service);
    setFormTitle(service.title || '');
    setFormPrice(String(service.price || ''));
    setFormDescription(service.description || '');
    setFormCategory(service.categoryId || (categories[0]?.id || ''));
    setFormAddons(Array.isArray(service.addons) ? service.addons : []);
    setNewAddonTitle('');
    setNewAddonPrice('');
    setNewAddonDesc('');
    setShowModal(true);
  };

  const handleOpenCreateCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatImage('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
    setShowCatModal(true);
  };

  const handleOpenEditCatModal = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatDesc(cat.description || '');
    setCatImage(cat.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
    setShowCatModal(true);
  };

  const handleAddAddonItem = () => {
    if (!newAddonTitle || !newAddonPrice) return;
    const addon = {
      id: `add_${Date.now()}`,
      title: newAddonTitle,
      price: Number(newAddonPrice),
      description: newAddonDesc || '',
    };
    setFormAddons((prev) => [...prev, addon]);
    setNewAddonTitle('');
    setNewAddonPrice('');
    setNewAddonDesc('');
  };

  const handleRemoveAddonItem = (index: number) => {
    setFormAddons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCatImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    setSavingCat(true);
    try {
      if (editingCategory) {
        await fetchApi<any>(`/service-categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: catName,
            description: catDesc,
            icon: catIcon,
            image: catImage,
          }),
        }).catch(() => null);
      } else {
        await fetchApi<any>('/service-categories', {
          method: 'POST',
          body: JSON.stringify({
            name: catName,
            description: catDesc,
            icon: catIcon,
            image: catImage,
          }),
        }).catch(() => null);
      }

      setShowCatModal(false);
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      loadData();
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${catName}"?`,
    });
    if (!ok) return;

    setActionLoading(catId);
    try {
      await fetchApi(`/service-categories/${catId}`, { method: 'DELETE' }).catch(() => null);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) return;

    setActionLoading('saving');
    try {
      const payload = {
        title: formTitle,
        price: Number(formPrice),
        description: formDescription,
        categoryId: formCategory,
        addons: formAddons,
      };

      if (editingService) {
        await fetchApi<any>(`/services/${editingService.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }).catch(() => null);
      } else {
        await fetchApi<any>('/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        }).catch(() => null);
      }
      setShowModal(false);
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteService = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Service',
      message: 'Are you sure you want to delete this service?',
    });
    if (!ok) return;

    setActionLoading(id);
    try {
      await fetchApi(`/services/${id}`, { method: 'DELETE' }).catch(() => null);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleServiceStatus = async (service: any) => {
    setActionLoading(service.id);
    try {
      const nextState = service.isActive === false ? true : false;
      await fetchApi(`/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextState }),
      }).catch(() => null);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: nextState } : s))
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <ConfirmDialog {...dialogProps} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-black text-slate-900 text-xl flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" /> DOHS Sheba Service Catalog & Addons Manager
          </h1>
          <p className="text-xs text-slate-500">Create, edit & manage services, service categories, and recommended service addons</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/provider/dashboard?tab=SLOTS"
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Time Slots & Capacity</span>
          </a>

          <button
            type="button"
            onClick={handleOpenCreateCatModal}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Category
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Service
          </button>
        </div>
      </div>

      {/* Category Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services by title or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-2xl bg-slate-100 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> Per Page:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleCategorySelect('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {services.length}
            </span>
          </button>

          {categories.map((c) => {
            const count = getCategoryCount(c.id, c.name);
            const isActive = selectedCategory === c.id;

            return (
              <button
                type="button"
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : paginatedServices.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-2">
          <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="font-extrabold text-lg text-slate-800">No Services Found</p>
          <p className="text-xs text-slate-500">No home maintenance services match your selected category or search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedServices.map((srv) => {
            const categoryName = typeof srv.category === 'object' ? srv.category?.name : (srv.category || 'General Service');
            const isActive = srv.isActive !== false;
            const addonCount = Array.isArray(srv.addons) ? srv.addons.length : 0;

            return (
              <div key={srv.id} className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-extrabold uppercase tracking-wider block w-fit">
                        {categoryName}
                      </span>

                      {addonCount > 0 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-extrabold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-emerald-600" /> {addonCount} Addons
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(srv)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        title="Edit Service & Addons"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv.id)}
                        disabled={actionLoading === srv.id}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{srv.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{srv.description}</p>

                  {/* Addons Summary */}
                  {addonCount > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-600" /> Addon Options ({addonCount}):
                      </span>
                      <div className="space-y-0.5">
                        {srv.addons.slice(0, 2).map((a: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-slate-700 font-medium">
                            <span className="truncate max-w-[150px]">{a.title}</span>
                            <span className="font-bold text-emerald-600">+৳{a.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">
                    ৳{srv.price}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleServiceStatus(srv)}
                    disabled={actionLoading === srv.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{isActive ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-600">
            Showing <span className="text-slate-900 font-extrabold">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="text-slate-900 font-extrabold">{endIndex}</span> of{' '}
            <span className="text-slate-900 font-extrabold">{totalItems}</span> services
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 px-3 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = currentPage === pageNum;

                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-black text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 px-3 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold text-xs flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingService ? 'Edit Service & Addons' : 'Add New Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs font-semibold max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Service Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master AC Jet Wash Servicing"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Base Price (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what this service includes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Service Addons Manager */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 text-xs">
                      Recommended Service Addons ({formAddons.length})
                    </span>
                  </div>
                </div>

                {formAddons.length > 0 && (
                  <div className="space-y-2">
                    {formAddons.map((addon, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block">{addon.title}</span>
                          {addon.description && <p className="text-[10px] text-slate-500">{addon.description}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-emerald-600">+৳{addon.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddonItem(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Add New Service Addon Item:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Addon Title (e.g. Gas Top-Up)"
                      value={newAddonTitle}
                      onChange={(e) => setNewAddonTitle(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Price ৳ (e.g. 800)"
                      value={newAddonPrice}
                      onChange={(e) => setNewAddonPrice(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Desc (e.g. Refill gas)"
                      value={newAddonDesc}
                      onChange={(e) => setNewAddonDesc(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAddonItem}
                    disabled={!newAddonTitle || !newAddonPrice}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Addon to Service
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'saving'}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  {actionLoading === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingService ? 'Update Service' : 'Save Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Service Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingCategory ? 'Edit Service Category' : 'Create Service Category with Picture'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. CCTV Security & Automation"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Security cameras, IP camera & DVR setup"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Picture Uploader */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-bold">Category Picture Uploader</label>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                    {catImage ? (
                      <img src={catImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-slate-700 font-bold block">Picture Live Preview</span>
                    <p className="text-[11px] text-slate-400 font-medium">This photo will display on home page categories carousel.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload Image File from Device</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Or paste image URL (https://...)"
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 font-normal text-[11px]"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Or Select High-Res Cover Preset:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORY_IMAGE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setCatImage(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          catImage === preset.url
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  {savingCat && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
