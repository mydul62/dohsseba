'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  ArrowUpDown,
  Download,
  Eye,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

interface CustomerOrderSummary {
  id: string;
  trackingCode?: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  itemCount: number;
}

interface CustomerRecord {
  id: string;
  customerId?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: CustomerOrderSummary[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'totalSpent' | 'totalOrders' | 'lastOrderDate'>('lastOrderDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: CustomerRecord[] }>('/orders/admin-customers');
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'lastOrderDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersCount = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const exportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['Customer Name', 'Phone Number', 'Email', 'Delivery Address', 'Total Orders', 'Total Spent (BDT)', 'Last Order Date'];
    const rows = customers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      c.totalOrders,
      c.totalSpent,
      `"${new Date(c.lastOrderDate).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketplace_customer_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('DELIVERED') || s.includes('COMPLETED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s.includes('CANCEL') || s.includes('REJECT')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (s.includes('ON_THE_WAY') || s.includes('PICKED_UP')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" /> Admin Marketplace CRM & Customer Analytics
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace Customer Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized directory of all ordering customers across DOHS Sheba marketplace. Monitor buyer phone numbers, addresses, total orders, and cumulative spending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCustomers}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportCSV}
            disabled={customers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export All Customers CSV
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Marketplace Buyers</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalCustomers}</h3>
            <p className="text-[11px] text-cyan-400 mt-0.5">Ordering customers</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Orders</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalOrdersCount}</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">Across all sellers</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Gross GMV Revenue</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">৳{totalRevenue.toLocaleString()}</h3>
            <p className="text-[11px] text-purple-400 mt-0.5">Combined buyer spend</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Avg Order Value</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">৳{avgOrderValue.toLocaleString()}</h3>
            <p className="text-[11px] text-amber-400 mt-0.5">Per customer transaction</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 text-white placeholder-slate-500 text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort By:</span>
          <button
            onClick={() => { setSortField('totalSpent'); setSortAsc(!sortAsc); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition whitespace-nowrap ${
              sortField === 'totalSpent'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Total Spend <ArrowUpDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => { setSortField('totalOrders'); setSortAsc(!sortAsc); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition whitespace-nowrap ${
              sortField === 'totalOrders'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Total Orders <ArrowUpDown className="w-3 h-3" />
          </button>

          <button
            onClick={() => { setSortField('lastOrderDate'); setSortAsc(!sortAsc); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition whitespace-nowrap ${
              sortField === 'lastOrderDate'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Recent Date <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Customers Data Table ── */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-3" />
            <p className="text-sm">Fetching marketplace customer records...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No Customer Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No customer matched your search query.' : 'When residents place orders on the platform, customer names and phone numbers will be compiled here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4 text-center">Total Orders</th>
                  <th className="py-3.5 px-4 text-right">Cumulative Spend</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/40 transition">
                    {/* Name & Email */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {customer.name}
                          </div>
                          {customer.email && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" /> {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-4 px-4">
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center gap-1.5 font-medium text-cyan-400 hover:text-cyan-300 transition text-sm bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                      >
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </a>
                    </td>

                    {/* Address */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-xs text-slate-300 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs">
                        <ShoppingBag className="w-3 h-3 text-cyan-400" /> {customer.totalOrders} {customer.totalOrders === 1 ? 'Order' : 'Orders'}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-cyan-400 text-base">
                        ৳{customer.totalSpent.toLocaleString()}
                      </span>
                    </td>

                    {/* Last Order Date */}
                    <td className="py-4 px-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(customer.lastOrderDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition border border-slate-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" /> View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order History Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-cyan-400 flex items-center gap-2">
                    <span><Phone className="w-3 h-3 inline mr-1" />{selectedCustomer.phone}</span>
                    <span>•</span>
                    <span>{selectedCustomer.totalOrders} Marketplace Orders</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Marketplace Order History</h4>
              {selectedCustomer.orders.map((ord) => (
                <div key={ord.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white">#ORD-{ord.id.slice(-6).toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(ord.status)}`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span><Calendar className="w-3 h-3 inline mr-1 text-slate-500" />{new Date(ord.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{ord.itemCount} {ord.itemCount === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-cyan-400">৳{ord.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-800/20 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition border border-slate-700"
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
