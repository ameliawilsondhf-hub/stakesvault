"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WithdrawPage() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fee, setFee] = useState(0);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Wallet Balance
  useEffect(() => {
    fetch("/api/user/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWalletBalance(data.walletBalance || 0);
        }
      });
  }, []);

  // Auto Calculate Fee (3%) & You Will Receive
  useEffect(() => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFee(0);
      setReceiveAmount(0);
      return;
    }
    const f = amt * 0.03;
    setFee(f);
    setReceiveAmount(amt - f);
  }, [amount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setQrImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submit Withdraw
  const submitWithdraw = async () => {
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter valid withdraw amount");
      return;
    }

    if (!walletAddress || !walletAddress.trim()) {
      setError("Please enter your wallet address");
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletAddress: walletAddress.trim(),
          qrImage: previewUrl, // Base64 image (optional)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/withdraw-history');
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit withdrawal');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 text-sm mb-1">Withdrawal request submitted</p>
          <p className="text-xs text-gray-500">Redirecting to history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Withdraw Funds</h1>
            <p className="text-xs text-purple-100">TRC20 Network</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-28">
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8" />
            <h2 className="text-lg font-semibold">Available Balance</h2>
          </div>
          <p className="text-4xl font-bold">${walletBalance.toFixed(2)}</p>
          <p className="text-purple-100 text-sm mt-1">USDT (TRC20)</p>
        </div>

        {/* Wallet Address */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
            Your Wallet Address (TRC20)
          </label>
          <input
            type="text"
            placeholder="Enter your TRC20 address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-5 py-4 text-sm font-mono text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-gray-50 transition"
          />
          <p className="text-xs text-gray-500 mt-2">⚠️ Make sure this is a valid TRC20 address</p>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
            Withdraw Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-5 py-4 text-lg font-semibold text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-gray-50 transition"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-lg">
              USDT
            </span>
          </div>

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <div className="mt-4 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Withdraw Amount:</span>
                <span className="font-semibold text-gray-900">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fee (3%):</span>
                <span className="font-semibold text-red-600">-${fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="text-sm font-bold text-gray-900">You'll Receive:</span>
                <span className="text-lg font-bold text-green-600">${receiveAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* QR Upload (Optional) */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
            Wallet QR Code (Optional)
          </label>
          
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 bg-gradient-to-br from-gray-50 to-purple-50 transition group">
              <div className="p-3 bg-purple-100 rounded-full mb-2 group-hover:bg-purple-200 transition">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Upload QR Code</span>
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
                alt="QR" 
                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
              />
              <button
                onClick={() => {
                  setQrImage(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-red-600 active:scale-95 transition"
              >
                ×
              </button>
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-800 truncate">{qrImage?.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Warning Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 font-bold text-lg">!</span>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">Important Notice</p>
              <ul className="text-xs text-amber-800 leading-relaxed space-y-1">
                <li>• Minimum withdrawal: $10 USDT</li>
                <li>• Processing time: 24-48 hours</li>
                <li>• 3% fee applies to all withdrawals</li>
                <li>• Double-check your wallet address</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <button
          onClick={submitWithdraw}
          disabled={loading || !amount || !walletAddress}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 active:scale-98 shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Submit Withdrawal Request</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Withdrawals are processed within 24-48 hours
        </p>
      </div>

    </div>
  );
}