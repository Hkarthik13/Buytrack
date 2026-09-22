'use client';

import React, { useState, useRef } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { optimizeReceiptImage } from '@/lib/utils/imageOptimizer';
import { performClientOCR } from '@/lib/ocr/clientOcr';
import {
  X,
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Zap,
} from 'lucide-react';

function isUsableExtraction(data: any) {
  if (!data) return false;
  const hasRealProduct = Boolean(data.product_name && data.product_name !== 'Purchased Item');
  const hasPrice = Number(data.final_price || data.original_price || 0) > 0;
  const hasSeller = Boolean(data.store && data.store !== 'Retail Store');
  const hasBrand = Boolean(data.brand && data.brand !== 'Unknown Brand');
  const confidence = Number(data.confidence_score || 0);

  return confidence >= 0.72 || (hasRealProduct && hasPrice) || (hasPrice && (hasSeller || hasBrand));
}

export default function ReceiptScannerModal() {
  const { isScannerOpen, setIsScannerOpen, setExtractedReviewData } = usePurchases();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isScannerOpen) return null;

  const steps = [
    'Optimizing receipt image...',
    'Scanning text & line items with OCR...',
    'Extracting product, brand, store & price...',
    'Finalizing warranty & EMI details...',
  ];

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds 20MB limit.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);
    setScanStep(0);

    try {
      // 1. Instant client-side compression (< 150ms)
      const optimized = await optimizeReceiptImage(file);
      setPreviewImage(optimized.base64);
      await processReceipt(optimized.base64, optimized.mimeType, file.name);
    } catch (err) {
      console.error('File optimization error:', err);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        setPreviewImage(rawBase64);
        await processReceipt(rawBase64, file.type || 'image/jpeg', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async (base64: string, mimeType: string, fileName: string) => {
    setIsScanning(true);
    setScanStep(1);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);

    try {
      // 1. Try server OCR first, but only accept it when the parsed fields are strong.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let extractedData = null;

      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: base64,
            mimeType,
            fileName,
          }),
        });

        clearTimeout(timeoutId);
        const json = await res.json();

        if (json.success && isUsableExtraction(json.data)) {
          extractedData = json.data;
        }
      } catch (serverErr) {
        console.log('Server OCR skipped/timed out, switching to client OCR');
      } finally {
        clearTimeout(timeoutId);
      }

      // 2. If server did not return usable data, run client-side OCR as a second pass.
      if (!isUsableExtraction(extractedData)) {
        setScanStep(2);
        extractedData = await performClientOCR(base64);
      }

      clearInterval(stepInterval);
      setScanStep(3);

      setTimeout(() => {
        setIsScanning(false);
        setIsScannerOpen(false);
        setExtractedReviewData({
          data: extractedData,
          receiptUrl: base64,
        });
      }, 500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsScanning(false);
      setErrorMessage(
        "Couldn't read receipt clearly. You can still review and enter details manually."
      );
    }
  };

  const handleQuickDemoScan = async (type: 'tv' | 'macbook' | 'dyson') => {
    let mockUrl = 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80';
    if (type === 'macbook') {
      mockUrl = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
    } else if (type === 'dyson') {
      mockUrl = 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80';
    }
    setPreviewImage(mockUrl);
    processReceipt(mockUrl, 'image/jpeg', `${type}-receipt.jpg`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Close Button */}
        {!isScanning && (
          <button
            onClick={() => {
              setIsScannerOpen(false);
              setPreviewImage(null);
              setErrorMessage(null);
            }}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <span>Scan Receipt</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Zap className="w-2.5 h-2.5" /> Turbo OCR
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            AI & OCR automatically extracts products, store, prices, warranty & EMI schedule.
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        {/* Scanning Progress Screen */}
        {isScanning ? (
          <div className="py-6 text-center space-y-5">
            <div className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500 bg-slate-950 shadow-glow">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Receipt Preview"
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <FileText className="w-16 h-16" />
                </div>
              )}
              
              {/* Laser beam */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-scan" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Reading Bill Details...</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {steps[scanStep] || 'Finalizing data...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Button for Mobile */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Take Photo</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Open mobile camera</span>
              </button>

              {/* Gallery / File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Upload Receipt</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG, WEBP</span>
              </button>
            </div>

            {/* Quick Demo Options */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Or Try Sample Invoices
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickDemoScan('tv')}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors truncate"
                >
                  📺 Sony 4K TV
                </button>
                <button
                  onClick={() => handleQuickDemoScan('macbook')}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors truncate"
                >
                  💻 MacBook Air
                </button>
                <button
                  onClick={() => handleQuickDemoScan('dyson')}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors truncate"
                >
                  🧹 Dyson V12
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
