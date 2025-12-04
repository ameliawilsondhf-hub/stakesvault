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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFaOtp, setTwoFaOtp] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [showBanPopup, setShowBanPopup] = useState(false);
  const [bannedReason, setBannedReason] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          } catch (error) {
            console.error('⚠️ Device tracking failed:', error);
          }
        }
      }
    };

    trackOAuthLogin();
  }, [session, mounted]);

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

      setShow2FA(false);
      setTwoFaOtp("");
      setTempToken("");
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("2FA Verify Error:", err);
      setError("OTP verification failed");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
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

      if (res.status === 429) {
        setIsBlocked(true);
        setBlockTimeRemaining(data.blockTimeRemaining * 60 || 3600);
        setShowBlockedPopup(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        if (data?.banned) {
          setBannedReason(data.reason || "Account banned");
          setShowBanPopup(true);
          setLoading(false);
          return;
        }

        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.requires2FA === true && data.tempToken) {
        setLoading(false);
        sessionStorage.setItem("userEmail", email);
        window.location.href = `/auth/verify-otp?tempToken=${data.tempToken}`;
        return;
      }

      if (data.success === true) {
        setAttemptsRemaining(5);
        
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
        }

        setSuccess(true);
        setLoading(false);

        const deviceInfo = getClientDeviceInfo();
        if (deviceInfo) {
          fetch('/api/admin/user/track-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...deviceInfo,
              provider: 'credentials'
            })
          }).catch(err => console.error('⚠️ Device tracking failed:', err));
        }

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
        
        return;
      }

      setError("Unexpected response from server");
      setLoading(false);

    } catch (e) {
      console.error("❌ Login exception:", e);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[100svh] bg-[#0d1117] flex items-center justify-center px-4 py-6 relative overflow-hidden">
      
      {/* Professional Dark Background with Visible Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/12 via-purple-950/8 to-transparent"></div>
      
      {/* Grid Pattern - Visible */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}></div>
      
      {/* Visible Animated Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/[0.06] rounded-full blur-[120px] -top-48 -left-48 animate-pulse-slow"></div>
        <div className="absolute w-[400px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[100px] top-1/2 -right-32 animate-pulse-slower"></div>
        <div className="absolute w-[450px] h-[450px] bg-indigo-500/[0.06] rounded-full blur-[110px] -bottom-32 left-1/4 animate-pulse-slow"></div>
      </div>

      {/* Visible Logo Watermarks - Professional Preview */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Spinning logos with visible effect */}
        <img src="/stakevault.png" className="absolute w-[250px] md:w-[350px] top-10 left-10 opacity-[0.08] brightness-75 animate-spin-very-slow" alt="" />
        <img src="/stakevault.png" className="absolute w-[220px] md:w-[300px] bottom-10 right-10 opacity-[0.08] brightness-75 animate-spin-very-slow-reverse" alt="" />
        <img src="/stakevault.png" className="absolute w-[200px] md:w-[280px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] brightness-70 animate-spin-very-slow" alt="" />
        <img src="/stakevault.png" className="absolute w-[180px] md:w-[240px] top-1/4 right-1/4 opacity-[0.05] brightness-70 animate-spin-very-slow-reverse" alt="" />
        <img src="/stakevault.png" className="absolute w-[190px] md:w-[260px] bottom-1/4 left-1/4 opacity-[0.05] brightness-70 animate-spin-very-slow" alt="" />
      </div>

      {showBlockedPopup && isBlocked && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in px-4">
          <div className="bg-[#161b22] rounded-2xl shadow-2xl p-8 w-full max-w-lg border-2 border-red-500 relative overflow-hidden">
            
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>

            <div className="relative z-10">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center animate-bounce">
                  <span className="text-5xl">🔒</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center text-red-400 mb-3">
                Account Temporarily Locked
              </h2>

              <p className="text-center text-gray-300 text-base mb-6 leading-relaxed">
                For security reasons, access to your account has been temporarily restricted due to multiple failed login attempts.
              </p>

              <div className="bg-red-900/20 border-2 border-red-700 rounded-xl p-6 mb-6 text-center">
                <p className="text-sm text-red-300 font-semibold mb-3">
                  Time Until Access Restoration
                </p>
                <div className="text-6xl font-bold text-red-400 mb-2 font-mono tabular-nums">
                  {formatTime(blockTimeRemaining)}
                </div>
                <p className="text-xs text-red-400 font-medium">
                  minutes : seconds
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🛡️</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-300 mb-2">
                      Automated Security Protection
                    </p>
                    <p className="text-xs text-blue-400 leading-relaxed">
                      This is an automated security measure activated after 5 consecutive failed login attempts 
                      within a 5-minute period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">🔑</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      Forgot your password?
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      You can reset your credentials securely while waiting for access restoration.
                    </p>
                    <Link
                      href="/auth/forgot-password"
                      onClick={() => setShowBlockedPopup(false)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Reset Password Now
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBlockedPopup(false)}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                I Understand
              </button>

              <p className="text-center text-xs text-gray-400 mt-5">
                Need immediate assistance? Contact{" "}
                <a href="mailto:support@stakevault.com" className="text-blue-400 hover:underline font-medium">
                  support@stakevault.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {showBanPopup && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in px-4">
          <div className="bg-[#161b22] rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-red-500 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-2xl blur-lg opacity-30"></div>

            <div className="relative z-10 text-center">
              <div className="text-6xl mb-3 animate-pulse">⛔</div>

              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Account Banned
              </h2>

              <p className="text-gray-300 text-sm mb-4">
                Your account has been banned by the administration.
              </p>

              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm mb-6">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] px-4">
          <div className="bg-[#161b22] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-[#30363d]">
            
            <h2 className="text-xl font-bold text-center mb-4 text-white">
              🔐 Two Factor Authentication
            </h2>

            <input
              type="text"
              placeholder="Enter 6 digit OTP"
              value={twoFaOtp}
              onChange={(e) => setTwoFaOtp(e.target.value)}
              className="w-full p-3 border border-[#30363d] bg-[#0d1117] text-white rounded-xl mb-4 text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {error && (
              <div className="text-red-400 text-sm mb-3 text-center bg-red-900/20 border border-red-700 px-4 py-2 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify2FA}
              disabled={verifying2FA}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
            >
              {verifying2FA ? "Verifying..." : "Verify OTP"}
            </button>

          </div>
        </div>
      )}

      <div className="relative bg-[#161b22] backdrop-blur-xl shadow-2xl rounded-xl md:rounded-2xl p-6 md:p-8 w-full max-w-[calc(100%-2rem)] md:max-w-[480px] border border-[#30363d] z-10">
        
        <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-xl md:rounded-2xl blur-xl"></div>

        <div className="relative z-10">
          
          <div className="text-center mb-5">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-full overflow-hidden shadow-xl border-2 border-[#30363d]">
                <img
                  src="/stakevault.png"
                  alt="StakeVault Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
              StakeVault
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm flex items-center justify-center gap-1.5">
              <span>🔒</span>
              Secure login to your account
            </p>
          </div>

          {attemptsRemaining < 5 && attemptsRemaining > 0 && !isBlocked && (
            <div className={`mb-4 p-3.5 sm:p-4 rounded-xl border-2 ${
              attemptsRemaining <= 2 
                ? 'bg-red-900/20 border-red-600'
                : 'bg-orange-900/20 border-orange-600'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">
                  {attemptsRemaining <= 2 ? '🚨' : '⚠️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-xs sm:text-sm ${
                    attemptsRemaining <= 2 
                      ? 'text-red-300'
                      : 'text-orange-300'
                  }`}>
                    {attemptsRemaining <= 2 ? 'Critical Security Alert' : 'Security Alert'}
                  </p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${
                    attemptsRemaining <= 2 
                      ? 'text-red-400'
                      : 'text-orange-400'
                  }`}>
                    <span className="font-bold text-base sm:text-lg">{attemptsRemaining}</span> {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining 
                    before temporary lockout.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3 bg-black/30 rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner">
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 hover:border-[#484f58]"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isBlocked}
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-gray-500 hover:border-[#484f58]"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xl"
                  disabled={isBlocked}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link 
                href="/auth/forgot-password"
                className="text-xs sm:text-sm text-blue-500 hover:text-blue-400 font-medium transition"
              >
                Forgot your password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm text-center animate-pulse">
                ✓ Login Successful! Redirecting...
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isBlocked}
              className={`w-full p-3.5 sm:p-4 rounded-lg font-semibold text-sm sm:text-base shadow-lg transition-all ${
                isBlocked
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]'
              } ${loading ? 'opacity-50' : ''}`}
            >
              {isBlocked ? '🔒 Account Temporarily Locked' : loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <div className="relative my-4 sm:my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#30363d]"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-[#161b22] text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <button
              type="button"
              onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
              disabled={isBlocked}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border border-[#30363d] rounded-lg hover:bg-[#161b22] hover:border-[#484f58] transition-all text-xs sm:text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                className="sm:w-[18px] sm:h-[18px]"
                fill="#1877F2"
              >
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24h11.495v-9.294H9.691V11.01h3.129V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.716-1.795 1.764v2.316h3.587l-.467 3.696h-3.12V24h6.116C23.407 24 24 23.407 24 22.675V1.325C24 .593 23.407 0 22.675 0z"/>
              </svg>
              <span className="hidden xs:inline">Facebook</span>
              <span className="xs:hidden">FB</span>
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              disabled={isBlocked}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border border-[#30363d] rounded-lg hover:bg-[#161b22] hover:border-[#484f58] transition-all text-xs sm:text-sm font-medium text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.6 46.98 32.42 46.98 24.55z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>
          </div>

          <div className="text-center mb-3 sm:mb-4">
            <p className="text-gray-400 text-xs sm:text-sm">
              New to StakeVault?{" "}
              <Link 
                href="/auth/register"
                className="text-blue-500 hover:text-blue-400 font-medium transition"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="text-center text-[10px] sm:text-xs text-gray-500">
            © {new Date().getFullYear()} StakeVault • All Rights Reserved
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-very-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-very-slow-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.05); }
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50% { opacity: 0.10; transform: scale(1.03); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-spin-very-slow { animation: spin-very-slow 60s linear infinite; }
        .animate-spin-very-slow-reverse { animation: spin-very-slow-reverse 60s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 5s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
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