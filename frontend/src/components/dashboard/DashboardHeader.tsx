'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { fetchApi } from '@/lib/api-client';
import {
  Menu,
  Mail,
  MessageSquare,
  Calendar,
  Printer,
  Search,
  Maximize,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Globe,
  Home,
  User as UserIcon,
} from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

import { useEffect } from 'react';

import { useNotificationStore } from '@/store/useNotificationStore';

export function DashboardHeader({ title = 'DASHBOARD', subtitle = 'Morvin > Dashboard > Executive Overview', onToggleSidebar }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { role, user, setUser, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Quick header toolbar modals
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'support', text: 'Hello resident! How can DOHS Sheba support team assist you today?', time: 'Just now' },
  ]);

  const [activeThreadId, setActiveThreadId] = useState('cust_1');
  const [customerThreads, setCustomerThreads] = useState([
    {
      id: 'cust_1',
      name: 'Lt. Col. Rahman',
      sub: 'Order #ORD-9945 (Grocery)',
      lastMsg: 'Is my Basmati Rice order shipped?',
      time: '10:45 AM',
      unread: 1,
      messages: [
        { sender: 'customer', text: 'Hello seller! Is my Basmati Rice and Milk order ready?', time: '10:30 AM' },
        { sender: 'seller', text: 'Hello sir! Your order is packed and assigned to rider Tariqul.', time: '10:35 AM' },
        { sender: 'customer', text: 'Is my Basmati Rice order shipped?', time: '10:45 AM' },
      ],
    },
    {
      id: 'cust_2',
      name: 'Major Eahsanol',
      sub: 'Inquiry (Fresh Broiler Chicken)',
      lastMsg: 'Do you have fresh organic eggs in stock?',
      time: '09:20 AM',
      unread: 0,
      messages: [
        { sender: 'customer', text: 'Do you have fresh organic eggs in stock?', time: '09:20 AM' },
      ],
    },
    {
      id: 'cust_3',
      name: 'DOHS Admin Support Desk',
      sub: 'Platform Helpline Desk',
      lastMsg: 'Your store profile is verified and active.',
      time: 'Yesterday',
      unread: 0,
      messages: [
        { sender: 'support', text: 'Your store profile is verified and active.', time: 'Yesterday' },
      ],
    },
  ]);

  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
    fetchApi<any>('/users/profile')
      .then((res) => {
        if (res.success && res.data && setUser) {
          setUser(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');

    if (role === 'SELLER') {
      setCustomerThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === activeThreadId) {
            return {
              ...thread,
              lastMsg: userMsg,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: [
                ...thread.messages,
                { sender: 'seller', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ],
            };
          }
          return thread;
        })
      );
    } else {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }

    try {
      await fetchApi('/admin/chat/send', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      }).catch(() => null);
    } catch (err) {
      console.error('Error sending chat msg:', err);
    }
  };

  const handleSignOut = async () => {
    await logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full bg-[#181928]/95 backdrop-blur-xl border-b border-white/10 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 shadow-xl transition-all overflow-hidden max-w-full">
      {/* Top Left Navigation Icons & Mobile Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 shrink-0"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 border-r border-white/10 pr-3 shrink-0">
          {/* 1. Messages / Mail Icon */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 transition-all border border-white/5"
            title="Messages & Inbox Notifications"
          >
            <Mail className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            )}
          </Link>

          {/* 2. Live Chat Icon */}
          <button
            onClick={() => setShowChatModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all border border-white/5"
            title="Resident Live Support Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* 3. Calendar Icon */}
          <button
            onClick={() => setShowCalendarModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 transition-all border border-white/5"
            title="Community Schedule & Booking Calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* 4. Print Icon */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white/5 hover:bg-amber-600/20 hover:text-amber-300 transition-all border border-white/5"
            title="Print Current Page / Receipt"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Breadcrumbs */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase truncate">
            {language === 'BN' ? (title === 'CUSTOMER DASHBOARD' ? 'কাস্টমার ড্যাশবোর্ড' : title) : title}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-indigo-300/80 font-medium truncate hidden sm:block">
            {language === 'BN' ? 'ডিএইচএস রেসিডেন্ট › কাস্টমার ওয়ার্কস্পেস' : subtitle}
          </p>
        </div>
      </div>

      {/* Top Right Header Controls */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Search */}
        <div className="relative hidden lg:block w-40 xl:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'BN' ? 'ড্যাশবোর্ড সার্চ...' : 'Search dashboard...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#202237] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Language Selector (EN / BN Toggle) */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#202237] hover:bg-[#282a44] border border-white/10 text-xs text-slate-200 transition-all font-bold shrink-0"
          >
            {language === 'EN' ? (
              <>
                <span className="text-sm">🇺🇸</span>
                <span className="hidden sm:inline">English</span>
              </>
            ) : (
              <>
                <span className="text-sm">🇧🇩</span>
                <span className="hidden sm:inline">বাংলা</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLanguageDropdown && (
            <div className="absolute right-0 mt-2 w-36 bg-[#202237] border border-white/10 rounded-xl shadow-xl z-50 py-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setLanguage('EN');
                  setShowLanguageDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center justify-between transition-colors ${
                  language === 'EN' ? 'text-indigo-400 font-bold bg-white/5' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span> English
                </div>
                {language === 'EN' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => {
                  setLanguage('BN');
                  setShowLanguageDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center justify-between transition-colors ${
                  language === 'BN' ? 'text-indigo-400 font-bold bg-white/5' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇧🇩</span> বাংলা (Bangla)
                </div>
                {language === 'BN' && <span className="text-xs">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="p-2 rounded-lg bg-[#202237] hover:bg-[#282a44] border border-white/10 text-slate-300 hover:text-white transition-colors hidden md:block shrink-0"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Notification Dropdown Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 sm:p-2 rounded-lg bg-[#202237] hover:bg-[#282a44] border border-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-[#181928] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#202237] border border-white/10 rounded-2xl shadow-2xl z-50 p-3.5 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  Notifications ({unreadCount > 0 ? `${unreadCount} unread` : notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-[11px]">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || '/dashboard/notifications'}
                      onClick={() => {
                        markAsRead(n.id);
                        setShowNotifications(false);
                      }}
                      className={`block p-2.5 rounded-xl border transition-all ${
                        !n.read
                          ? 'bg-indigo-600/10 border-indigo-500/30'
                          : 'bg-white/5 border-white/5 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white truncate max-w-[180px]">{n.title}</div>
                        <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 line-clamp-2">{n.desc}</div>
                    </Link>
                  ))
                )}
              </div>

              <Link
                href="/dashboard/notifications"
                onClick={() => setShowNotifications(false)}
                className="block text-center text-[11px] font-bold text-indigo-400 hover:text-indigo-300 pt-2 border-t border-white/10"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>

        {/* User Profile Quick Info */}
        {(() => {
          const profileHref =
            role === 'SUPER_ADMIN' || role === 'ADMIN'
              ? '/admin/dashboard/profile'
              : role === 'SELLER'
              ? '/seller/dashboard/profile'
              : role === 'RIDER'
              ? '/rider/dashboard/profile'
              : '/dashboard/profile';

          return (
            <Link
              href={profileHref}
              className="flex items-center gap-2 pl-1.5 sm:pl-2.5 border-l border-white/10 shrink-0 hover:opacity-90 transition-opacity group cursor-pointer"
              title="My Profile & Security Settings"
            >
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-indigo-400/50 flex items-center justify-center font-bold text-white text-xs overflow-hidden group-hover:scale-105 transition-transform">
                  {mounted && user?.avatar ? (
                    <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span suppressHydrationWarning>{(mounted && user?.name && user.name[0]) || 'U'}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 border-2 border-[#181928]" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors" suppressHydrationWarning>
                  {(mounted && user?.name) || 'Account Workspace'}
                </div>
                <div className="text-[10px] text-indigo-300 capitalize" suppressHydrationWarning>
                  {(mounted && role && role !== 'GUEST') ? role.toLowerCase() : 'Account'}
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Sign Out Button */}
        <button onClick={handleSignOut} className="p-1.5 sm:p-2 rounded-lg bg-[#202237] hover:bg-red-500/20 border border-white/10 text-slate-300 hover:text-red-400 transition-colors shrink-0" title="Sign Out">
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Live Customer & Support Chat Modal (React Portal to document.body for guaranteed screen centering) */}
      {showChatModal && mounted && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#1e1f32] border border-white/10 rounded-3xl max-w-3xl w-full h-[560px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row my-auto">
            
            {/* If Seller, show customer threads left sidebar */}
            {role === 'SELLER' && (
              <div className="w-full md:w-64 bg-[#181928] border-r border-white/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/10">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Customer Messages</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select a customer to reply</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                  {customerThreads.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setActiveThreadId(th.id)}
                      className={`w-full p-3 text-left transition-all flex items-start gap-2.5 ${
                        activeThreadId === th.id ? 'bg-emerald-600/20 border-l-4 border-emerald-500' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {th.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-white truncate">{th.name}</h5>
                          <span className="text-[9px] text-slate-500">{th.time}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-medium truncate">{th.sub}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{th.lastMsg}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Chat Thread Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f32]">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {role === 'SELLER'
                        ? (customerThreads.find((t) => t.id === activeThreadId)?.name || 'Customer Message Reply')
                        : 'DOHS Resident Live Support'}
                    </h3>
                    <p className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{role === 'SELLER' ? 'Customer Inquiry Channel' : 'Online Support Helpline'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://wa.me/8801306031982"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs font-bold"
                  >
                    WhatsApp
                  </a>
                  <button
                    onClick={() => setShowChatModal(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#181928] custom-scrollbar">
                {role === 'SELLER' ? (
                  customerThreads
                    .find((t) => t.id === activeThreadId)
                    ?.messages.map((m, i) => {
                      const isMe = m.sender === 'seller';
                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-slate-400 font-semibold mb-0.5 px-1">{isMe ? 'You (Store Owner)' : 'Customer'}</span>
                          <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                                : 'bg-[#282a44] text-slate-200 border border-white/10 rounded-bl-none'
                            }`}
                          >
                            {m.text}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
                        </div>
                      );
                    })
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-br-none shadow-md'
                            : 'bg-[#282a44] text-slate-200 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/10 bg-[#1f2136] flex gap-2">
                <input
                  type="text"
                  placeholder={
                    role === 'SELLER'
                      ? 'কাস্টমারকে উত্তর দিন (Type reply to customer)...'
                      : language === 'BN'
                      ? 'মেসেজ টাইপ করুন...'
                      : 'Type message to support...'
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {role === 'SELLER' ? 'Reply' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Community Calendar Modal */}
      {showCalendarModal && mounted && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#1e1f32] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> DOHS Community Calendar
              </h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                <span className="font-bold block text-sm">📅 Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <p className="text-[11px] text-slate-300 mt-1">DOHS Sheba marketplace and service bookings schedule</p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">Community Pest Control Drive</span>
                    <span className="text-[10px] text-slate-400">DOHS Mirpur Block B & C</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">10:00 AM</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">Water Purifier Filter Maintenance</span>
                    <span className="text-[10px] text-slate-400">Confirmed Booking Service</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">03:30 PM</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowCalendarModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
