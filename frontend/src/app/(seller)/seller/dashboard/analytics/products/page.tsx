import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/cn';
import { Package, Search, TrendingUp, TrendingDown, Download, Star, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

const INITIAL_PRODUCTS = [
  { rank: 1,  name: 'Organic Whole Milk 1L',    sku: 'MLK-001', revenue: 24800, units: 620, avgRating: 4.8, returnRate: '0.3%', status: 'Trending' },
  { rank: 2,  name: 'Fresh Hilsa Fish (500g)',   sku: 'FSH-012', revenue: 18600, units: 186, avgRating: 4.7, returnRate: '1.1%', status: 'Trending' },
  { rank: 3,  name: 'Fuji Apple (1kg)',           sku: 'FRT-034', revenue: 14200, units: 355, avgRating: 4.6, returnRate: '0.5%', status: 'Stable' },
  { rank: 4,  name: 'Premium Basmati Rice 5kg',  sku: 'RCG-005', revenue: 11800, units: 236, avgRating: 4.5, returnRate: '0.8%', status: 'Stable' },
  { rank: 5,  name: 'Cold Pressed Mustard Oil',  sku: 'OIL-002', revenue: 9600,  units: 192, avgRating: 4.4, returnRate: '0.6%', status: 'Declining' },
  { rank: 6,  name: 'Farm Fresh Eggs (12pc)',     sku: 'EGG-001', revenue: 8400,  units: 700, avgRating: 4.9, returnRate: '0.1%', status: 'Trending' },
  { rank: 7,  name: 'Fresh Chicken (1kg)',        sku: 'MCT-001', revenue: 7800,  units: 156, avgRating: 4.3, returnRate: '1.5%', status: 'Stable' },
  { rank: 8,  name: 'Brown Rice 2kg',             sku: 'RCG-003', revenue: 6200,  units: 155, avgRating: 4.2, returnRate: '0.4%', status: 'Declining' },
  { rank: 9,  name: 'Fresh Spinach (250g)',       sku: 'VEG-021', revenue: 4800,  units: 480, avgRating: 4.4, returnRate: '0.7%', status: 'Stable' },
  { rank: 10, name: 'Turmeric Powder (100g)',     sku: 'SPC-008', revenue: 3800,  units: 380, avgRating: 4.6, returnRate: '0.2%', status: 'Stable' },
];

export default function ProductsAnalyticsPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchApi<any>('/orders/seller-analytics')
      .then((res) => {
        if (res.success && Array.isArray(res.data?.productsList) && res.data.productsList.length > 0) {
          setProducts(res.data.productsList);
        }
      })
      .catch((err) => console.error('Failed to load products analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const statusStyle = (s: string) => {
    if (s === 'Trending')  return 'bg-emerald-500/15 text-emerald-400';
    if (s === 'Declining') return 'bg-rose-500/15 text-rose-400';
    return 'bg-slate-500/15 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Analytics / Products</p>
          <h1 className="font-black text-white text-xl flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" /> Product Performance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Revenue, units sold, rating, and trends per product</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
            title="Reset & Recalculate Product Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3">
        {PRODUCTS.slice(0, 3).map((p, i) => (
          <div key={p.sku} className={`rounded-2xl p-4 border ${i === 0 ? 'bg-amber-500/10 border-amber-500/20' : i === 1 ? 'bg-slate-500/10 border-white/15' : 'bg-orange-600/10 border-orange-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : 'text-orange-400'}`}>#{p.rank}</span>
              <TrendingUp className={`w-3.5 h-3.5 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : 'text-orange-400'}`} />
            </div>
            <p className="text-xs font-bold text-white truncate">{p.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{p.units} units</p>
            <p className="font-black text-sm text-emerald-400 mt-1">৳{formatCurrency(p.revenue)}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1e1f32] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1e1f32] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-widest border-b border-white/10">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">Return %</th>
                <th className="px-4 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.sku} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-bold text-xs">{p.rank}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white text-sm truncate max-w-[200px]">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">৳{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{p.units}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3 h-3 fill-current" /> {p.avgRating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-400">{p.returnRate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
