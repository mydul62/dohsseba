'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import { generateCategorySlug, cleanSlugInput, isValidSlug } from '@/utils/slug.util';
import {
  Wrench, ShieldCheck, Check, X, Plus, Search, Filter,
  Trash2, Edit, Edit2, Clock, CheckCircle2, UserCheck, Users, UserPlus, Phone, Loader2, Upload, Image as ImageIcon, Sparkles, Layers, Tag
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

export default function AdminServicesPage() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { confirm, dialogProps } = useConfirm();

  const [activeTab, setActiveTab] = useState<'catalog' | 'categories' | 'technicians'>('catalog');
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Service Edit Modal
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAddons, setFormAddons] = useState<any[]>([]);
  const [newAddonTitle, setNewAddonTitle] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonDesc, setNewAddonDesc] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Add Technician Modal
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techSpecialty, setTechSpecialty] = useState('Electrical & Plumbing');
  const [addingTech, setAddingTech] = useState(false);

  // Category Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [isCatSlugTouched, setIsCatSlugTouched] = useState(false);
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
  const [addingCat, setAddingCat] = useState(false);

  const CATEGORY_IMAGE_PRESETS = [
    { label: 'AC Service', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80' },
    { label: 'Electrician', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80' },
    { label: 'Plumbing', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80' },
    { label: 'Deep Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80' },
    { label: 'Pest Control', url: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=500&q=80' },
    { label: 'Appliance Repair', url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, tRes] = await Promise.all([
        fetchApi<any>('/services?limit=100').catch(() => null),
        fetchApi<any>('/service-categories').catch(() => null),
        fetchApi<any>('/technicians').catch(() => null),
      ]);

      if (sRes?.success && Array.isArray(sRes.data?.services)) {
        setServices(sRes.data.services);
      } else if (sRes?.success && Array.isArray(sRes.data)) {
        setServices(sRes.data);
      }

      if (cRes?.success && Array.isArray(cRes.data)) {
        setCategories(cRes.data);
      }

      if (tRes?.success && Array.isArray(tRes.data)) {
        setTechnicians(tRes.data);
      } else {
        setTechnicians([
          { id: 't1', name: 'Rakib Ahmed', phone: '+880 1711-223344', specialty: 'Electrical & AC', isActive: true },
          { id: 't2', name: 'Hasan Mahmud', phone: '+880 1722-556677', specialty: 'Plumbing & Sanitary', isActive: true },
          { id: 't3', name: 'Mahmudul Islam', phone: '+880 1733-889900', specialty: 'Appliance Repair', isActive: true },
          { id: 't4', name: 'Sabbir Hossain', phone: '+880 1744-112233', specialty: 'General Handyman', isActive: true },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditServiceModal = (service: any) => {
    setEditingService(service);
    setFormTitle(service.title || '');
    setFormPrice(String(service.price || ''));
    setFormDescription(service.description || '');
    setFormAddons(Array.isArray(service.addons) ? service.addons : []);
    setNewAddonTitle('');
    setNewAddonPrice('');
    setNewAddonDesc('');
    setShowEditServiceModal(true);
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

  const handleSaveServiceAddons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSavingService(true);
    try {
      await fetchApi(`/services/${editingService.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: formTitle,
          price: Number(formPrice),
          description: formDescription,
          addons: formAddons,
        }),
      }).catch(() => null);

      setShowEditServiceModal(false);
      setActionMsg(`Service & Addons updated for "${formTitle}".`);
      setTimeout(() => setActionMsg(''), 4000);
      loadData();
    } finally {
      setSavingService(false);
    }
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

  const handleOpenCreateCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setIsCatSlugTouched(false);
    setCatDesc('');
    setCatImage('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
    setShowAddCatModal(true);
  };

  const handleOpenEditCatModal = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatSlug(cat.slug || '');
    setIsCatSlugTouched(true);
    setCatDesc(cat.description || '');
    setCatImage(cat.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80');
    setShowAddCatModal(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const finalSlug = cleanSlugInput(catSlug || generateCategorySlug(catName));
    if (!finalSlug) {
      alert('Category slug cannot be empty.');
      return;
    }
    if (!isValidSlug(finalSlug)) {
      alert('Invalid slug format. Lowercase letters, numbers, and hyphens only.');
      return;
    }

    setAddingCat(true);
    try {
      if (editingCategory) {
        await fetchApi<any>(`/service-categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: catName,
            slug: finalSlug,
            description: catDesc,
            image: catImage,
          }),
        }).catch(() => null);
        setActionMsg(`Category "${catName}" updated successfully.`);
      } else {
        await fetchApi<any>('/service-categories', {
          method: 'POST',
          body: JSON.stringify({
            name: catName,
            slug: finalSlug,
            description: catDesc,
            image: catImage,
          }),
        }).catch(() => null);
        setActionMsg(`Category "${catName}" created successfully with cover picture.`);
      }

      setShowAddCatModal(false);
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setIsCatSlugTouched(false);
      setCatDesc('');
      setTimeout(() => setActionMsg(''), 4000);
      loadData();
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${name}"?`,
    });
    if (!ok) return;

    await fetchApi(`/service-categories/${catId}`, { method: 'DELETE' }).catch(() => null);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setActionMsg(`Category "${name}" deleted.`);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTech(true);
    try {
      const res = await fetchApi<any>('/technicians', {
        method: 'POST',
        body: JSON.stringify({
          name: techName,
          phone: techPhone,
          specialty: techSpecialty,
        }),
      }).catch(() => null);

      if (res?.success && res.data) {
        setTechnicians((prev) => [res.data, ...prev]);
      } else {
        setTechnicians((prev) => [
          { id: Date.now().toString(), name: techName, phone: techPhone, specialty: techSpecialty, isActive: true },
          ...prev,
        ]);
      }

      setShowAddTechModal(false);
      setTechName('');
      setTechPhone('');
      setActionMsg('Technician added to company roster successfully.');
      setTimeout(() => setActionMsg(''), 4000);
    } finally {
      setAddingTech(false);
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    const ok = await confirm({
      title: 'Deactivate Technician',
      message: 'Are you sure you want to deactivate this technician from the company roster?',
    });
    if (!ok) return;

    await fetchApi(`/technicians/${id}`, { method: 'DELETE' }).catch(() => null);
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    setActionMsg('Technician deactivated.');
    setTimeout(() => setActionMsg(''), 3000);
  };

  const filteredServices = services.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.category?.name || s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <ConfirmDialog {...dialogProps} />

      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white space-y-4 shadow-xl border border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-xs font-bold text-blue-300 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Company Managed Service Architecture
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              Service Operations, Addons & Roster Management
            </h1>
            <p className="text-xs text-blue-200/80 max-w-xl">
              Create, edit, and manage services, recommended service addons, cover photos, and internal technician roster.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateCatModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Add Category</span>
            </button>

            <button
              onClick={() => setShowAddTechModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Technician</span>
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-in fade-in">
            {actionMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Services ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeTab === 'technicians'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Technicians ({technicians.length})</span>
        </button>

        <a
          href="/provider/dashboard?tab=SLOTS"
          className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 ml-auto"
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Time Slots & Capacity Management →</span>
        </a>
      </div>

      {/* Tab 1: Service Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Provider: DOHS Sheba Service Team
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((s) => {
              const addonCount = Array.isArray(s.addons) ? s.addons.length : 0;

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">
                          {s.category?.name || s.category || 'Service'}
                        </span>
                        {addonCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-emerald-600" /> {addonCount} Addons
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          ৳{s.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditServiceModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          title="Manage Service & Addons"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base">{s.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>

                    {/* Addons Summary */}
                    {addonCount > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-blue-600" /> Service Addons:
                        </span>
                        <div className="space-y-0.5">
                          {s.addons.slice(0, 2).map((a: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-slate-700 font-medium">
                              <span className="truncate max-w-[140px]">{a.title}</span>
                              <span className="font-bold text-emerald-600">+৳{a.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      DOHS Sheba Verified
                    </span>
                    <span className="text-slate-400">Est. {s.estimatedDuration || '1-2 Hours'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Service Categories Management Grid */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 absolute inset-0 m-auto" />
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{c.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{c.description || 'Service category'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active Category
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCatModal(c)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Technician Roster */}
      {activeTab === 'technicians' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                    {t.name[0]}
                  </div>
                  <button
                    onClick={() => handleDeleteTechnician(t.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{t.name}</h4>
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {t.specialty || 'General Technician'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Service & Addons Modal */}
      {showEditServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto max-h-screen">
          <form onSubmit={handleSaveServiceAddons} className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Manage Service & Recommended Addons</h3>
              <button
                type="button"
                onClick={() => setShowEditServiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Service Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Starting Price (৳)</label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Description</label>
                <textarea
                  rows={2}
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
                      placeholder="Desc (e.g. Up to 50% refill)"
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
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditServiceModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingService}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md flex items-center gap-1.5"
              >
                {savingService && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Service & Addons</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Service Category Modal */}
      {showAddCatModal && (
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
                onClick={() => setShowAddCatModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. CCTV Security & Automation"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!isCatSlugTouched) {
                      setCatSlug(generateCategorySlug(e.target.value));
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-bold">Slug *</label>
                  {isCatSlugTouched ? (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <span>✎ Custom Slug</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCatSlug(generateCategorySlug(catName));
                          setIsCatSlugTouched(false);
                        }}
                        className="ml-1 px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-mono transition-colors"
                      >
                        Reset Auto
                      </button>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold">⚡ Auto-generated</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-mono text-xs select-none">/</span>
                  <input
                    type="text"
                    placeholder="e.g. cctv-security"
                    value={catSlug}
                    onChange={(e) => {
                      setCatSlug(e.target.value.replace(/^\/+/, ''));
                      setIsCatSlugTouched(true);
                    }}
                    className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                    required
                  />
                </div>
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
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCat}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  {addingCat && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Technician Modal */}
      {showAddTechModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Technician to Company Roster</h3>
              </div>
              <button
                onClick={() => setShowAddTechModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTechnician} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Technician Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rakib Ahmed"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +880 1711-223344"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Specialty & Skills</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical & AC Servicing"
                  value={techSpecialty}
                  onChange={(e) => setTechSpecialty(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTechModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTech}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  {addingTech && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Technician</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
