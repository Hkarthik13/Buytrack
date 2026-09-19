'use client';

import React, { useState, useRef } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import {
  X,
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

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
    'Uploading receipt file...',
    'Scanning OCR text & line items with AI...',
    'Extracting product, brand, store & pricing...',
    'Analyzing warranty & EMI breakdown...',
  ];

  const handleFileUpload = (file: File) => {
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      await processReceipt(base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = async (base64: string, mimeType: string, fileName: string) => {
    setIsScanning(true);
    setScanStep(0);

    // Simulate animated scanning steps
    const timer1 = setTimeout(() => setScanStep(1), 700);
    const timer2 = setTimeout(() => setScanStep(2), 1500);
    const timer3 = setTimeout(() => setScanStep(3), 2200);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          fileName,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setTimeout(() => {
          setIsScanning(false);
          setIsScannerOpen(false);
          setExtractedReviewData({
            data: json.data,
            receiptUrl: base64,
          });
        }, 2600);
      } else {
        throw new Error(json.error || 'Failed to extract receipt');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsScanning(false);
      setErrorMessage(
        "Couldn't confidently read this receipt. You can still enter details manually."
      );
    }
  };

  const handleQuickDemoScan = (type: 'tv' | 'macbook' | 'dyson') => {
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
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Scan or Upload Receipt
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            AI extracts product details, price, warranty & EMI schedule instantly.
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,application/pdf"
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
          <div className="py-8 text-center space-y-6">
            <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500 bg-slate-950 shadow-glow">
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
                <span>Analyzing Receipt...</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                {steps[scanStep]}
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
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-all group"
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
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Upload Receipt</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG, WEBP, PDF</span>
              </button>
            </div>

            {/* Sample Receipts for Quick Testing */}
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
