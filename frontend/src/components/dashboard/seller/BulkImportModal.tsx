'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet, Upload, Download, X, CheckCircle2,
  AlertCircle, Loader2, Sparkles, HelpCircle, Layers, Check
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

import * as XLSX from 'xlsx';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; categoriesCreated: number } | null>(null);

  if (!isOpen) return null;

  // Generate Sample CSV Template for download
  const handleDownloadSample = () => {
    const csvContent =
      'Product Name,Category,SubCategory,Brand,Price,Discount,Stock,Unit,Description\n' +
      'তীর ফ্রেশ ময়দা (২ কেজি),Daily Groceries,Flour,Teer,130,5,50,kg,Fresh refined flour for baking and cooking\n' +
      'পদ্মার খাঁটি ইলিশ মাছ (1kg),Fish & Seafood,Marine Fish,Padma,1200,0,20,kg,Authentic Padma Hilsha fish freshly caught\n' +
      'ভিআইএম লিকুইড 250ml,Household & Cleaning,Dishwash,Vim,110,0,35,pc,Powerful dishwashing liquid soap\n' +
      'রূপচাঁদা সয়াবিন তেল 2L,Groceries & Oil,Edible Oil,Rupchanda,380,10,40,bottle,Pure refined soybean oil\n' +
      'দেশি ফার্মের ডিম (১২টি),Dairy & Eggs,Eggs,Farm,155,0,100,pack,Farm fresh organic eggs';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'DOHS_Bulk_Product_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseExcelFile = async (uploadedFile: File): Promise<any[]> => {
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
    return rawRows;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel or CSV file to import.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const items = await parseExcelFile(file);

      if (!items || items.length === 0) {
        throw new Error('No valid product rows found in the Excel file. Please check file formatting.');
      }

      const res = await fetchApi<any>('/products/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });

      if (res && res.success && res.data) {
        setResult({
          count: res.data.count || items.length,
          categoriesCreated: res.data.categoriesCreated || 0,
        });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        throw new Error(res?.message || 'Failed to import products.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while importing products.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-[#191a2d] border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Bulk Excel Product Importer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Upload 500–1,000 products at once directly to Drafts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Download Template */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Step 1: Need a sample Excel template?
            </span>
            <p className="text-[11px] text-slate-400">Download formatted CSV template with required product columns.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Template
          </button>
        </div>

        {/* Info Box: Default Draft Status */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-300">Default Draft Status</span>
            All imported products will initially be saved as <strong className="text-white font-black">Drafts</strong> (`isActive: false`). You can review them in the <strong>Drafts</strong> tab and publish all 500+ products in 1-click using <strong>Publish Selected</strong>.
          </div>
        </div>

        {/* Step 2: File Upload Zone */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Step 2: Choose your Excel / CSV file</label>
          <div
            onClick={() => document.getElementById('excelFileInput')?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/15 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
            }`}
          >
            <input
              id="excelFileInput"
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setError(null);
                }
              }}
            />
            {file ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-xs text-emerald-300">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB — Ready for bulk import</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
                <p className="font-bold text-xs text-slate-200">Click or drag & drop your `.csv` / `.xlsx` file here</p>
                <p className="text-[10px] text-slate-400">Supports Product Name, Price, Stock, Category, Discount & Units</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Bulk Import Successful!
            </div>
            <p>Successfully imported <strong>{result.count}</strong> products directly into <strong>Drafts</strong>.</p>
            {result.categoriesCreated > 0 && (
              <p className="text-[11px] text-emerald-400/80">Auto-created {result.categoriesCreated} new categories in database.</p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing 500+ Items…</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Import to Drafts</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
