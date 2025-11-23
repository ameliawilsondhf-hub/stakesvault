"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setMounted(true);
    
    // Get email from session
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    } else {
      // No session, redirect to login
      router.push("/auth/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tempToken = sessionStorage.getItem("tempToken");
      
      if (!tempToken) {
        setError("Session expired. Please login again.");
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          tempToken,
          otp: otp.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid OTP code");
        setLoading(false);
        return;
      }

      // Success!
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
      }
      
      // Clear session storage
      sessionStorage.removeItem("tempToken");
      sessionStorage.removeItem("userEmail");

      setSuccess(true);
      setLoading(false);
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error) {
      console.error("❌ OTP verification error:", error);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    sessionStorage.removeItem("tempToken");
    sessionStorage.removeItem("userEmail");
    router.push("/auth/login");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0a0e1a] dark:via-[#0f1419] dark:to-[#1a1f2e] flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500 opacity-20 rounded-full blur-3xl -top-32 -left-32 animate-float"></div>
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-300 dark:from-purple-600 dark:to-pink-500 opacity-20 rounded-full blur-3xl top-1/3 -right-32 animate-float-slow"></div>
      </div>

      {/* OTP Card */}
      <div className="relative bg-white/95 dark:bg-[#1a1f2e]/95 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 animate-fade-in z-10">
        
        {/* Card Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20 dark:opacity-30 animate-pulse-slow"></div>

        <div className="relative z-10">
          
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur-2xl opacity-50 animate-pulse-slow scale-110"></div>
              <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                <span className="text-4xl">🔐</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
            {userEmail && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                {userEmail}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* OTP Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block text-center">
                Authentication Code
              </label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-center text-2xl font-mono tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Code refreshes every 30 seconds
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm text-center animate-pulse">
                ✓ Verification Successful! Redirecting...
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-500/50 dark:shadow-blue-800/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify & Login"
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium transition"
              >
                ← Back to Login
              </button>
            </div>

          </form>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              📱 Need Help?
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Open your Google Authenticator or Authy app</li>
              <li>• Find the StakeVault entry</li>
              <li>• Enter the 6-digit code shown</li>
              <li>• Code changes every 30 seconds</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-600 mt-6">
            © {new Date().getFullYear()} StakeVault • Secured by 2FA
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, 30px) rotate(180deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}