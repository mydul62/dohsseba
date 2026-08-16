'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import { formatCurrency } from '@/utils/cn';
import {
  Plus, Search, Download, Upload, Edit2, Trash2, Copy,
  Package, AlertTriangle, CheckCircle2, Archive, Star,
  ChevronLeft, ChevronRight, RefreshCw, X, Filter,
  SortAsc, MoreVertical, Eye, Loader2, Check,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuthStore } from '@/store/useAuthStore';
import { BulkImportModal } from '@/components/dashboard/seller/BulkImportModal';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { id: 'p1',  name: 'Organic Full Cream Milk (1L)',   sku: 'DH-MILK-001',  category: { name: 'Dairy & Eggs' }, price: 120, discount: 0,  stock: 45, unit: 'bottle', isActive: true,  isFeatured: true,  images: [], rating: 4.8, _count: { reviews: 32,  orderItems: 142 }, createdAt: '2026-07-15' },
  { id: 'p2',  name: 'Himsagar Mango (per kg)',        sku: 'DH-MANGO-001', category: { name: 'Fruits' },       price: 240, discount: 10, stock: 28, unit: 'kg',     isActive: true,  isFeatured: true,  images: [], rating: 4.9, _count: { reviews: 48,  orderItems: 118 }, createdAt: '2026-07-10' },
  { id: 'p3',  name: 'Basmati Rice (5kg Bag)',         sku: 'DH-RICE-001',  category: { name: 'Rice & Grains' },price: 850, discount: 5,  stock: 22, unit: 'bag',    isActive: true,  isFeatured: false, images: [], rating: 4.6, _count: { reviews: 21,  orderItems: 97  }, createdAt: '2026-07-08' },
  { id: 'p4',  name: 'Deshi Ghee (500g)',              sku: 'DH-GHEE-001',  category: { name: 'Dairy & Eggs' }, price: 420, discount: 0,  stock: 3,  unit: 'jar',    isActive: true,  isFeatured: false, images: [], rating: 4.7, _count: { reviews: 18,  orderItems: 64  }, createdAt: '2026-07-05' },
  { id: 'p5',  name: 'Cold Pressed Mustard Oil (1L)',  sku: 'DH-OIL-001',   category: { name: 'Spices & Oils' }, price: 180, discount: 0,  stock: 5,  unit: 'bottle', isActive: true,  isFeatured: false, images: [], rating: 4.5, _count: { reviews: 14,  orderItems: 76  }, createdAt: '2026-07-01' },
  { id: 'p6',  name: 'Deshi Chicken (per kg)',         sku: 'DH-CHK-001',   category: { name: 'Poultry & Meat' },price: 280, discount: 0,  stock: 18, unit: 'kg',     isActive: true,  isFeatured: false, images: [], rating: 4.7, _count: { reviews: 27,  orderItems: 89  }, createdAt: '2026-06-28' },
  { id: 'p7',  name: 'Fresh Hilsa Fish (per kg)',      sku: 'DH-FISH-001',  category: { name: 'Fish & Seafood' },price: 1200,discount: 0,  stock: 9,  unit: 'kg',     isActive: true,  isFeatured: true,  images: [], rating: 4.9, _count: { reviews: 42,  orderItems: 51  }, createdAt: '2026-06-25' },
  { id: 'p8',  name: 'Organic Turmeric Powder (100g)', sku: 'DH-TUR-001',   category: { name: 'Spices & Oils' }, price: 85,  discount: 0,  stock: 7,  unit: 'pack',   isActive: true,  isFeatured: false, images: [], rating: 4.4, _count: { reviews: 9,   orderItems: 43  }, createdAt: '2026-06-20' },
  { id: 'p9',  name: 'Paneer Fresh (200g)',            sku: 'DH-PAN-001',   category: { name: 'Dairy & Eggs' }, price: 160, discount: 0,  stock: 8,  unit: 'pack',   isActive: true,  isFeatured: false, images: [], rating: 4.6, _count: { reviews: 11,  orderItems: 35  }, createdAt: '2026-06-15' },
  { id: 'p10', name: 'Green Chili (250g)',             sku: 'DH-CHI-001',   category: { name: 'Vegetables' },   price: 45,  discount: 0,  stock: 30, unit: 'pack',   isActive: true,  isFeatured: false, images: [], rating: 4.2, _count: { reviews: 6,   orderItems: 22  }, createdAt: '2026-06-10' },
  { id: 'p11', name: 'Soyabean Oil (2L)',              sku: 'DH-SOY-001',   category: { name: 'Spices & Oils' }, price: 320, discount: 8,  stock: 0,  unit: 'bottle', isActive: true,  isFeatured: false, images: [], rating: 4.3, _count: { reviews: 8,   orderItems: 29  }, createdAt: '2026-06-05' },
  { id: 'p12', name: 'Taaza Full Cream Milk (Pouch)',  sku: 'DH-MILK-002',  category: { name: 'Dairy & Eggs' }, price: 65,  discount: 0,  stock: 60, unit: 'pouch',  isActive: false, isFeatured: false, images: [], rating: 4.1, _count: { reviews: 5,   orderItems: 18  }, createdAt: '2026-06-01' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getProductStatus(p: any) {
  if (!p.isActive || p.status === 'DRAFT' || p.isDraft) {
    return { label: 'Draft', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
  }
  if (p.status === 'ARCHIVED') {
    return { label: 'Archived', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  }
  if (p.stock === 0) return { label: 'Out of Stock', cls: 'bg-red-500/20 text-red-300 border-red-500/30' };
  if (p.stock <= 10) return { label: 'Low Stock', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  return { label: 'Active', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
}

function Stars({ r }: { r: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />)}
      <span className="text-[10px] text-slate-400 ml-0.5">{r}</span>
    </div>
  );
}

const PAGE_SIZE = 100;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search,   setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey,  setSortKey]  = useState('newest');
  const [page,     setPage]     = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { confirm, dialogProps } = useConfirm();
  const { token } = useAuthStore();

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    fetchApi<any>('/products/seller/my-products')
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((p: any) => ({
            id: p.id,
            name: p.name || 'Untitled Product',
            sku: p.sku || `SKU-${(p.id || '').slice(-6).toUpperCase()}`,
            category: p.category || { name: 'General' },
            price: Number(p.price || 0),
            discount: Number(p.discount || 0),
            stock: Number(p.stock || 0),
            unit: (p.unitAmount ?? p.amount) ? `${p.unitAmount ?? p.amount} ${p.unit || 'unit'}` : (p.unit || 'unit'),
            unitAmount: p.unitAmount ?? p.amount,
            isActive: p.isActive !== false,
            isFeatured: Boolean(p.isFeatured),
            images: Array.isArray(p.images) ? p.images : [],
            rating: p.rating || 4.5,
            _count: p._count || { reviews: 0, orderItems: 0 },
            createdAt: p.createdAt || new Date().toISOString(),
          }));
          setProducts(mapped);
          setError(null);
        } else {
          setError(res?.message || 'Failed to fetch products from database.');
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to connect to backend server. Please verify your connection.');
      })
      .finally(() => setLoading(false));
  };

  const loadCategories = () => {
    fetchApi<any>('/product-categories')
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const names = res.data.map((c: any) => c.name).filter(Boolean) as string[];
          setAllCategories(names);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadProducts();
    loadCategories();
  }, [mounted, token]);

  // ─── Filters ────────────────────────────────────────────────────────────────

  // Merge DB categories with product categories with counts
  const categoriesWithCount = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cName = p.category?.name || (typeof p.category === 'string' ? p.category : '') || 'Uncategorized';
      if (cName) {
        map.set(cName, (map.get(cName) || 0) + 1);
      }
    });

    // Also include DB categories
    allCategories.forEach((cName) => {
      if (!map.has(cName)) {
        map.set(cName, 0);
      }
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products, allCategories]);

  const filtered = useMemo(() => {
    let list = [...products];

    // Search Filter (matches name, SKU, category, unit, description)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const cat = (p.category?.name || (typeof p.category === 'string' ? p.category : '')).toLowerCase();
        const unit = (p.unit || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(q) || sku.includes(q) || cat.includes(q) || unit.includes(q) || desc.includes(q);
      });
    }

    // Category Filter (case-insensitive name and slug match)
    if (catFilter) {
      const targetCat = catFilter.trim().toLowerCase();
      list = list.filter((p) => {
        const cName = (p.category?.name || (typeof p.category === 'string' ? p.category : '')).toLowerCase();
        const cSlug = (p.category?.slug || '').toLowerCase();
        return cName === targetCat || cSlug === targetCat;
      });
    }

    // Status Filter
    if (statusFilter === 'active')        list = list.filter((p) => p.isActive && p.stock > 0);
    if (statusFilter === 'draft')         list = list.filter((p) => !p.isActive || p.status === 'DRAFT' || p.isDraft);
    if (statusFilter === 'archived')      list = list.filter((p) => p.status === 'ARCHIVED');
    if (statusFilter === 'out_of_stock')   list = list.filter((p) => p.isActive && p.stock === 0);
    if (statusFilter === 'low_stock')     list = list.filter((p) => p.isActive && p.stock > 0 && p.stock <= 10);
    if (statusFilter === 'discounted')    list = list.filter((p) => Number(p.discount || 0) > 0);
    if (statusFilter === 'featured')      list = list.filter((p) => p.isFeatured);

    // Sorting
    if (sortKey === 'newest')       list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortKey === 'oldest')       list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortKey === 'name_asc')     list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === 'name_desc')    list.sort((a, b) => b.name.localeCompare(a.name));
    if (sortKey === 'price_asc')    list.sort((a, b) => a.price - b.price);
    if (sortKey === 'price_desc')   list.sort((a, b) => b.price - a.price);
    if (sortKey === 'stock_asc')    list.sort((a, b) => a.stock - b.stock);
    if (sortKey === 'stock_desc')   list.sort((a, b) => b.stock - a.stock);
    if (sortKey === 'rating_desc')  list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortKey === 'sales_desc')   list.sort((a, b) => (b._count?.orderItems || 0) - (a._count?.orderItems || 0));

    return list;
  }, [products, search, catFilter, statusFilter, sortKey]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalActive     = products.filter((p) => p.isActive && p.stock > 0).length;
  const totalDrafts     = products.filter((p) => !p.isActive || p.status === 'DRAFT' || p.isDraft).length;
  const totalOutOfStock = products.filter((p) => p.isActive && p.stock === 0).length;
  const totalLowStock   = products.filter((p) => p.isActive && p.stock > 0 && p.stock <= 10).length;
  const totalArchived   = products.filter((p) => p.status === 'ARCHIVED').length;

  // ─── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === pageItems.length ? new Set() : new Set(pageItems.map((p) => p.id)));

  const allChecked = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleToggleActive = async (p: any) => {
    const nextState = !p.isActive;
    setProducts((prev) =>
      prev.map((prod) => (prod.id === p.id ? { ...prod, isActive: nextState } : prod))
    );
    try {
      await fetchApi(`/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: nextState }),
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
      setProducts((prev) =>
        prev.map((prod) => (prod.id === p.id ? { ...prod, isActive: !nextState } : prod))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action is permanent and cannot be undone.',
      confirmText: 'Delete Product',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {} finally {
      setDeleting(null);
    }
  };

  const [duplicating, setDuplicating] = useState<string | null>(null);

  const handleDuplicate = async (p: any) => {
    try {
      setDuplicating(p.id);
      const categoryId = p.categoryId || p.category?.id;
      const brandId = p.brandId || p.brand?.id;

      const payload = {
        name: `${p.name} (Copy)`,
        description: p.description || '',
        price: Number(p.price || 0),
        salePrice: p.salePrice ? Number(p.salePrice) : undefined,
        discount: Number(p.discount || 0),
        stock: Number(p.stock || 0),
        unit: p.unit || 'unit',
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : undefined,
        sku: `${p.sku || 'SKU'}-COPY-${Math.floor(Math.random() * 1000)}`,
        isFeatured: Boolean(p.isFeatured),
        isFlashSale: Boolean(p.isFlashSale),
        isActive: true,
      };

      const res = await fetchApi<any>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.success && res.data) {
        const newProduct = {
          id: res.data.id,
          name: res.data.name,
          sku: res.data.sku || `SKU-${(res.data.id || '').slice(-6).toUpperCase()}`,
          category: res.data.category || p.category || { name: 'General' },
          price: Number(res.data.price || 0),
          discount: Number(res.data.discount || 0),
          stock: Number(res.data.stock || 0),
          unit: res.data.unit || 'unit',
          isActive: true,
          isFeatured: Boolean(res.data.isFeatured),
          images: Array.isArray(res.data.images) ? res.data.images : p.images || [],
          rating: res.data.rating || 5.0,
          _count: { reviews: 0, orderItems: 0 },
          createdAt: res.data.createdAt || new Date().toISOString(),
        };
        setProducts((prev) => [newProduct, ...prev]);
      } else {
        alert(res?.message || 'Failed to duplicate product.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error duplicating product.');
    } finally {
      setDuplicating(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Delete ${ids.length} Product(s)`,
      message: `You are about to permanently delete ${ids.length} selected product(s). This action is permanent and cannot be undone.`,
      confirmText: `Delete ${ids.length} Product(s)`,
      variant: 'danger',
    });
    if (!ok) return;

    setBulkDeleting(true);
    try {
      const res = await fetchApi<any>('/products/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      if (res && res.success) {
        setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
        setSelected(new Set());
      } else {
        alert(res?.message || 'Failed to delete selected products.');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to bulk delete products');
    } finally {
      setBulkDeleting(false);
    }
  };

  const [bulkPublishing, setBulkPublishing] = useState(false);
  const handleBulkPublish = async () => {
    if (selected.size === 0) return;
    setBulkPublishing(true);
    try {
      const ids = Array.from(selected);
      await fetchApi('/products/bulk-publish', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      setProducts((prev) =>
        prev.map((p) => (selected.has(p.id) ? { ...p, isActive: true } : p))
      );
      setSelected(new Set());
    } catch (err: any) {
      alert(err?.message || 'Failed to publish selected products');
    } finally {
      setBulkPublishing(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'],
      ...products.map((p) => [p.id, p.name, p.sku, p.category?.name, p.price, p.stock, p.isActive ? 'Active' : 'Archived']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-white text-xl">Product Management</h1>
          <p className="text-xs text-slate-400">{products.length} products in your store</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link href="/seller/dashboard/products/add" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Link>
        </div>
      </div>

      {/* ── Stats (Clickable Quick Filters) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: '', label: 'Total Products', value: products.length, icon: <Package className="w-5 h-5 text-indigo-400" />, bg: 'bg-indigo-500/10' },
          { key: 'active', label: 'Active', value: totalActive, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10' },
          { key: 'out_of_stock', label: 'Out of Stock', value: totalOutOfStock, icon: <X className="w-5 h-5 text-red-400" />, bg: 'bg-red-500/10' },
          { key: 'low_stock', label: 'Low Stock', value: totalLowStock, icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/10' },
        ].map((s) => {
          const isSelected = statusFilter === s.key;
          return (
            <button
              key={s.label}
              onClick={() => { setStatusFilter(s.key); setPage(1); }}
              className={`p-4 rounded-2xl bg-[#1f2136] border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">{s.label}</p>
                <p className="text-xl font-black text-white">{s.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="p-4 rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input with inline Clear icon */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by product name, SKU, category..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown with Counts */}
          <div className="relative min-w-[170px]">
            <select
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Categories ({products.length})</option>
              {categoriesWithCount.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Status ({products.length})</option>
              <option value="active">Active ({totalActive})</option>
              <option value="draft">📝 Drafts ({totalDrafts})</option>
              <option value="low_stock">Low Stock ({totalLowStock})</option>
              <option value="out_of_stock">Out of Stock ({totalOutOfStock})</option>
              <option value="archived">Archived ({totalArchived})</option>
              <option value="featured">Featured</option>
              <option value="discounted">Discounted</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="price_asc">Price Low–High</option>
              <option value="price_desc">Price High–Low</option>
              <option value="stock_asc">Stock Low–High</option>
              <option value="stock_desc">Stock High–Low</option>
              <option value="rating_desc">Top Rated</option>
              <option value="sales_desc">Best Selling</option>
            </select>
          </div>

          {/* Clear All Filters */}
          {(search || catFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); setPage(1); }}
              className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-xs text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Filter Summary Status Bar */}
        {(search || catFilter || statusFilter) && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap text-xs">
            <span className="text-slate-400">
              Showing <strong className="text-white">{filtered.length}</strong> of {products.length} products
            </span>
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {catFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                  Category: {catFilter}
                  <button onClick={() => setCatFilter('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                  Status: {statusFilter.replace('_', ' ')}
                  <button onClick={() => setStatusFilter('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 animate-pulse-once">
          <span className="text-xs font-bold text-indigo-300">{selected.size} product{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all">Deselect All</button>
            <button
              onClick={handleBulkPublish}
              disabled={bulkPublishing}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {bulkPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Publish Selected ({selected.size})
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Status Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: '', label: 'All Products', count: products.length },
          { id: 'active', label: 'Active', count: totalActive },
          { id: 'draft', label: '📝 Drafts', count: totalDrafts },
          { id: 'low_stock', label: 'Low Stock', count: totalLowStock },
          { id: 'out_of_stock', label: 'Out of Stock', count: totalOutOfStock },
          { id: 'archived', label: 'Archived', count: totalArchived },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-[#181928] border-white/10 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl bg-[#1f2136] border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-[#181928]/50">
                <th className="w-10 p-4">
                  <button onClick={toggleAll} className="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-indigo-400 transition-colors">
                    {allChecked && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                  </button>
                </th>
                <th className="p-4 text-left w-12">Image</th>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left hidden sm:table-cell">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center hidden md:table-cell">Stock</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center hidden lg:table-cell">Rating</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                    <p className="font-bold">Loading products from database...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-amber-300">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
                    <p className="font-bold text-sm">{error}</p>
                    <button
                      onClick={loadProducts}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all inline-flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Loading Products
                    </button>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">No products found</p>
                    <p className="text-[11px] mt-1">Try adjusting your filters or add a new product</p>
                  </td>
                </tr>
              ) : pageItems.map((p) => {
                const status = getProductStatus(p);
                const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                return (
                  <tr key={p.id} className={`hover:bg-white/5 transition-colors ${selected.has(p.id) ? 'bg-indigo-600/5' : ''}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelect(p.id)} className="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-indigo-400 transition-colors">
                        {selected.has(p.id) && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-xl bg-[#181928] border border-white/10 flex items-center justify-center overflow-hidden">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <div className="font-bold text-white truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 font-mono">{p.sku}</span>
                        {p.isFeatured && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">⭐ Featured</span>}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                        {p.category?.name}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-black text-white">{formatCurrency(finalPrice)}</div>
                      {p.discount > 0 && <div className="text-[10px] text-slate-500 line-through">{formatCurrency(p.price)}</div>}
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                      <span className={`font-black text-sm ${p.stock === 0 ? 'text-red-400' : p.stock <= 10 ? 'text-amber-400' : 'text-white'}`}>
                        {p.stock}
                      </span>
                      <div className="text-[10px] text-slate-500">{p.unit}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${status.cls}`}
                        title={p.isActive ? 'Click to set as Draft (Unpublish)' : 'Click to Publish on Website'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{status.label}</span>
                      </button>
                    </td>
                    <td className="p-4 text-center hidden lg:table-cell">
                      <Stars r={p.rating} />
                      <div className="text-[10px] text-slate-500 mt-0.5">{p._count.reviews} reviews</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                            p.isActive
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={p.isActive ? 'Save as Draft (Unpublish)' : 'Publish live on store'}
                        >
                          {p.isActive ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>To Draft</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                        <Link
                          href={`/seller/dashboard/products/${p.id}/edit`}
                          className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center justify-center transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p)}
                          disabled={duplicating === p.id}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 flex items-center justify-center transition-all disabled:opacity-50"
                          title="Duplicate Product"
                        >
                          {duplicating === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs">
            <span className="text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-500 px-1">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg border font-bold transition-all ${page === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk Import Modal ── */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          loadProducts();
        }}
      />

      {/* ── Custom Professional Confirmation Modal ── */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
