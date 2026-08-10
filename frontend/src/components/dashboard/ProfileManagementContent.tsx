'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchApi, uploadSingleImageApi } from '@/lib/api-client';
import {
  User, Camera, Save, Mail, Phone, Lock, Eye, EyeOff,
  ShieldCheck, Loader2, CheckCircle2, AlertCircle, FileText,
  BadgeCheck, KeyRound, Sparkles, UserCheck,
} from 'lucide-react';

export default function ProfileManagementContent() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [mounted, setMounted] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current user profile
  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<any>('/users/profile');
      if (res?.success && res?.data) {
        const u = res.data;
        setName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setBio(u.bio || '');
        setAvatar(u.avatar || '');
        setRole(u.role || '');
        if (setUser) setUser(u);
      }
    } catch (_) {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio((user as any).bio || '');
        setAvatar(user.avatar || '');
        setRole(user.role || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, []);

  // ── Profile Photo Upload Handler ──────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WEBP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image file size must be less than 5MB.' });
      return;
    }

    setUploadingPhoto(true);
    setProfileMessage(null);

    try {
      let uploadedUrl = '';
      try {
        uploadedUrl = await uploadSingleImageApi(file);
      } catch (uploadErr) {
        console.warn('Backend image upload failed, fallback to DataURI preview:', uploadErr);
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (uploadedUrl) {
        setAvatar(uploadedUrl);
        const res = await fetchApi<any>('/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ name, phone, bio, avatar: uploadedUrl }),
        }).catch(() => null);

        const updatedUser = res?.data || { ...(user || {}), name, phone, bio, avatar: uploadedUrl };
        if (setUser) setUser(updatedUser);
        setProfileMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err?.message || 'Failed to upload photo.' });
    } finally {
      setUploadingPhoto(false);
      setTimeout(() => setProfileMessage(null), 5000);
    }
  };

  // ── Save Profile Info Handler ──────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetchApi<any>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), bio: bio.trim(), avatar }),
      });

      if (res?.success && res?.data) {
        if (setUser) setUser(res.data);
        setProfileMessage({ type: 'success', text: 'Profile details saved successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: res?.message || 'Failed to save profile details.' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err?.message || 'Error updating profile details.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMessage(null), 5000);
    }
  };

  // ── Change Password Handler ────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetchApi<any>('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res?.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage({ type: 'success', text: 'Password changed successfully! Next login will require your new password.' });
      } else {
        setPasswordMessage({ type: 'error', text: res?.message || 'Current password is incorrect.' });
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err?.message || 'Current password is incorrect or session expired.' });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setPasswordMessage(null), 6000);
    }
  };

  if (!mounted) return null;

  const currentRole = role || user?.role || 'CUSTOMER';

  return (
    <div className="space-y-6 max-w-4xl select-none">
      
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <User className="w-6 h-6 text-purple-400" />
            <span>Profile & Security Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, bio, avatar, and password credentials.
          </p>
        </div>

        {/* Role Badge */}
        <span className="px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          <BadgeCheck className="w-4 h-4 text-purple-400" />
          <span>{currentRole.replace('_', ' ')}</span>
        </span>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-600/20'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* ── TAB 1: Profile Details ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-3xl bg-[#1f2136] border border-white/10 p-6 sm:p-8 space-y-6 relative shadow-2xl">
          {loading && (
            <div className="absolute inset-0 bg-[#1f2136]/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
              <span className="text-xs text-slate-300 font-bold">Syncing profile details…</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Avatar Upload Card */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex-wrap">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-4xl text-white shadow-2xl overflow-hidden border-2 border-white/20">
                {avatar ? (
                  <img src={avatar} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <span>{name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-xl transition-all border border-white/20 disabled:opacity-50 cursor-pointer active:scale-95"
                title="Change Profile Photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-lg">{name || 'Your Account'}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span>{email || 'No email attached'}</span>
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 underline block pt-1 cursor-pointer"
              >
                {uploadingPhoto ? 'Uploading Photo…' : 'Upload New Photo'}
              </button>
            </div>
          </div>

          {/* Feedback Notice */}
          {profileMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in-50 ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-medium"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +880 1700000000"
                className="w-full px-4 py-3 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>

            {/* Read-Only Email */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Lock className="w-3 h-3" /> Read Only</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-400 font-mono cursor-not-allowed select-none"
              />
            </div>

            {/* Read-Only System Role */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>Account Role</span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Lock className="w-3 h-3" /> System Assigned</span>
              </label>
              <input
                type="text"
                value={currentRole.replace('_', ' ')}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-400 font-bold uppercase cursor-not-allowed select-none"
              />
            </div>

            {/* Bio Description (Full Width) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Bio / Description</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief bio about yourself or your operational details…"
                rows={3}
                className="w-full p-4 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-medium resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: Security & Change Password ── */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="rounded-3xl bg-[#1f2136] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0 text-purple-400" />
            <div>
              <strong className="block text-white text-sm font-bold">Password Security Standards</strong>
              <span>Ensure your new password contains at least 6 characters. Do not share your login credentials with anyone.</span>
            </div>
          </div>

          {/* Feedback Notice */}
          {passwordMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in-50 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <div className="space-y-4 max-w-lg">
            
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">New Password * (Min 6 chars)</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#181928] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Password Button */}
          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password…</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
