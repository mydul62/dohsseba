'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fetchApi, uploadMultipleImagesApi } from '@/lib/api-client';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  Loader2, 
  RefreshCw,
  Trash2,
  UploadCloud,
  CheckCircle2,
  CheckSquare,
  Square,
  LayoutGrid,
  Grid2x2,
  Grid3x3,
  List,
  Edit3,
  X,
  FileEdit
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

  // Column Grid & View Mode State
  const [viewMode, setViewMode] = useState<'grid-2' | 'grid-3' | 'grid-4' | 'grid-6' | 'list'>('grid-4');

  // Multiple selection state
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Rename Modal State
  const [renamingItem, setRenamingItem] = useState<MediaItem | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renamingLoading, setRenamingLoading] = useState(false);

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

  const handleDeleteSingle = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete image "${filename}" permanently from server storage?`)) return;

    try {
      const res = await fetchApi<any>(`/upload/gallery/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setMediaList((prev) => prev.filter((item) => item.filename !== filename));
        setSelectedFilenames((prev) => prev.filter((name) => name !== filename));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete image file.');
    }
  };

  // ─── Rename Logic ───
  const openRenameModal = (item: MediaItem) => {
    setRenamingItem(item);
    setRenameInput(item.filename);
  };

  const handleRenameSubmit = async () => {
    if (!renamingItem || !renameInput.trim()) return;

    try {
      setRenamingLoading(true);
      const res = await fetchApi<any>('/upload/gallery/rename', {
        method: 'PATCH',
        body: JSON.stringify({
          oldFilename: renamingItem.filename,
          newFilename: renameInput.trim(),
        }),
      });

      if (res && res.success && res.data) {
        const { oldFilename, newFilename, url } = res.data;
        setMediaList((prev) =>
          prev.map((item) =>
            item.filename === oldFilename
              ? { ...item, filename: newFilename, url: url || item.url }
              : item
          )
        );
        setSelectedFilenames((prev) =>
          prev.map((name) => (name === oldFilename ? newFilename : name))
        );
        setRenamingItem(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to rename image');
    } finally {
      setRenamingLoading(false);
    }
  };

  // ─── Multiple Selection Logic ───
  const filteredMedia = mediaList.filter((item) =>
    !searchTerm || item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (filename: string) => {
    setSelectedFilenames((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFilenames.length === filteredMedia.length) {
      setSelectedFilenames([]);
    } else {
      setSelectedFilenames(filteredMedia.map((m) => m.filename));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFilenames.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFilenames.length} selected image(s) permanently from server storage?`)) return;

    try {
      setDeletingBulk(true);
      const res = await fetchApi<any>('/upload/gallery/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ filenames: selectedFilenames }),
      });

      if (res && res.success) {
        const deletedSet = new Set(selectedFilenames);
        setMediaList((prev) => prev.filter((item) => !deletedSet.has(item.filename)));
        setSelectedFilenames([]);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete selected images');
    } finally {
      setDeletingBulk(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const allSelected = filteredMedia.length > 0 && selectedFilenames.length === filteredMedia.length;

  const gridClass = 
    viewMode === 'grid-2' ? 'grid-cols-1 sm:grid-cols-2 gap-4' :
    viewMode === 'grid-3' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' :
    viewMode === 'grid-6' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3' :
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'; // default grid-4

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 pb-20 font-sans">
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
            Media Gallery & Image Manager
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Media Gallery ({mediaList.length} Files Uploaded)
          </h1>
          <p className="text-xs text-slate-400">
            Import images from PC, switch 1-6 grid columns, rename files, copy links, or bulk delete photos.
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

      {/* Toolbar: Grid Layout Switcher & Bulk Selection Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-[#181928] border border-white/10 rounded-2xl">
        {/* Left: Bulk Selection & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{allSelected ? 'Deselect All' : `Select All (${filteredMedia.length})`}</span>
          </button>

          {selectedFilenames.length > 0 && (
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              {selectedFilenames.length} Selected
            </span>
          )}

          {selectedFilenames.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deletingBulk}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              {deletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete Selected ({selectedFilenames.length})</span>
            </button>
          )}
        </div>

        {/* Right: Grid Layout View Switcher (1-6 Cols or List Row View) */}
        <div className="flex items-center gap-1.5 bg-[#121320] p-1 rounded-xl border border-white/10">
          <span className="text-[11px] font-bold text-slate-400 px-2 select-none">View Mode:</span>
          
          <button
            type="button"
            onClick={() => setViewMode('grid-2')}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'grid-2' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="2 Grid Columns View"
          >
            <Grid2x2 className="w-4 h-4" /> 2 Cols
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid-4')}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'grid-4' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="4 Grid Columns View (Standard)"
          >
            <LayoutGrid className="w-4 h-4" /> 4 Cols
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid-6')}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'grid-6' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="6 Grid Columns View (Compact)"
          >
            <Grid3x3 className="w-4 h-4" /> 6 Cols
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Row / List Table View Mode"
          >
            <List className="w-4 h-4" /> List Row
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search media files by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#1e1f32] border border-white/10 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {/* Media Grid / List Content */}
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
      ) : viewMode === 'list' ? (
        /* 📜 ROW LIST TABLE VIEW MODE */
        <div className="bg-[#1e1f32] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#171827] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5 w-10">Select</th>
                  <th className="p-3.5">Image</th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Upload Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMedia.map((item) => {
                  const isSelected = selectedFilenames.includes(item.filename);
                  const isCopied = copiedUrl === item.url;
                  return (
                    <tr key={item.filename} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-indigo-950/30' : ''}`}>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.filename)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                          <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-white text-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{item.filename}</span>
                          <button
                            type="button"
                            onClick={() => openRenameModal(item)}
                            className="p-1 hover:bg-white/10 text-amber-400 hover:text-amber-300 rounded transition-colors"
                            title="Rename image filename"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">{formatFileSize(item.size)}</td>
                      <td className="p-3.5 text-slate-400">{new Date(item.mtime).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleCopyUrl(item.url)}
                          className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-500/30 inline-flex items-center gap-1"
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Copied' : 'Copy URL'}
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(item.filename)}
                          className="px-2.5 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-rose-500/30 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 📱 💻 🖥️ GRID COLS VIEW MODES (2, 4, or 6 Columns) */
        <div className={`grid ${gridClass}`}>
          {filteredMedia.map((item) => {
            const isSelected = selectedFilenames.includes(item.filename);
            const isCopied = copiedUrl === item.url;

            return (
              <div
                key={item.filename}
                className={`group relative bg-[#1e1f32] border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col shadow-lg ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/20'
                    : 'border-white/10 hover:border-indigo-500/40'
                }`}
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

                  {/* Always Visible Top Controls: Checkbox & Direct Delete Button */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.filename)}
                      className={`p-1.5 rounded-lg border transition-all shadow-md ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 scale-110'
                          : 'bg-black/60 text-white/70 border-white/20 hover:bg-black/80 hover:text-white'
                      }`}
                      title="Select image for bulk deletion"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-white" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openRenameModal(item)}
                        className="p-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white shadow-md transition-all hover:scale-105"
                        title="Rename image filename"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(item.filename)}
                        className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-all hover:scale-105"
                        title="Delete image permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hover Overlay Menu */}
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
                    <button
                      onClick={() => handleCopyUrl(item.url)}
                      className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'URL Copied!' : 'Copy URL'}
                    </button>

                    <button
                      onClick={() => openRenameModal(item)}
                      className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      Rename Image
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSingle(item.filename)}
                      className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Image
                    </button>
                  </div>
                </div>

                {/* File info & action footer */}
                <div className="p-2.5 bg-[#181928] border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-semibold text-slate-200 truncate flex-1" title={item.filename}>
                      {item.filename}
                    </p>
                    <button
                      type="button"
                      onClick={() => openRenameModal(item)}
                      className="text-slate-400 hover:text-amber-300 text-[10px] font-bold p-0.5"
                      title="Rename"
                    >
                      ✏️
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatFileSize(item.size)}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSingle(item.filename)}
                      className="px-2 py-0.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-[10px] font-bold transition-all flex items-center gap-1"
                      title="Delete this image"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENAME IMAGE MODAL DIALOG */}
      {renamingItem && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f32] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">Rename Image Filename</h3>
              </div>
              <button onClick={() => setRenamingItem(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Current Filename:
                </label>
                <code className="block p-2 rounded-xl bg-[#121320] text-amber-300 font-mono text-xs truncate">
                  {renamingItem.filename}
                </code>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Filename:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="e.g. broiler_chicken.webp"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121320] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Extension (.webp, .jpg, .png) will be preserved automatically if omitted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setRenamingItem(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={renamingLoading || !renameInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {renamingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save New Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
