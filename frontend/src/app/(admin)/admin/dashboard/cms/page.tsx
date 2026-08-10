'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import { useLanguageStore } from '@/store/useLanguageStore';
import {
  Image as ImageIcon, Tag, Plus, Trash2, Edit2,
  CheckCircle2, AlertCircle, Percent, DollarSign, ExternalLink, X, Copy, Check, Save,
  Link as LinkIcon, Eye, EyeOff, Search, Filter, RefreshCw, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

const DEFAULT_BANNER_FORM = {
  title: '',
  subtitle: '',
  image: '',
  link: '/services/shopping',
  category: 'Grocery',
  isActive: true,
  order: 0,
};

const DEFAULT_COUPON_FORM = {
  code: '',
  discount: '',
  discountType: 'FIXED',
  discountValue: '100',
  minSpend: '500',
  maxUses: '',
  isActive: true,
};

export default function AdminCMSPage() {
  const { language } = useLanguageStore();
  const isBn = language === 'BN';
  const { confirm, dialogProps } = useConfirm();

  const [activeTab, setActiveTab] = useState<'banners' | 'coupons'>('banners');
  const [banners, setBanners] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter States
  const [bannerSearch, setBannerSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Banner Modal
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState<any>({ ...DEFAULT_BANNER_FORM });

  // Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponForm, setCouponForm] = useState<any>({ ...DEFAULT_COUPON_FORM });

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetchApi<any>('/admin/banners').catch(() => null),
        fetchApi<any>('/admin/coupons').catch(() => null),
      ]);
      if (bRes && bRes.success && Array.isArray(bRes.data)) setBanners(bRes.data);
      if (cRes && cRes.success && Array.isArray(cRes.data)) setCoupons(cRes.data);
    } catch (err) {
      console.error('Error loading CMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'coupons') {
          setActiveTab('coupons');
          setTimeout(() => {
            document.getElementById('coupons-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (hash === 'banners') {
          setActiveTab('banners');
          setTimeout(() => {
            document.getElementById('banners-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabChange = (tab: 'banners' | 'coupons') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // ── Banner Handlers ──────────────────────────────────────────────────────────

  const openBannerModal = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        link: banner.link || '/services/shopping',
        category: banner.category || 'Grocery',
        isActive: banner.isActive !== false,
        order: banner.order || 0,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ ...DEFAULT_BANNER_FORM, order: banners.length });
    }
    setShowBannerModal(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingBanner) {
        const res = await fetchApi<any>(`/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          body: JSON.stringify(bannerForm),
        });
        if (res && res.success) {
          setBanners((prev) => prev.map((b) => b.id === editingBanner.id ? (res.data || { ...b, ...bannerForm }) : b));
          showMsg(isBn ? 'ব্যানার আপডেট হয়েছে!' : 'Banner updated successfully!');
        }
      } else {
        const res = await fetchApi<any>('/admin/banners', {
          method: 'POST',
          body: JSON.stringify(bannerForm),
        });
        if (res && res.success && res.data) {
          setBanners((prev) => [res.data, ...prev]);
          showMsg(isBn ? 'নতুন ব্যানার যুক্ত হয়েছে!' : 'Banner created successfully!');
        } else {
          loadData();
        }
      }
    } catch (err) {
      console.error('Error saving banner:', err);
    } finally {
      setSaving(false);
      setShowBannerModal(false);
    }
  };

  const handleToggleBanner = async (id: string) => {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b));
    try {
      await fetchApi(`/admin/banners/${id}/toggle`, { method: 'PATCH' });
      showMsg(isBn ? 'ব্যানার স্ট্যাটাস আপডেট হয়েছে।' : 'Banner status updated.');
    } catch {
      loadData();
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const ok = await confirm({
      title: isBn ? 'ব্যানার মুছুন' : 'Delete Banner',
      message: isBn ? 'আপনি কি এই ব্যানারটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this banner?',
      confirmText: isBn ? 'মুছে ফেলুন' : 'Delete Banner',
      variant: 'danger',
    });
    if (!ok) return;
    setBanners((prev) => prev.filter((b) => b.id !== id));
    await fetchApi(`/admin/banners/${id}`, { method: 'DELETE' }).catch(() => null);
    showMsg(isBn ? 'ব্যানার মুছে ফেলা হয়েছে।' : 'Banner deleted.');
  };

  // ── Coupon Handlers ───────────────────────────────────────────────────────────

  const openCouponModal = (coupon?: any) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code || '',
        discount: coupon.discount || '',
        discountType: coupon.discountType || 'FIXED',
        discountValue: String(coupon.discountValue || '100'),
        minSpend: String(coupon.minOrderAmount || coupon.minSpend || '0'),
        maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
        isActive: coupon.isActive !== false,
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({ ...DEFAULT_COUPON_FORM });
    }
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) return;
    setSaving(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discount: couponForm.discount.trim() || `৳${couponForm.discountValue || 100} OFF`,
        discountType: couponForm.discountType || 'FIXED',
        discountValue: Number(couponForm.discountValue) || 0,
        minSpend: Number(couponForm.minSpend) || 0,
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : undefined,
        isActive: couponForm.isActive,
      };
      if (editingCoupon) {
        const res = await fetchApi<any>(`/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res && res.success) {
          setCoupons((prev) => prev.map((c) => c.id === editingCoupon.id ? (res.data || { ...c, ...payload }) : c));
          showMsg(isBn ? 'কুপন আপডেট হয়েছে!' : 'Coupon updated successfully!');
        }
      } else {
        const res = await fetchApi<any>('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res && res.success && res.data) {
          setCoupons((prev) => [res.data, ...prev]);
          showMsg(isBn ? 'কুপন তৈরি হয়েছে!' : 'Coupon created successfully!');
        } else {
          loadData();
        }
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
    } finally {
      setSaving(false);
      setShowCouponModal(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
    try {
      await fetchApi(`/admin/coupons/${id}/toggle`, { method: 'PATCH' });
      showMsg(isBn ? 'কুপন স্ট্যাটাস আপডেট হয়েছে।' : 'Coupon status updated.');
    } catch {
      loadData();
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const ok = await confirm({
      title: isBn ? 'কুপন কোড মুছুন' : 'Delete Coupon',
      message: isBn ? 'আপনি কি এই কুপন কোডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this coupon code?',
      confirmText: isBn ? 'মুছে ফেলুন' : 'Delete Coupon',
      variant: 'danger',
    });
    if (!ok) return;
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    await fetchApi(`/admin/coupons/${id}`, { method: 'DELETE' }).catch(() => null);
    showMsg(isBn ? 'কুপন মুছে ফেলা হয়েছে।' : 'Coupon deleted.');
  };

  // Filtered lists
  const filteredBanners = banners.filter((b) =>
    (b.title || '').toLowerCase().includes(bannerSearch.toLowerCase()) ||
    (b.category || '').toLowerCase().includes(bannerSearch.toLowerCase())
  );

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      (c.code || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
      (c.discount || '').toLowerCase().includes(couponSearch.toLowerCase());
    const matchesFilter =
      couponFilter === 'ALL' ||
      (couponFilter === 'ACTIVE' && c.isActive) ||
      (couponFilter === 'INACTIVE' && !c.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-indigo-400 font-semibold mb-0.5">Admin / Content & Promotions</p>
          <h1 className="font-black text-white text-2xl flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <span>{isBn ? 'সিএমএস এবং প্রমোশনাল কুপন ম্যানেজার' : 'CMS Banners & Coupons Manager'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBn ? 'ওয়েবসাইটের ব্যানার স্লাইডার এবং প্রমোশনাল কুপন কোডসমূহ এখান থেকে লাইভ পরিচালনা করুন' : 'Manage promotional banners and discount coupon codes in real-time across the platform'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'banners' ? (
            <button
              onClick={() => openBannerModal()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> <span>{isBn ? 'নতুন ব্যানার' : 'Add New Banner'}</span>
            </button>
          ) : (
            <button
              onClick={() => openCouponModal()}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> <span>{isBn ? 'নতুন কুপন কোড' : 'Create Coupon Code'}</span>
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── Navigation Tabs & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1f2136] p-2 sm:p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('banners')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{isBn ? 'ব্যানার স্লাইডার' : 'Banners'} ({banners.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('coupons')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>{isBn ? 'কুপন ও ডিসকাউন্ট' : 'Coupons'} ({coupons.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'banners' ? (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={bannerSearch}
                onChange={(e) => setBannerSearch(e.target.value)}
                placeholder="Search banners..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Search coupons..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={couponFilter}
                onChange={(e) => setCouponFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[#181928] border border-white/10 text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── BANNERS TAB ── */}
      {activeTab === 'banners' && (
        <div id="banners-section">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-[#1f2136] border border-white/10 animate-pulse" />
              ))}
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#1f2136] border border-white/10 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
              <p className="text-slate-300 font-bold text-sm">{isBn ? 'কোনো ব্যানার পাওয়া যায়নি' : 'No Banners Found'}</p>
              <p className="text-xs text-slate-400">{isBn ? 'হোমপেজ ও সার্ভিস পেজের জন্য ব্যানার যোগ করুন' : 'Add promotional banners for homepage and shopping catalog.'}</p>
              <button
                onClick={() => openBannerModal()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>{isBn ? 'নতুন ব্যানার তৈরি করুন' : 'Create Banner'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl bg-[#1f2136] border border-white/10 overflow-hidden shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                >
                  {/* Banner Image Preview */}
                  <div className="relative h-44 bg-[#181928] overflow-hidden flex items-center justify-center">
                    {b.image && (b.image.startsWith('http') || b.image.startsWith('/')) ? (
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl">{b.image || '🖼️'}</span>
                    )}

                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                      {b.category || 'Grocery'}
                    </span>

                    <button
                      onClick={() => handleToggleBanner(b.id)}
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all cursor-pointer ${
                        b.isActive !== false ? 'bg-emerald-500/80 text-white border-emerald-400' : 'bg-rose-500/80 text-white border-rose-400'
                      }`}
                    >
                      {b.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                    </button>
                  </div>

                  {/* Banner Info */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-base leading-snug line-clamp-2">{b.title}</h3>
                      {b.subtitle && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{b.subtitle}</p>}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 text-[11px] truncate max-w-[150px]">
                        {b.link || '/services/shopping'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openBannerModal(b)}
                          className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(b.id)}
                          className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COUPONS TAB (#coupons) ── */}
      {activeTab === 'coupons' && (
        <div id="coupons-section">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-44 rounded-3xl bg-[#1f2136] border border-white/10 animate-pulse" />)}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#1f2136] border border-white/10 text-center space-y-3">
              <Tag className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
              <p className="text-slate-300 font-bold text-sm">{isBn ? 'কোনো কুপন কোড পাওয়া যায়নি' : 'No Coupon Codes Found'}</p>
              <p className="text-xs text-slate-400">{isBn ? 'আপনার প্রথম ডিসকাউন্ট কুপন তৈরি করুন' : 'Create your first discount coupon code to reward resident shoppers.'}</p>
              <button
                onClick={() => openCouponModal()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>{isBn ? 'কুপন তৈরি করুন' : 'Create Coupon'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCoupons.map((c) => (
                <div key={c.id} className="p-5 rounded-3xl bg-[#1f2136] border border-white/10 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-emerald-400 text-base tracking-wider bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="font-black text-xl text-white">{c.discount || (c.discountValue ? `৳${c.discountValue} OFF` : 'Discount')}</div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>{isBn ? 'সর্বনিম্ন কেনাকাটা' : 'Min Spend'}: <strong className="text-white">৳{formatCurrency(c.minOrderAmount || 0)}</strong></div>
                      <div>{isBn ? 'ব্যবহারের তথ্য' : 'Uses'}: <strong className="text-slate-200">{c.usedCount || 0}{c.maxUses ? `/${c.maxUses}` : ' (Unlimited)'}</strong></div>
                      {c.expiresAt && (
                        <div className="text-[10px] text-slate-500">
                          Expires: {new Date(c.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        c.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      {c.isActive ? '🟢 Active' : '🔴 Disabled'}
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openCouponModal(c)}
                        className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center transition-all cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT BANNER MODAL ── */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#1f2136] border border-indigo-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">
                {editingBanner
                  ? (isBn ? 'ব্যানার সম্পাদনা করুন' : 'Edit Banner')
                  : (isBn ? 'নতুন ব্যানার স্লাইডার যুক্ত করুন' : 'Add New Hero Banner')}
              </h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  {isBn ? 'ব্যানার ছবির URL' : 'Banner Image URL'}
                </label>
                <input
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm((f: any) => ({ ...f, image: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
                {bannerForm.image && (bannerForm.image.startsWith('http') || bannerForm.image.startsWith('/')) && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-indigo-500/20 h-28">
                    <img
                      src={bannerForm.image}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'শিরোনাম (Title)' : 'Banner Title'} <span className="text-red-400">*</span></label>
                <input
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Ramadan Super Bazaar Grocery Sale"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'উপশিরোনাম (Subtitle)' : 'Subtitle'}</label>
                <input
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm((f: any) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="e.g. Up to 30% discount on fresh fruits & spices"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'ক্যাটাগরি' : 'Category'}</label>
                  <select
                    value={bannerForm.category}
                    onChange={(e) => setBannerForm((f: any) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Services">Services</option>
                    <option value="Meat & Fish">Meat &amp; Fish</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Offers">Offers</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'টার্গেট লিংক' : 'Target Link'}</label>
                  <input
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm((f: any) => ({ ...f, link: e.target.value }))}
                    placeholder="/services/shopping"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-400 font-semibold">{isBn ? 'সক্রিয়' : 'Active'}</label>
                <button
                  type="button"
                  onClick={() => setBannerForm((f: any) => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${bannerForm.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: bannerForm.isActive ? '1.375rem' : '0.125rem' }} />
                </button>
                <span className={`text-xs font-bold ${bannerForm.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {bannerForm.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveBanner}
                disabled={saving || !bannerForm.title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingBanner ? (isBn ? 'আপডেট করুন' : 'Update Banner') : (isBn ? 'ব্যানার সংরক্ষণ করুন' : 'Save Banner')}
              </button>
              <button
                onClick={() => setShowBannerModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT COUPON MODAL ── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1f2136] border border-emerald-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">
                {editingCoupon
                  ? (isBn ? 'কুপন সম্পাদনা করুন' : 'Edit Coupon')
                  : (isBn ? 'নতুন কুপন তৈরি করুন' : 'Create New Coupon')}
              </h3>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'কুপন কোড' : 'Coupon Code'} <span className="text-red-400">*</span></label>
                <input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. EID2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'ছাড়ের লেবেল' : 'Discount Label'}</label>
                  <input
                    value={couponForm.discount}
                    onChange={(e) => setCouponForm((f: any) => ({ ...f, discount: e.target.value }))}
                    placeholder="e.g. ৳150 OFF"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'ছাড়ের পরিমাণ (৳)' : 'Discount Value (৳)'}</label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm((f: any) => ({ ...f, discountValue: e.target.value }))}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'সর্বনিম্ন কেনাকাটা (৳)' : 'Min Spend (৳)'}</label>
                  <input
                    type="number"
                    value={couponForm.minSpend}
                    onChange={(e) => setCouponForm((f: any) => ({ ...f, minSpend: e.target.value }))}
                    placeholder="500"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">{isBn ? 'সর্বোচ্চ ব্যবহার' : 'Max Uses'}</label>
                  <input
                    type="number"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm((f: any) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-400 font-semibold">{isBn ? 'সক্রিয়' : 'Active'}</label>
                <button
                  type="button"
                  onClick={() => setCouponForm((f: any) => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${couponForm.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: couponForm.isActive ? '1.375rem' : '0.125rem' }} />
                </button>
                <span className={`text-xs font-bold ${couponForm.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {couponForm.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveCoupon}
                disabled={saving || !couponForm.code.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingCoupon ? (isBn ? 'আপডেট করুন' : 'Update Coupon') : (isBn ? 'কুপন সংরক্ষণ করুন' : 'Save Coupon')}
              </button>
              <button
                onClick={() => setShowCouponModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
