"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DepositConfig {
  depositAddress: string;
  qrImage: string;
  minDeposit: number;
  network: string;
}

const DepositPage = () => {
  const router = useRouter();
  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    fetchDepositConfig();
  }, []);

  const fetchDepositConfig = async () => {
    try {
      console.log('🔄 Fetching deposit config...');
      const response = await fetch('/api/settings/get');
      const data = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (data.success) {
        console.log('✅ Config loaded:', data.settings);
        console.log('🖼️ QR Image URL:', data.settings.qrImage);
        setConfig(data.settings);
      } else {
        console.error('❌ API Error:', data.message);
        setError(data.message || "Unable to load settings");
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err);
      setError("Error loading deposit information");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('File size must be less than 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!amount || parseFloat(amount) < (config?.minDeposit || 0)) {
      setSubmitError(`Minimum deposit: ${config?.minDeposit} USDT`);
      return;
    }
    if (!proofFile || !previewUrl) {
      setSubmitError('Please upload payment proof');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/deposit/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          proofImage: previewUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/deposit-history');
        }, 2000);
      } else {
        setSubmitError(data.message || 'Failed to submit deposit');
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-red-500 max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Error</h3>
          <p className="text-gray-600 text-sm">{error || "Unable to load deposit settings"}</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 text-sm mb-1">Deposit request submitted</p>
          <p className="text-xs text-gray-500">Redirecting to history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Professional Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Deposit USDT</h1>
            <p className="text-xs text-blue-100">TRC20 Network Only</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        
        {/* Error Alert */}
        {submitError && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Network</p>
            <p className="text-sm font-bold text-gray-900">{config.network}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Min. Deposit</p>
            <p className="text-sm font-bold text-green-600">{config.minDeposit} USDT</p>
          </div>
        </div>

       {/* QR Code Section */}
<div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
  <div className="flex justify-center mb-4">
    <div className="p-3 bg-gray-50 rounded-2xl border-2 border-gray-200">
      {config.qrImage ? (
        <img 
          src={config.qrImage} 
          alt="Deposit QR Code" 
          className="w-44 h-44 rounded-xl object-contain"
          referrerPolicy="no-referrer"
          onLoad={() => console.log('✅ QR Image loaded')}
          onError={(e) => {
            console.error('❌ QR Image failed to load');
            const target = e.target as HTMLImageElement;
            target.src = "https://placehold.co/400x400/e5e7eb/6b7280?text=QR+Code";
          }}
        />
      ) : (
        <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center">
          <p className="text-xs text-gray-500">No QR Code</p>
        </div>
      )}
    </div>
  </div>
  
  {/* Address with Professional Copy */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
      Deposit Address
    </p>
    <div className="flex items-center gap-2">
      <p className="text-xs font-mono text-gray-800 flex-1 break-all leading-relaxed">
        {config.depositAddress}
      </p>
      <button
        onClick={() => copyToClipboard(config.depositAddress)}
        className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
          copyStatus 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {copyStatus ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  </div>
</div>
        {/* Amount Input */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            Enter Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${config.minDeposit}`}
              className="w-full px-5 py-4 text-lg font-semibold text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-gray-50 transition"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-lg">
              USDT
            </span>
          </div>
        </div>

        {/* Upload Proof */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            Payment Proof
          </label>
          
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 bg-gradient-to-br from-gray-50 to-blue-50 transition group">
              <div className="p-3 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Tap to Upload</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG • Max 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Proof" 
                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
              />
              <button
                onClick={() => {
                  setProofFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-red-600 active:scale-95 transition"
              >
                ×
              </button>
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-800 truncate">{proofFile?.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Warning Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 font-bold text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">Important Notice</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Only send USDT via <strong>TRC20</strong> network to this address. 
                Wrong network = <strong>permanent loss of funds</strong>.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed Bottom Button - Professional */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <button
          onClick={handleSubmit}
          disabled={submitting || !amount || !proofFile}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 active:scale-98 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Submit Deposit Request</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Deposits are processed within 10-30 minutes
        </p>
      </div>

    </div>
  );
};

export default DepositPage;