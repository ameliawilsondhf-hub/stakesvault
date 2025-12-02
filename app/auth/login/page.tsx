"use client";
import { Suspense } from 'react';
import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function getClientDeviceInfo() {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { userAgent: ua, browser, os, device: `${os} ${browser}` };
}

function LoginContent() {
  // --- YOUR FULL ORIGINAL LOGIN CODE STARTS ---
  // (NOT CHANGED ANYTHING)

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dark, setDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
const [show2FA, setShow2FA] = useState(false);
const [tempToken, setTempToken] = useState("");
const [twoFaOtp, setTwoFaOtp] = useState("");
const [verifying2FA, setVerifying2FA] = useState(false);

  // Ban popup states
  const [showBanPopup, setShowBanPopup] = useState(false);
  const [bannedReason, setBannedReason] = useState("");

  // 🔥 IP BLOCKING STATES
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDarkMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setDark(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted]);

  // Check URL for ban error
  useEffect(() => {
    if (!mounted) return;
    
    const urlError = searchParams.get('error');
    const banReason = searchParams.get('reason');

    if (urlError === 'banned' && banReason) {
      setBannedReason(decodeURIComponent(banReason));
      setShowBanPopup(true);
      return;
    }
    
    if (urlError && urlError.includes('banned::')) {
      const reason = urlError.split('::')[1] || "Account banned";
      setBannedReason(reason);
      setShowBanPopup(true);
    }
  }, [mounted, searchParams]);

  // 🔥 Countdown timer for blocked IP
  useEffect(() => {
    if (!isBlocked || blockTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setBlockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsBlocked(false);
          setShowBlockedPopup(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  // Track OAuth login
  useEffect(() => {
    const trackOAuthLogin = async () => {
      if (session && mounted) {
        const deviceInfo = getClientDeviceInfo();
        
        if (deviceInfo) {
          try {
            await fetch('/api/admin/user/track-device', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...deviceInfo,
                provider: 'google'
              })
            });
            console.log('✅ OAuth device tracked');
          } catch (error) {
            console.error('⚠️ Device tracking failed (non-blocking):', error);
          }
        }
      }
    };

    trackOAuthLogin();
  }, [session, mounted]);

  const toggleDark = () => setDark(!dark);
// ✅ STEP 3: VERIFY 2FA OTP HANDLER  (✅ SAHI JAGAH)
const handleVerify2FA = async () => {
  if (!twoFaOtp || !tempToken) {
    setError("OTP required");
    return;
  }

  setVerifying2FA(true);
  setError("");

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        otp: twoFaOtp,
        tempToken: tempToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Invalid OTP");
      setVerifying2FA(false);
      return;
    }

    // ✅ OTP SUCCESS → LOGIN COMPLETE
    setShow2FA(false);
    setTwoFaOtp("");
    setTempToken("");
    router.push("/dashboard");

  } catch (err) {
    console.error("2FA Verify Error:", err);
    setError("OTP verification failed");
  } finally {
    setVerifying2FA(false);
  }
};

  // 🔥 ENHANCED: Handle login with IP blocking
  const handleSubmit = async (e: any) => {
    
    e.preventDefault();
    
    // Check if blocked
    if (isBlocked) {
      setShowBlockedPopup(true);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      // ✅ AGAR 2FA ENABLED HAI
if (data.requires2FA && data.tempToken) {
  setTempToken(data.tempToken);
  setShow2FA(true);
  setLoading(false); // ✅ YEH LINE ADD KARO
  return;
}


// ✅ NORMAL LOGIN FLOW
if (data.success) {
  router.push("/dashboard");
}


      // 🔥 Handle IP blocking response
      if (res.status === 429) {
        setIsBlocked(true);
        setBlockTimeRemaining(data.blockTimeRemaining * 60 || 3600); // Convert minutes to seconds
        setShowBlockedPopup(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // 🔥 Update remaining attempts
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        if (data?.banned) {
          setLoading(false);
          setBannedReason(data.reason || "Account banned");
          setShowBanPopup(true);
          return;
        }

        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Reset attempts on successful login
      setAttemptsRemaining(5);


      if (data.userId) {
        localStorage.setItem("userId", data.userId);
      }

      setSuccess(true);
      setLoading(false);

      // Track device for credentials login
      const deviceInfo = getClientDeviceInfo();
      if (deviceInfo) {
        try {
          await fetch('/api/admin/user/track-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...deviceInfo,
              provider: 'credentials'
            })
          });
          console.log('✅ Credentials device tracked');
        } catch (error) {
          console.error('⚠️ Device tracking failed (non-blocking):', error);
        }
      }

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (e) {
      console.error("Login error:", e);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  // 🔥 Format countdown timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
<div className="dark bg-[#020617] text-white">

  {/* 🔥 PROFESSIONAL IP BLOCKED POPUP */}
{/* 🔥 PROFESSIONAL IP BLOCKED POPUP - WITH CLICKABLE FORGOT PASSWORD */}
{showBlockedPopup && isBlocked && (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in px-4">
    <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl p-8 w-full max-w-lg border-2 border-red-500 dark:border-red-600 relative overflow-hidden">
      
      {/* Animated background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-bounce">
            <span className="text-5xl">🔒</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-red-600 dark:text-red-400 mb-3">
          Account Temporarily Locked
        </h2>

        {/* Subtitle */}
        <p className="text-center text-gray-700 dark:text-gray-300 text-base mb-6 leading-relaxed">
          For security reasons, access to your account has been temporarily restricted due to multiple failed login attempts.
        </p>

        {/* Countdown Timer */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-3">
            Time Until Access Restoration
          </p>
          <div className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2 font-mono tabular-nums">
            {formatTime(blockTimeRemaining)}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            minutes : seconds
          </p>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Automated Security Protection
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                This is an automated security measure activated after 5 consecutive failed login attempts 
                within a 5-minute period. This helps protect your account from unauthorized access and 
                brute-force attacks.
              </p>
            </div>
          </div>
        </div>

        {/* 🔥 FIXED: Help Information with Clickable Link */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔑</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Forgot your password?
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                You can reset your credentials securely while waiting for access restoration.
              </p>
              <Link
                href="/auth/forgot-password"
                onClick={() => setShowBlockedPopup(false)}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:gap-3 transition-all"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                  />
                </svg>
                Reset Password Now
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowBlockedPopup(false)}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          I Understand
        </button>

        {/* Support Link */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
          Need immediate assistance? Contact{" "}
          <a 
            href="mailto:support@stakevault.com" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            support@stakevault.com
          </a>
        </p>
      </div>
    </div>
  </div>
)}
      {/* Ban Popup */}
      {showBanPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-[#1f2533] rounded-2xl shadow-2xl p-8 w-[90%] max-w-md border border-gray-300 dark:border-gray-700 relative animate-bounce-slow">

            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-2xl blur-lg opacity-30"></div>

            <div className="relative z-10 text-center">
              <div className="text-6xl mb-3 animate-pulse">⛔</div>

              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                Account Banned
              </h2>

              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                Your account has been banned by the administration.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-6 animate-shake">
                <b>Reason:</b> {bannedReason}
              </div>

              <button
                onClick={() => setShowBanPopup(false)}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 shadow-lg hover:scale-105 active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
{show2FA && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
    <div className="bg-white dark:bg-[#111827] p-8 rounded-2xl shadow-2xl w-[90%] max-w-sm">
      
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-white">
        🔐 Two Factor Authentication
      </h2>

      <input
        type="text"
        placeholder="Enter 6 digit OTP"
        value={twoFaOtp}
        onChange={(e) => setTwoFaOtp(e.target.value)}
        className="w-full p-3 border rounded-xl mb-4 text-center text-lg"
      />

      {error && (
        <div className="text-red-500 text-sm mb-3 text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify2FA}
        disabled={verifying2FA}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
      >
        {verifying2FA ? "Verifying..." : "Verify OTP"}
      </button>

    </div>
  </div>
)}

      {/* Main Login Page */}
<div className="min-h-screen w-full bg-gradient-to-br from-[#020617] via-[#1e293b] to-[#020617] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden text-white">

        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src="/stakevault.png" className="rotate-bg absolute w-[300px] top-10 left-10" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[260px] top-40 right-20" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[220px] bottom-20 left-1/4" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[200px] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[280px] bottom-10 right-10" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[240px] top-1/3 left-1/2" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[180px] bottom-1/3 left-10" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[260px] bottom-1/4 right-1/3" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[300px] top-1/4 right-1/4" alt="" />
          <img src="/stakevault.png" className="rotate-bg absolute w-[230px] top-2/3 left-1/3" alt="" />

          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500 opacity-20 rounded-full blur-3xl -top-32 -left-32 animate-float"></div>
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-300 dark:from-purple-600 dark:to-pink-500 opacity-20 rounded-full blur-3xl top-1/3 -right-32 animate-float-slow"></div>
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-400 to-blue-300 dark:from-indigo-600 dark:to-blue-500 opacity-15 rounded-full blur-3xl -bottom-32 left-1/4 animate-float-reverse"></div>
        </div>

        {/* Login Card */}
        
<div className="relative bg-[#0f172a] text-white shadow-2xl rounded-2xl p-6 sm:p-10 w-full max-w-sm sm:max-w-md border border-white/10 animate-fade-in z-10">

          <div className="absolute -inset-1 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-3xl blur-lg opacity-25 dark:opacity-30 animate-pulse-slow"></div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="absolute right-5 top-5 p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-110 hover:rotate-12 transition-all shadow-md z-20"
          >
            {dark ? "☀️" : "🌙"}
          </button>

<div className="relative z-10 text-[13px] sm:text-base leading-tight sm:leading-normal">

            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 rounded-full blur-2xl opacity-50 animate-pulse-slow scale-110"></div>

                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden shadow-2xl animate-bounce-slow">
                  <img
                    src="/stakevault.png"
                    alt="StakeVault Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

<h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">

              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                🔒 Secure login to your account
              </p>
            </div>

            {/* 🔥 ATTEMPTS WARNING BANNER */}
       {/* 🔥 PROFESSIONAL ATTEMPTS WARNING BANNER */}
{attemptsRemaining < 5 && attemptsRemaining > 0 && !isBlocked && (
  <div className={`mb-5 p-4 rounded-xl border-2 ${
    attemptsRemaining <= 2 
      ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600'
  }`}>
    <div className="flex items-center gap-3">
      <span className="text-3xl">
        {attemptsRemaining <= 2 ? '🚨' : '⚠️'}
      </span>
      <div className="flex-1">
        <p className={`font-bold text-sm ${
          attemptsRemaining <= 2 
            ? 'text-red-700 dark:text-red-300'
            : 'text-orange-700 dark:text-orange-300'
        }`}>
          {attemptsRemaining <= 2 ? 'Critical: Account Security Alert' : 'Security Alert'}
        </p>
        <p className={`text-xs mt-1 ${
          attemptsRemaining <= 2 
            ? 'text-red-600 dark:text-red-400'
            : 'text-orange-600 dark:text-orange-400'
        }`}>
          {attemptsRemaining === 1 ? (
            <>
              <span className="font-bold text-lg">{attemptsRemaining}</span> attempt remaining. 
              Account will be temporarily locked after next failed login.
            </>
          ) : attemptsRemaining === 2 ? (
            <>
              Only <span className="font-bold text-lg">{attemptsRemaining}</span> attempts remaining 
              before temporary account lockout for security.
            </>
          ) : (
            <>
              <span className="font-bold text-lg">{attemptsRemaining}</span> login attempts remaining 
              before security lockout (60 minutes).
            </>
          )}
        </p>
        <p className="text-xs mt-2 opacity-75">
          Multiple failed attempts may indicate unauthorized access. Please verify your credentials.
        </p>
      </div>
    </div>
    <div className="mt-3 bg-white/50 dark:bg-black/30 rounded-full h-2.5 overflow-hidden shadow-inner">
      <div 
        className={`h-full transition-all duration-500 ${
          attemptsRemaining <= 2 
            ? 'bg-gradient-to-r from-red-600 to-red-500' 
            : 'bg-gradient-to-r from-orange-500 to-yellow-500'
        }`}
        style={{ width: `${(attemptsRemaining / 5) * 100}%` }}
      ></div>
    </div>
  </div>
)}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || isBlocked}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none pr-12 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || isBlocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    disabled={isBlocked}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center animate-shake">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm text-center animate-pulse">
                  ✓ Login Successful! Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isBlocked}
                className={`w-full p-3.5 rounded-xl font-bold shadow-lg transition-all ${
                  isBlocked
                    ? 'bg-gray-400 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:scale-[1.02] active:scale-[.98]'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {isBlocked ? '🔒 Account Temporarily Locked' : loading ? "Logging in..." : "Login"}
              </button>

              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"

                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#1a1f2e] text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
                disabled={isBlocked}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:scale-105 transition-all text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                disabled={isBlocked}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:scale-105 transition-all text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#0b0a0a6b" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                New to StakeVault?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes rotate-logo-bg {
            0% { transform: rotate(0deg) scale(1); }
            100% { transform: rotate(360deg) scale(1); }
          }

          .rotate-bg {
            animation: rotate-logo-bg 45s linear infinite;
            opacity: 0.05;
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, -30px); }
          }
          .animate-float {
            animation: float 20s ease-in-out infinite;
          }
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-20px, 20px); }
          }
          .animate-float-slow {
            animation: float-slow 25s ease-in-out infinite;
          }
          @keyframes float-reverse {
        0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(40px, 40px); }
          }
          .animate-float-reverse {
            animation: float-reverse 30s ease-in-out infinite;
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  );
}
