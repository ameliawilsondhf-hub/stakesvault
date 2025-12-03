"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface DepositConfig {
  depositAddress: string;
  qrImage: string;
  minDeposit: number;
  network: string;
}

const DepositPage = () => {
  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);

  useEffect(() => {
    fetchDepositConfig();
  }, []);

  const fetchDepositConfig = async () => {
    try {
      const response = await fetch('/api/settings/get', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.settings);
        console.log("✅ Deposit config loaded:", data.settings);
      } else {
        setError(data.message || "Unable to load settings");
      }
    } catch (err) {
      console.error("❌ Config fetch error:", err);
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
        alert('File size must be less than 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < (config?.minDeposit || 0)) {
      alert(`Minimum deposit: ${config?.minDeposit} USDT`);
      return;
    }
    if (!proofFile) {
      alert('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('screenshot', proofFile);

      const response = await fetch('/api/deposit/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
      } else {
        alert(data.message || 'Failed to submit deposit');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting deposit request');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500 max-w-sm w-full">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-gray-700 font-medium">{error || "Error loading data"}</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submitted!</h2>
          <p className="text-gray-600 text-sm mb-4">Your deposit request is being processed</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Deposit USDT</h1>
        <p className="text-xs text-gray-500 mt-0.5">TRC20 Network</p>
      </div>

      <div className="p-4 space-y-4 pb-24">
        
        {/* Network Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Network</span>
            <span className="text-sm font-bold text-gray-900">{config.network}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Min. Deposit</span>
            <span className="text-sm font-bold text-green-600">{config.minDeposit} USDT</span>
          </div>
        </div>

        {/* QR Code - FIXED VERSION */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-3 text-center">Scan QR Code</p>
          <div className="flex justify-center mb-3">
            {!qrImageError && config.qrImage ? (
              <img 
                src={config.qrImage} 
                alt="Deposit QR Code" 
                className="w-48 h-48 rounded-lg border border-gray-200 bg-white object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                loading="eager"
                onLoad={() => {
                  console.log("✅ QR Code loaded successfully");
                  setQrImageError(false);
                }}
                onError={(e) => {
                  console.error("❌ QR Code failed to load:", config.qrImage);
                  const target = e.target as HTMLImageElement;
                  setQrImageError(true);
                  target.onerror = null;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%236b7280' font-size='18' font-weight='bold'%3EQR Code%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENot Available%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="w-48 h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">QR Code</p>
                  <p className="text-gray-400 text-xs">Not Available</p>
                </div>
              </div>
            )}
          </div>
          
          {qrImageError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
              <p className="text-xs text-red-600 text-center">
                ⚠️ QR code couldn't load. Please use the address below.
              </p>
            </div>
          )}
          
          {/* Address */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Deposit Address</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono text-gray-900 flex-1 break-all">
                {config.depositAddress}
              </p>
              <button
                onClick={() => copyToClipboard(config.depositAddress)}
                className="flex-shrink-0 bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium active:bg-blue-700 hover:bg-blue-700 transition-colors"
              >
                {copyStatus ? '✓' : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copyStatus && (
              <p className="text-xs text-green-600 mt-1">✓ Address copied!</p>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Deposit Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${config.minDeposit}`}
              className="w-full px-4 py-3 text-base text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
              USDT
            </span>
          </div>
        </div>

        {/* Upload Proof */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Payment Proof
          </label>
          
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload Screenshot</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max 5MB)</span>
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
                alt="Payment Proof" 
                className="w-full h-40 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => {
                  setProofFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold"
              >
                ×
              </button>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                {proofFile?.name}
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>⚠️ Important:</strong> Only send USDT via TRC20 network. Sending via wrong network will result in loss of funds.
          </p>
        </div>

      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={submitting || !amount || !proofFile}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Deposit'
          )}
        </button>
      </div>

    </div>
  );
};

export default DepositPage;