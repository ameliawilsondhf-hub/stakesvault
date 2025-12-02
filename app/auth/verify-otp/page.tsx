"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

// ✅ Separate component for content that uses useSearchParams
function VerifyOTPContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("tempToken");

  useEffect(() => {
    setMounted(true);
    const savedEmail = sessionStorage.getItem("userEmail");
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
    if (!tempToken) {
      setError("Session expired. Please login again.");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }, [tempToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!tempToken) {
        setError("Session expired. Please login again.");
        setLoading(false);
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      console.log("🔄 Sending OTP verification request...");
      console.log("📝 OTP:", otp);
      console.log("🔑 TempToken exists:", !!tempToken);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          tempToken,
          otp: otp.trim()
        }),
      });

      console.log("📡 Response status:", res.status);

      const data = await res.json();
      console.log("📥 Response data:", data);

      if (!res.ok || !data.success) {
        console.error("❌ Verification failed:", data.message);
        setOtp("");
        setError(data.message || "Invalid or expired OTP");
        setLoading(false);
        return;
      }

      console.log("✅ Verification successful!");

      if (data.user && data.user.id) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name || "");
        console.log("💾 User data saved to localStorage");
      }
      
      sessionStorage.removeItem("tempToken");
      sessionStorage.removeItem("userEmail");

      setSuccess(true);
      setLoading(false);
      
      console.log("🔄 Redirecting to dashboard in 800ms...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
      
    } catch (error) {
      console.error("❌ OTP verification error:", error);
      setOtp("");
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
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F0B90B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4">
      
      {/* Main Card */}
      <div className="w-full max-w-[380px] bg-[#181A20] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F0B90B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0B0E11] mb-1">
            Security Verification
          </h1>
          <p className="text-sm text-[#0B0E11]/80">
            Enter your 2FA code
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6">
          
          {userEmail && (
            <div className="mb-6 p-3 bg-[#1E2329] rounded-lg text-center">
              <p className="text-xs text-[#848E9C] mb-1">Logged in as</p>
              <p className="text-sm text-[#EAECEF] font-medium">{userEmail}</p>
            </div>
          )}

          <div className="space-y-5">

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-[#EAECEF] mb-2">
                2FA Code
              </label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full h-12 bg-[#1E2329] border border-[#2B3139] text-white text-center text-xl font-mono tracking-[0.5em] rounded-lg focus:outline-none focus:border-[#F0B90B] transition-colors"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && otp.length === 6) {
                    handleSubmit(e);
                  }
                }}
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-[#848E9C] text-center mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#2B1515] border border-[#CF304A] rounded-lg p-3 flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 text-[#F6465D]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-[#F6465D] font-medium">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-[#0E3F21] border border-[#0ECB81] text-[#0ECB81] px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Verified! Redirecting...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
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
                "Verify"
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-10 text-[#F0B90B] text-sm font-medium hover:text-[#F8D12F] transition-colors"
            >
              ← Back to Login
            </button>

          </div>

          {/* Help Info */}
          <div className="mt-6 p-4 bg-[#1E2329] rounded-lg border border-[#2B3139]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#F0B90B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#EAECEF] mb-2">
                  How to get your code
                </h3>
                <ul className="text-xs text-[#848E9C] space-y-1.5">
                  <li>1. Open Google Authenticator or Authy</li>
                  <li>2. Find your StakeVault account</li>
                  <li>3. Enter the 6-digit code shown</li>
                  <li>4. Code refreshes every 30 seconds</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0B0E11] border-t border-[#2B3139]">
          <p className="text-xs text-[#848E9C] text-center">
            Secured by Two-Factor Authentication
          </p>
        </div>

      </div>

      {/* Global Styles */}
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        input {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          input {
            font-size: 16px !important;
          }
        }
        
        /* Prevent zoom on input focus iOS */
        @media screen and (max-width: 768px) {
          input:focus {
            font-size: 16px;
          }
        }

        /* Shake animation for errors */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

    </div>
  );
}

// ✅ Main export with Suspense wrapper (Required for Vercel deployment)
export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F0B90B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}