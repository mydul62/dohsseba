'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, uploadMultipleImagesApi } from '@/lib/api-client';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Plus, 
  ExternalLink, 
  Search, 
  Loader2, 
  RefreshCw,
  Trash2,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

interface MediaItem {
  filename: string;
  url: string;
  size: number;
  mtime: string;
}

export default function SellerMediaGalleryPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any>('/upload/gallery');
      if (res && res.success && Array.isArray(res.data?.media)) {
        setMediaList(res.data.media);
      } else {
        setMediaList([]);
      }
    } catch (err) {
      console.error('Failed to load media gallery:', err);
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    try {
      setUploading(true);
      setUploadProgress(`Processing & Uploading ${fileArray.length} images...`);

      const uploadedUrls = await uploadMultipleImagesApi(fileArray);

      setUploadProgress(`Successfully uploaded ${uploadedUrls.length} images!`);
      setTimeout(() => setUploadProgress(null), 4000);

      // Refresh gallery
      await fetchGallery();
    } catch (err: any) {
      alert(err?.message || 'Failed to upload images');
      setUploadProgress(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteMedia = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete image "${filename}" permanently from server storage?`)) return;

    try {
      const res = await fetchApi<any>(`/upload/gallery/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setMediaList((prev) => prev.filter((item) => item.filename !== filename));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete image file.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredMedia = mediaList.filter((item) =>
    !searchTerm || item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Hidden Bulk Input File Element */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleBulkUpload}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#1e1f32] border border-white/10 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <ImageIcon className="w-3.5 h-3.5" />
            Media Assets & Storage
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Media Gallery ({mediaList.length} Files)
          </h1>
          <p className="text-xs text-slate-400">
            Upload, manage, copy links, or delete product images stored on the server.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchGallery}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-colors"
            title="Refresh gallery"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{uploading ? 'Uploading...' : '📤 Import 20+ Images from PC'}</span>
          </button>

          <Link
            href="/seller/dashboard/products/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Upload Progress Banner */}
      {uploadProgress && (
        <div className="p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-bold flex items-center gap-3 shadow-xl animate-in fade-in">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by filename or image ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#1e1f32] border border-white/10 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#1e1f32]/50 border border-white/5 rounded-2xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading uploaded media files...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#1e1f32]/50 border border-white/5 rounded-2xl text-center p-6">
          <ImageIcon className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No media files found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm ? 'No images match your search filter.' : 'You have not uploaded any product images yet.'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Import Images Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => {
            const isCopied = copiedUrl === item.url;
            return (
              <div
                key={item.filename}
                className="group relative bg-[#1e1f32] border border-white/10 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full bg-[#141522] overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Overlay buttons on hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-2">
                    <button
                      onClick={() => handleCopyUrl(item.url)}
                      className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'URL Copied!' : 'Copy URL'}
                    </button>

                    <Link
                      href={`/seller/dashboard/products/add?image=${encodeURIComponent(item.url)}`}
                      className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Product
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item.filename)}
                      className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                      title="Delete image from server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Image
                    </button>
                  </div>
                </div>

                {/* File info footer */}
                <div className="p-2.5 bg-[#181928] border-t border-white/5 space-y-0.5">
                  <p className="text-[11px] font-semibold text-slate-200 truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{new Date(item.mtime).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
