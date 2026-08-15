'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Plus, 
  ExternalLink, 
  Search, 
  Loader2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface MediaItem {
  filename: string;
  url: string;
  size: number;
  mtime: string;
}

export default function SellerMediaGalleryPage() {
  const router = useRouter();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ total: number; media: MediaItem[] }>('/upload/gallery');
      if (res.success && res.data?.media) {
        setMediaList(res.data.media);
      }
    } catch (err) {
      console.error('Failed to load media gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredMedia = mediaList.filter((item) =>
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1f32] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Media Gallery
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {mediaList.length} Uploaded Files
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse and reuse all your uploaded product images from your server
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl border border-white/10 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => handleCopyUrl(item.url)}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'URL Copied!' : 'Copy URL'}
                    </button>

                    <Link
                      href={`/seller/dashboard/products/add?image=${encodeURIComponent(item.url)}`}
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Product
                    </Link>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Full
                    </a>
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
