'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types/user';
import { useOrderStore } from '@/store/useOrderStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSiteSettingsStore } from '@/store/useSiteSettingsStore';
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  User,
  MapPin,
  Wrench,
  DollarSign,
  Package,
  PlusCircle,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageSquare,
  Sliders,
  Tag,
  Image as ImageIcon,
  ShieldAlert,
  ChevronLeft,
  Store,
  Layers,
  FileText,
  PieChart,
  Star,
  Megaphone,
  Wallet,
  Percent,
  Zap,
  TrendingUp,
  Radio,
  Bike,
  Navigation,
  Globe,
  Award,
  RefreshCcw,
  BarChart2,
  ClipboardList,
  Settings,
  ShoppingCart,
  Clock,
  Truck,
} from 'lucide-react';

interface SubMenuItem {
  label: string;
  href: string;
}

interface NavMenuGroup {
  sectionTitle: string;
  items: {
    label: string;
    href?: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeBg?: string;
    subItems?: SubMenuItem[];
  }[];
}

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

import { useLanguageStore } from '@/store/useLanguageStore';

export function DashboardSidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, role, setRole, logout } = useAuthStore();
  const { language } = useLanguageStore();
  const { siteName } = useSiteSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Dynamic badge counts ──────────────────────────────────────────
  const { orders: storeOrders } = useOrderStore();
  const { notifications } = useNotificationStore();

  // Dashboard badge: pending + processing orders (need attention)
  const urgentOrderCount = storeOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PROCESSING'
  ).length;

  // Orders badge: all active orders (not delivered/cancelled/returned)
  const activeOrderCount = storeOrders.filter(
    (o) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status)
  ).length;

  // Reviews badge: unread notifications of type REVIEW
  const newReviewCount = notifications.filter(
    (n) => !(n as any).read && (n as any).type === 'REVIEW'
  ).length;

  const effectiveRole: UserRole = (() => {
    if (pathname) {
      if (pathname.startsWith('/rider') || pathname.startsWith('/dashboard/rider')) return 'RIDER';
      if (pathname.startsWith('/seller') || pathname.startsWith('/dashboard/seller')) return 'SELLER';
      if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/super-admin')) return 'ADMIN';
      if (pathname.startsWith('/provider') || pathname.startsWith('/dashboard/provider')) return 'PROVIDER';
      if (pathname.startsWith('/dashboard/customer') || pathname === '/dashboard') return 'CUSTOMER';
    }
    if (role && role !== 'GUEST') return role;
    return 'GUEST';
  })();

  const [openAccordion, setOpenAccordion] = useState<string | null>(() => {
    if (effectiveRole === 'SELLER') return 'Products';
    if (effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN') return 'Ecommerce';
    return null;
  });

  // Reset open accordion when role switches
  useEffect(() => {
    if (effectiveRole === 'SELLER') setOpenAccordion('Products');
    else if (effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN') setOpenAccordion('Ecommerce');
    else setOpenAccordion(null);
  }, [effectiveRole]);

  const toggleAccordion = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title);
  };

  const getRoleNavGroups = (): NavMenuGroup[] => {
    if (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'ADMIN') {
      return [
        {
          sectionTitle: 'MENU',
          items: [
            {
              label: 'Dashboard',
              href: '/admin/dashboard',
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
            {
              label: 'Ecommerce',
              icon: <ShoppingBag className="w-4 h-4" />,
              subItems: [
                { label: 'Executive Overview', href: '/admin/dashboard' },
                { label: 'Product Inventory', href: '/admin/dashboard/ecommerce' },
                { label: 'Marketplace Orders', href: '/admin/dashboard/ecommerce#orders' },
              ],
            },
            {
              label: 'Services',
              icon: <Wrench className="w-4 h-4" />,
              subItems: [
                { label: 'Services Catalog', href: '/admin/dashboard/services' },
                { label: 'Time Slots & Capacity', href: '/provider/dashboard?tab=SLOTS' },
                { label: 'Partner Approvals', href: '/admin/dashboard/services#approvals' },
              ],
            },
            {
              label: 'Email & Chat',
              href: '/admin/dashboard/email-chat',
              icon: <Mail className="w-4 h-4" />,
            },
          ],
        },
        {
          sectionTitle: 'MANAGEMENT',
          items: [
            {
              label: 'User Manager',
              href: '/admin/dashboard/users',
              icon: <Users className="w-4 h-4" />,
            },
            {
              label: 'Rider Dispatch Queue',
              href: '/dashboard/admin/dispatch',
              icon: <Radio className="w-4 h-4 text-amber-400" />,
            },
            {
              label: 'Banners & CMS',
              href: '/admin/dashboard/cms',
              icon: <ImageIcon className="w-4 h-4" />,
            },
            {
              label: 'Hero Slides & Promos',
              href: '/admin/homepage',
              icon: <Sliders className="w-4 h-4 text-violet-400" />,
            },
            {
              label: 'Coupons & Offers',
              href: '/admin/dashboard/cms#coupons',
              icon: <Tag className="w-4 h-4" />,
            },
            {
              label: 'Withdrawal Requests',
              href: '/admin/dashboard/withdrawals',
              icon: <Wallet className="w-4 h-4 text-emerald-400" />,
            },
            {
              label: 'Website Settings',
              href: '/admin/dashboard/settings',
              icon: <Globe className="w-4 h-4 text-indigo-400" />,
            },
            {
              label: 'Delivery Charge Settings',
              href: '/admin/dashboard/delivery-settings',
              icon: <Truck className="w-4 h-4 text-emerald-400" />,
            },
            {
              label: 'My Profile & Security',
              href: '/admin/dashboard/profile',
              icon: <User className="w-4 h-4 text-purple-400" />,
            },
          ],
        },
      ];
    } else if (effectiveRole === 'PROVIDER') {
      return [
        {
          sectionTitle: 'SERVICE OPERATIONS',
          items: [
            {
              label: 'Dashboard Overview',
              href: '/provider/dashboard',
              icon: <LayoutDashboard className="w-4 h-4 text-blue-400" />,
            },
            {
              label: 'Service Requests',
              icon: <Wrench className="w-4 h-4 text-purple-400" />,
              subItems: [
                { label: 'New Requests', href: '/provider/dashboard?status=PENDING' },
                { label: 'Confirmed Jobs', href: '/provider/dashboard?status=CONFIRMED' },
                { label: 'Assigned Jobs', href: '/provider/dashboard?status=ASSIGNED' },
                { label: 'In Progress', href: '/provider/dashboard?status=IN_PROGRESS' },
                { label: 'Completed Jobs', href: '/provider/dashboard?status=COMPLETED' },
                { label: 'Cancelled Jobs', href: '/provider/dashboard?status=CANCELLED' },
              ],
            },
            {
              label: 'Service Management',
              href: '/provider/dashboard/services',
              icon: <Layers className="w-4 h-4 text-emerald-400" />,
            },
            {
              label: 'Time Slots & Capacity',
              href: '/provider/dashboard?tab=SLOTS',
              icon: <Clock className="w-4 h-4 text-amber-400" />,
            },
            {
              label: 'Technician Roster',
              href: '/admin/dashboard/services',
              icon: <Users className="w-4 h-4 text-blue-400" />,
            },
          ],
        },
      ];
    } else if (effectiveRole === 'RIDER') {
      return [
        {
          sectionTitle: 'MENU',
          items: [
            {
              label: 'Rider Command',
              href: '/rider/dashboard',
              icon: <Bike className="w-4 h-4" />,
            },
            {
              label: 'Live Mission Mode',
              href: '/dashboard/current-mission',
              icon: <Navigation className="w-4 h-4 text-emerald-400" />,
            },
            {
              label: 'Trip Earnings',
              href: '/rider/dashboard',
              icon: <DollarSign className="w-4 h-4" />,
            },
          ],
        },
      ];
    } else if (effectiveRole === 'SELLER') {
      return [
        {
          sectionTitle: 'MENU',
          items: [
            {
              label: 'Dashboard',
              href: '/seller/dashboard',
              icon: <LayoutDashboard className="w-4 h-4" />,
              badge: urgentOrderCount > 0 ? urgentOrderCount : undefined,
              badgeBg: 'bg-emerald-500',
            },
          ],
        },
        {
          sectionTitle: 'CATALOG',
          items: [
            {
              label: 'Products',
              icon: <Package className="w-4 h-4" />,
              subItems: [
                { label: 'All Products', href: '/seller/dashboard/products' },
                { label: 'Add Product', href: '/seller/dashboard/products/add' },
                { label: 'Categories', href: '/seller/dashboard/products/categories' },
                { label: 'Brands', href: '/seller/dashboard/products/brands' },
                { label: 'Attributes', href: '/seller/dashboard/products/attributes' },
                { label: 'Variants', href: '/seller/dashboard/products/variants' },
              ],
            },
            {
              label: 'Inventory',
              href: '/seller/dashboard/inventory',
              icon: <Layers className="w-4 h-4" />,
            },
            {
              label: 'Reviews',
              href: '/seller/dashboard/reviews',
              icon: <Star className="w-4 h-4" />,
              badge: newReviewCount > 0 ? newReviewCount : undefined,
              badgeBg: 'bg-amber-500',
            },
          ],
        },
        {
          sectionTitle: 'ORDERS',
          items: [
            {
              label: 'Orders',
              icon: <ShoppingBag className="w-4 h-4" />,
              badge: activeOrderCount > 0 ? activeOrderCount : undefined,
              badgeBg: 'bg-indigo-500',
              subItems: [
                { label: 'All Orders', href: '/seller/dashboard/orders' },
                { label: 'Pending', href: '/seller/dashboard/orders/pending' },
                { label: 'Processing', href: '/seller/dashboard/orders/processing' },
                { label: 'Packed', href: '/seller/dashboard/orders/packed' },
                { label: 'Shipped', href: '/seller/dashboard/orders/shipped' },
                { label: 'Delivered', href: '/seller/dashboard/orders/delivered' },
                { label: 'Cancelled', href: '/seller/dashboard/orders/cancelled' },
                { label: 'Returned', href: '/seller/dashboard/orders/returned' },
                { label: 'Refunds', href: '/seller/dashboard/orders/refunds' },
              ],
            },
          ],
        },
        {
          sectionTitle: 'FLEET & DISPATCH',
          items: [
            {
              label: 'Riders Roster',
              icon: <Bike className="w-4 h-4" />,
              href: '/seller/dashboard/riders',
            },
          ],
        },
        {
          sectionTitle: 'CUSTOMERS',
          items: [
            {
              label: 'Customers',
              icon: <Users className="w-4 h-4" />,
              subItems: [
                { label: 'Customer List', href: '/seller/dashboard/customers' },
                { label: 'Customer Messages', href: '/seller/dashboard/messages' },
                { label: 'Reviews', href: '/seller/dashboard/customers/reviews' },
                { label: 'Wishlist', href: '/seller/dashboard/customers/wishlist' },
              ],
            },
          ],
        },
        {
          sectionTitle: 'MARKETING',
          items: [
            {
              label: 'Marketing',
              icon: <Megaphone className="w-4 h-4" />,
              subItems: [
                { label: 'Coupons', href: '/seller/dashboard/marketing/coupons' },
                { label: 'Discounts', href: '/seller/dashboard/marketing/discounts' },
                { label: 'Flash Sale', href: '/seller/dashboard/marketing/flash-sale' },
              ],
            },
          ],
        },
        {
          sectionTitle: 'FINANCE',
          items: [
            {
              label: 'Finance',
              icon: <DollarSign className="w-4 h-4" />,
              subItems: [
                { label: 'Earnings', href: '/seller/dashboard/finance' },
                { label: 'Wallet', href: '/seller/dashboard/finance/wallet' },
                { label: 'Withdraw', href: '/seller/dashboard/finance/withdraw' },
                { label: 'Transactions', href: '/seller/dashboard/finance/transactions' },
              ],
            },
          ],
        },
        {
          sectionTitle: 'ANALYTICS',
          items: [
            {
              label: 'Analytics',
              icon: <PieChart className="w-4 h-4" />,
              subItems: [
                { label: 'Sales', href: '/seller/dashboard/analytics' },
                { label: 'Revenue', href: '/seller/dashboard/analytics/revenue' },
                { label: 'Products', href: '/seller/dashboard/analytics/products' },
                { label: 'Customers', href: '/seller/dashboard/analytics/customers' },
              ],
            },
          ],
        },
        {
          sectionTitle: 'STORE',
          items: [
            {
              label: 'Store',
              icon: <Store className="w-4 h-4" />,
              subItems: [
                { label: 'Store Profile', href: '/seller/dashboard/store' },
                { label: 'Store Settings', href: '/seller/dashboard/store/settings' },
                { label: 'SEO', href: '/seller/dashboard/store/seo' },
                { label: 'Policies', href: '/seller/dashboard/store/policies' },
              ],
            },
            {
              label: 'Settings',
              href: '/seller/dashboard/settings',
              icon: <Sliders className="w-4 h-4" />,
            },
            {
              label: 'Delivery Charge Settings',
              href: '/seller/dashboard/delivery-settings',
              icon: <Truck className="w-4 h-4 text-emerald-400" />,
            },
            {
              label: 'My Profile & Security',
              href: '/seller/dashboard/profile',
              icon: <User className="w-4 h-4 text-purple-400" />,
            },
          ],
        },
      ];
    } else {
      // CUSTOMER
      const isBn = language === 'BN';
      return [
        {
          sectionTitle: isBn ? 'প্রধান মেনু' : 'MAIN',
          items: [
            {
              label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard',
              href: '/dashboard/customer',
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
            {
              label: isBn ? 'সার্ভিস বুকিং' : 'Service Bookings',
              href: '/dashboard/bookings',
              icon: <Calendar className="w-4 h-4" />,
            },
          ],
        },
        {
          sectionTitle: isBn ? 'অর্ডার ও শপিং' : 'ORDERS & SHOPPING',
          items: [
            {
              label: isBn ? 'আমার অর্ডারসমূহ' : 'My Orders',
              href: '/dashboard/orders',
              icon: <ShoppingBag className="w-4 h-4" />,
            },
            {
              label: isBn ? 'অর্ডার ট্র্যাকিং' : 'Track Order',
              href: '/dashboard/orders/track',
              icon: <Clock className="w-4 h-4" />,
            },
            {
              label: isBn ? 'পুনরায় কিনুন' : 'Buy Again',
              href: '/dashboard/buy-again',
              icon: <RefreshCcw className="w-4 h-4" />,
            },
            {
              label: isBn ? 'শপিং কার্ট' : 'Shopping Cart',
              href: '/dashboard/cart',
              icon: <ShoppingCart className="w-4 h-4" />,
            },
            {
              label: isBn ? 'উইশলিস্ট' : 'Wishlist',
              href: '/dashboard/wishlist',
              icon: <Star className="w-4 h-4" />,
            },
            {
              label: isBn ? 'সম্প্রতি দেখা পণ্য' : 'Recently Viewed',
              href: '/dashboard/recently-viewed',
              icon: <Layers className="w-4 h-4" />,
            },
            {
              label: isBn ? 'রিটার্ন ও রিফান্ড' : 'Return & Refunds',
              href: '/dashboard/refunds',
              icon: <ClipboardList className="w-4 h-4" />,
            },
          ],
        },
        {
          sectionTitle: isBn ? 'যোগাযোগ ও মতামত' : 'ENGAGEMENT',
          items: [
            {
              label: isBn ? 'রিভিউসমূহ' : 'Reviews',
              href: '/dashboard/reviews',
              icon: <Star className="w-4 h-4" />,
            },
            {
              label: isBn ? 'মেসেজ ইনবক্স' : 'Messages',
              href: '/dashboard/messages',
              icon: <MessageSquare className="w-4 h-4" />,
            },
            {
              label: isBn ? 'নোটিফিকেশন' : 'Notifications',
              href: '/dashboard/notifications',
              icon: <Megaphone className="w-4 h-4" />,
            },
          ],
        },
        {
          sectionTitle: isBn ? 'অ্যাকাউন্ট ও সিকিউরিটি' : 'FINANCE & ACCOUNT',
          items: [
            {
              label: isBn ? 'সংরক্ষিত ঠিকানা' : 'Saved Addresses',
              href: '/dashboard/addresses',
              icon: <MapPin className="w-4 h-4" />,
            },
            {
              label: isBn ? 'পেমেন্ট হিস্ট্রি' : 'Payment History',
              href: '/dashboard/payments',
              icon: <Wallet className="w-4 h-4" />,
            },
            {
              label: isBn ? 'কুপন ও রিওয়ার্ড' : 'Coupons & Rewards',
              href: '/dashboard/coupons',
              icon: <Award className="w-4 h-4" />,
            },
            {
              label: isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings',
              href: '/dashboard/profile',
              icon: <User className="w-4 h-4" />,
            },
            {
              label: isBn ? 'সিকিউরিটি' : 'Security',
              href: '/dashboard/security',
              icon: <ShieldAlert className="w-4 h-4" />,
            },
            {
              label: isBn ? 'সহায়তা টিকেট' : 'Support Tickets',
              href: '/dashboard/support',
              icon: <Mail className="w-4 h-4" />,
            },
          ],
        },
      ];
    }
  };

  const handleSignOut = async () => {
    await logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  const navGroups = getRoleNavGroups();

  const sidebarContent = (
    <aside
      className={`h-full shrink-0 bg-[#1e1f32] text-slate-200 border-r border-white/10 flex flex-col justify-between overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* MORVIN Brand & Logo Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
              {siteName.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-black text-base tracking-wider text-white truncate block">{siteName}</span>
                <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-widest truncate">
                  Platform Workspace
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* MORVIN Profile Badge Section */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 my-3 rounded-2xl bg-gradient-to-b from-[#282a45] to-[#202237] border border-white/10 text-center space-y-2 shadow-inner shrink-0">
            <div className="relative inline-block">
              <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 shadow-md overflow-hidden">
                {mounted && user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#181928] flex items-center justify-center text-white font-extrabold text-lg">
                    <span suppressHydrationWarning>{(mounted && user?.name && user.name[0]) || 'U'}</span>
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#181928]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white" suppressHydrationWarning>{(mounted && user?.name) || 'Account Workspace'}</h3>
              <p className="text-[11px] text-indigo-300 capitalize" suppressHydrationWarning>
                {effectiveRole === 'SUPER_ADMIN' ? 'Super Administrator' : effectiveRole === 'SELLER' ? 'Shop Owner · Seller' : effectiveRole === 'PROVIDER' ? 'Service Operations Manager' : effectiveRole === 'ADMIN' ? 'Platform Administrator' : `${effectiveRole.toLowerCase()} account`}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Section — Independent Scroll */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {navGroups.map((group) => (
            <div key={group.sectionTitle} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {group.sectionTitle}
                </div>
              )}

              {group.items.map((item) => {
                const hasSub = !!item.subItems?.length;
                const isOpen = openAccordion === item.label;
                const isActive = item.href
                  ? item.href.includes('#')
                    ? (pathname + currentHash) === item.href
                    : pathname === item.href && !currentHash
                  : false;

                if (hasSub) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        onClick={() => toggleAccordion(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isOpen
                            ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-indigo-400">{item.icon}</span>
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white ${item.badgeBg || 'bg-indigo-500'}`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90 text-indigo-300' : 'text-slate-500'}`}
                            />
                          </div>
                        )}
                      </button>

                      {isOpen && !isCollapsed && (
                        <div className="pl-9 pr-2 space-y-1 text-[11px]">
                          {item.subItems?.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className={`block py-1.5 px-3 rounded-lg transition-colors ${pathname === sub.href
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href || '#'}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-indigo-400'}>{item.icon}</span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white ${item.badgeBg || 'bg-indigo-500'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Signout Footer */}
      <div className="p-3 border-t border-white/10 bg-[#181928]/50 shrink-0 space-y-2">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'p-2' : ''
            }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-72 max-w-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
