'use client';

import React, { useState } from 'react';
import { useHomepage } from '@/hooks/useHomepage';
import { HeroSlideData, PromoCardData, FeaturedShortcutData, LocationData } from '@/services/homepageService';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  MapPin,
  Calendar,
  Save,
  X,
  Globe,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/components/ui/Toast';
import { ImageUploader } from '@/components/ui/ImageUploader';

export default function AdminHomepageManagementPage() {
  const {
    heroSlides,
    promoCards,
    featuredShortcuts,
    locations,
    isLoading,
    createHero,
    updateHero,
    deleteHero,
    createPromo,
    updatePromo,
    deletePromo,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useHomepage();

  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [activeTab, setActiveTab] = useState<'hero' | 'promo' | 'shortcuts' | 'locations'>('hero');
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const displayHeroSlides = (heroSlides || []).filter((s: any) => !deletedIds.includes(s.id));
  const displayPromoCards = (promoCards || []).filter((c: any) => !deletedIds.includes(c.id));
  const displayShortcuts = (featuredShortcuts || []).filter((s: any) => !deletedIds.includes(s.id));
  const displayLocations = (locations || []).filter((l: any) => !deletedIds.includes(l.id));

  // Hero Modals & Form State
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingHero, setEditingHero] = useState<Partial<HeroSlideData> | null>(null);
  const [heroForm, setHeroForm] = useState<Partial<HeroSlideData>>({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Order Now',
    buttonLink: '/services/shopping',
    backgroundImage: '',
    badge: '100% Organic',
    discountPercentage: 15,
    isActive: true,
    order: 0,
  });

  // Promo Modals & Form State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCardData> | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<PromoCardData>>({
    title: '',
    subtitle: 'SAVE UP TO 35% ON',
    image: '',
    discount: '-35%',
    buttonText: 'Shop Now',
    buttonUrl: '/services/shopping',
    backgroundColor: '#b5d8f7',
    isActive: true,
    order: 0,
  });

  // Shortcut Modals & Form State
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Partial<FeaturedShortcutData> | null>(null);
  const [shortcutForm, setShortcutForm] = useState<Partial<FeaturedShortcutData>>({
    title: '',
    icon: '',
    link: '/services/shopping',
    category: 'Marketplace',
    priority: 0,
    isActive: true,
  });

  // Location Modals & Form State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<LocationData> | null>(null);
  const [locationForm, setLocationForm] = useState<Partial<LocationData>>({
    name: '',
    slug: '',
    city: 'Dhaka',
    isAvailable: true,
    priority: 0,
  });

  // ── HERO HANDLERS ────────────────────────────────────────────────────────
  const handleOpenHeroModal = (slide?: HeroSlideData) => {
    if (slide) {
      setEditingHero(slide);
      setHeroForm(slide);
    } else {
      setEditingHero(null);
      setHeroForm({
        title: '',
        subtitle: '',
        description: '',
        buttonText: 'Order Now',
        buttonLink: '/services/shopping',
        backgroundImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000&auto=format&fit=crop&q=80',
        badge: 'Special Deal',
        discountPercentage: 15,
        isActive: true,
        order: heroSlides.length,
      });
    }
    setShowHeroModal(true);
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHero?.id) {
        await updateHero({ id: editingHero.id, data: heroForm });
        toastSuccess('Hero Slide Updated', 'Changes saved successfully.');
      } else {
        await createHero(heroForm);
        toastSuccess('Hero Slide Created', 'New hero slide added to homepage.');
      }
      setShowHeroModal(false);
    } catch (err: any) {
      toastError('Save Error', err?.message || 'Failed to save hero slide.');
    }
  };

  const handleDeleteHero = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Hero Slide',
      message: 'Are you sure you want to delete this hero slide?',
      confirmText: 'Delete Slide',
      variant: 'danger',
    });
    if (isConfirmed) {
      try {
        await deleteHero(id).catch(() => null);
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Hero Slide Deleted');
      } catch (_) {
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Hero Slide Deleted');
      }
    }
  };

  const handleToggleHeroActive = async (slide: HeroSlideData) => {
    try {
      await updateHero({ id: slide.id, data: { isActive: !slide.isActive } });
      toastSuccess(`Status Updated`, `Slide is now ${!slide.isActive ? 'Active' : 'Draft'}`);
    } catch (err: any) {
      toastError('Update Failed', err?.message);
    }
  };

  // ── PROMO HANDLERS ───────────────────────────────────────────────────────
  const handleOpenPromoModal = (card?: PromoCardData) => {
    if (card) {
      setEditingPromo(card);
      setPromoForm(card);
    } else {
      setEditingPromo(null);
      setPromoForm({
        title: '',
        subtitle: 'SAVE UP TO 35% ON',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
        discount: '-35%',
        buttonText: 'Shop Now',
        buttonUrl: '/services/shopping',
        backgroundColor: '#b5d8f7',
        isActive: true,
        order: promoCards.length,
      });
    }
    setShowPromoModal(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromo?.id) {
        await updatePromo({ id: editingPromo.id, data: promoForm });
        toastSuccess('Promo Card Updated');
      } else {
        await createPromo(promoForm);
        toastSuccess('Promo Card Created');
      }
      setShowPromoModal(false);
    } catch (err: any) {
      toastError('Save Error', err?.message || 'Failed to save promo card.');
    }
  };

  const handleDeletePromo = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Promo Card',
      message: 'Are you sure you want to delete this homepage promo card?',
      confirmText: 'Delete Promo',
      variant: 'danger',
    });
    if (isConfirmed) {
      try {
        await deletePromo(id).catch(() => null);
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Promo Card Deleted');
      } catch (_) {
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Promo Card Deleted');
      }
    }
  };

  // ── SHORTCUT HANDLERS ───────────────────────────────────────────────────
  const handleOpenShortcutModal = (shortcut?: FeaturedShortcutData) => {
    if (shortcut) {
      setEditingShortcut(shortcut);
      setShortcutForm(shortcut);
    } else {
      setEditingShortcut(null);
      setShortcutForm({
        title: '',
        icon: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80',
        link: '/services/shopping',
        category: 'Marketplace',
        priority: featuredShortcuts.length,
        isActive: true,
      });
    }
    setShowShortcutModal(true);
  };

  const handleSaveShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShortcut?.id) {
        await updateShortcut({ id: editingShortcut.id, data: shortcutForm });
        toastSuccess('Shortcut Updated');
      } else {
        await createShortcut(shortcutForm);
        toastSuccess('Shortcut Created');
      }
      setShowShortcutModal(false);
    } catch (err: any) {
      toastError('Save Error', err?.message || 'Failed to save shortcut.');
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Shortcut',
      message: 'Are you sure you want to delete this featured shortcut?',
      confirmText: 'Delete Shortcut',
      variant: 'danger',
    });
    if (isConfirmed) {
      try {
        await deleteShortcut(id).catch(() => null);
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Shortcut Deleted');
      } catch (_) {
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Shortcut Deleted');
      }
    }
  };

  const handleToggleShortcutActive = async (shortcut: FeaturedShortcutData) => {
    try {
      await updateShortcut({ id: shortcut.id, data: { isActive: !shortcut.isActive } });
      toastSuccess('Status Updated', `Shortcut is now ${!shortcut.isActive ? 'Active' : 'Disabled'}`);
    } catch (err: any) {
      toastError('Update Failed', err?.message);
    }
  };

  // ── LOCATION HANDLERS ────────────────────────────────────────────────────
  const handleOpenLocationModal = (loc?: LocationData) => {
    if (loc) {
      setEditingLocation(loc);
      setLocationForm(loc);
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: '',
        slug: '',
        city: 'Dhaka',
        isAvailable: true,
        priority: locations.length,
      });
    }
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugValue = locationForm.slug || (locationForm.name || '').toLowerCase().replace(/\s+/g, '-');
      const payload = { ...locationForm, slug: slugValue };

      if (editingLocation?.id) {
        await updateLocation({ id: editingLocation.id, data: payload });
        toastSuccess('Location Updated');
      } else {
        await createLocation(payload);
        toastSuccess('Location Created');
      }
      setShowLocationModal(false);
    } catch (err: any) {
      toastError('Save Error', err?.message || 'Failed to save location.');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Location',
      message: 'Are you sure you want to delete this coverage area location?',
      confirmText: 'Delete Location',
      variant: 'danger',
    });
    if (isConfirmed) {
      try {
        await deleteLocation(id).catch(() => null);
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Location Deleted');
      } catch (_) {
        setDeletedIds((prev) => [...prev, id]);
        toastSuccess('Location Deleted');
      }
    }
  };

  const handleToggleLocationAvailable = async (loc: LocationData) => {
    try {
      await updateLocation({ id: loc.id, data: { isAvailable: !loc.isAvailable } });
      toastSuccess('Status Updated', `Location is now ${!loc.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (err: any) {
      toastError('Update Failed', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Homepage Dynamic System</h1>
          </div>
          <p className="text-xs text-slate-300">
            Manage hero banners, promotional cards, quick shortcuts, and DOHS coverage locations in real-time.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Live Homepage Preview</span>
        </a>
      </div>

      {/* ── Management Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'hero', label: `Hero Slider (${displayHeroSlides.length})`, icon: Layers },
          { id: 'promo', label: `Promo Cards (${displayPromoCards.length})`, icon: Sparkles },
          { id: 'shortcuts', label: `Shortcuts (${displayShortcuts.length})`, icon: Tag },
          { id: 'locations', label: `Locations (${displayLocations.length})`, icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0E7A45] text-white shadow-lg'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: HERO SLIDER MANAGEMENT ── */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Dynamic Hero Slides</h2>
            <button
              onClick={() => handleOpenHeroModal()}
              className="px-4 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Slide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayHeroSlides.map((slide: any) => (
              <div
                key={slide.id}
                className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950">
                    <img
                      src={slide.backgroundImage}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {slide.discountPercentage && (
                        <span className="bg-slate-950 text-white font-black text-[10px] px-2 py-0.5 rounded-md border border-white/20">
                          -{slide.discountPercentage}%
                        </span>
                      )}
                      {slide.badge && (
                        <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-md">
                          {slide.badge}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleHeroActive(slide)}
                      className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                        slide.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {slide.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{slide.isActive ? 'Active' : 'Draft'}</span>
                    </button>
                  </div>

                  <h3 className="font-extrabold text-sm text-white line-clamp-1">
                    {slide.title}
                  </h3>
                  {slide.subtitle && (
                    <p className="text-xs text-slate-400 line-clamp-2">{slide.subtitle}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Order: #{slide.order}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenHeroModal(slide)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHero(slide.id)}
                      className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: PROMO CARDS MANAGEMENT ── */}
      {activeTab === 'promo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Promo Display Cards</h2>
            <button
              onClick={() => handleOpenPromoModal()}
              className="px-4 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Promo Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPromoCards.map((card: any) => (
              <div
                key={card.id}
                style={{ backgroundColor: card.backgroundColor || '#1e293b' }}
                className="rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between min-h-[240px] text-slate-900 border border-white/20"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-800">
                    {card.subtitle}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-950">
                    {card.title}
                  </h3>
                </div>

                <div className="h-28 w-full rounded-xl overflow-hidden bg-white/60 p-1">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover rounded-lg" />
                </div>

                <div className="pt-2 border-t border-slate-950/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-900 bg-white/80 px-2 py-0.5 rounded-md">
                    {card.discount || 'Special'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPromoModal(card)}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-900 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePromo(card.id)}
                      className="p-1.5 rounded-lg bg-rose-500 text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: FEATURED SHORTCUTS MANAGEMENT ── */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Homepage Featured Shortcuts</h2>
            <button
              onClick={() => handleOpenShortcutModal()}
              className="px-4 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shortcut</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayShortcuts.map((shortcut: any) => (
              <div
                key={shortcut.id}
                className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 shadow-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10">
                    <img src={shortcut.icon} alt={shortcut.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-white truncate">{shortcut.title}</h3>
                    <p className="text-xs text-indigo-400 font-semibold">{shortcut.category || 'Shortcut'}</p>
                    <span className="text-[10px] text-slate-400 block truncate">{shortcut.link}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleShortcutActive(shortcut)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      shortcut.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {shortcut.isActive ? 'Active' : 'Off'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenShortcutModal(shortcut)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteShortcut(shortcut.id)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LOCATIONS MANAGEMENT ── */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Coverage Area Locations</h2>
            <button
              onClick={() => handleOpenLocationModal()}
              className="px-4 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayLocations.map((loc: any) => (
              <div
                key={loc.id}
                className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 shadow-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-white truncate">{loc.name}</h3>
                    <p className="text-xs text-slate-400">{loc.city}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">/{loc.slug}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleLocationAvailable(loc)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      loc.isAvailable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {loc.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenLocationModal(loc)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: HERO SLIDE FORM ── */}
      {showHeroModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-lg">
                {editingHero?.id ? 'Edit Hero Slide' : 'Create New Hero Slide'}
              </h3>
              <button onClick={() => setShowHeroModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Slide Title *</label>
                <input
                  type="text"
                  required
                  value={heroForm.title || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  placeholder="e.g. Pure Farm Milk & Organic Daily Eggs"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Badge / Tag</label>
                  <input
                    type="text"
                    value={heroForm.badge || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                    placeholder="e.g. Daily Fresh Farm Market"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={heroForm.discountPercentage || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, discountPercentage: parseFloat(e.target.value) })}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>
              </div>

              <ImageUploader
                label="Background Image File *"
                value={heroForm.backgroundImage || ''}
                onChange={(url) => setHeroForm({ ...heroForm, backgroundImage: url })}
                placeholder="Click or drag & drop to upload slide background image"
                aspectRatio="banner"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={heroForm.buttonText || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonText: e.target.value })}
                    placeholder="Order Now"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">CTA Button Link</label>
                  <input
                    type="text"
                    value={heroForm.buttonLink || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonLink: e.target.value })}
                    placeholder="/services/shopping/dairy"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={heroForm.subtitle || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                  placeholder="Pure organic dairy delivered straight to your door in 45 minutes."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeroModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PROMO CARD FORM ── */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-lg">
                {editingPromo?.id ? 'Edit Promo Card' : 'Create Promo Card'}
              </h3>
              <button onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={promoForm.title || ''}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="e.g. Energy Drinks"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle Header</label>
                  <input
                    type="text"
                    value={promoForm.subtitle || ''}
                    onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })}
                    placeholder="SAVE UP TO 35% ON"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={promoForm.backgroundColor || '#b5d8f7'}
                    onChange={(e) => setPromoForm({ ...promoForm, backgroundColor: e.target.value })}
                    className="w-full h-10 p-1 rounded-xl bg-slate-950 border border-white/10 cursor-pointer"
                  />
                </div>
              </div>

              <ImageUploader
                label="Promo Card Image *"
                value={promoForm.image || ''}
                onChange={(url) => setPromoForm({ ...promoForm, image: url })}
                placeholder="Click or drag & drop to upload promo card image"
                aspectRatio="square"
              />

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Promo Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SHORTCUT FORM ── */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-lg">
                {editingShortcut?.id ? 'Edit Shortcut' : 'Create Featured Shortcut'}
              </h3>
              <button onClick={() => setShowShortcutModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Shortcut Title *</label>
                <input
                  type="text"
                  required
                  value={shortcutForm.title || ''}
                  onChange={(e) => setShortcutForm({ ...shortcutForm, title: e.target.value })}
                  placeholder="e.g. -35% on Energy Drinks"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={shortcutForm.category || ''}
                    onChange={(e) => setShortcutForm({ ...shortcutForm, category: e.target.value })}
                    placeholder="e.g. Beverages"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Link URL</label>
                  <input
                    type="text"
                    value={shortcutForm.link || ''}
                    onChange={(e) => setShortcutForm({ ...shortcutForm, link: e.target.value })}
                    placeholder="/services/shopping/beverages"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>
              </div>

              <ImageUploader
                label="Icon / Thumbnail Image *"
                value={shortcutForm.icon || ''}
                onChange={(url) => setShortcutForm({ ...shortcutForm, icon: url })}
                placeholder="Click or drag & drop to upload shortcut icon image"
                aspectRatio="square"
              />

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShortcutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Shortcut</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOCATION FORM ── */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-lg">
                {editingLocation?.id ? 'Edit Location' : 'Create Coverage Location'}
              </h3>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locationForm.name || ''}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g. Savar DOHS"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={locationForm.city || 'Dhaka'}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="Dhaka"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    value={locationForm.slug || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, slug: e.target.value })}
                    placeholder="savar-dohs"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-[#0E7A45]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E7A45] hover:bg-[#095A32] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
