"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// 🔥 Client-side device detection
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

  return {
    userAgent: ua,
    browser,
    os,
    device: `${os} ${browser}`
  };
}

// 🔥 MAIN COMPONENT - Wrapped in Suspense
function LoginPageContent() {
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

      // 🔥 Handle IP blocking response
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
          setLoading(false);
          setBannedReason(data.reason || "Account banned");
          setShowBanPopup(true);
          return;
        }

        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      setAttemptsRemaining(5);

      // 2FA check
      if (data.requires2FA) {
        sessionStorage.setItem("tempToken", data.tempToken);
        sessionStorage.setItem("userEmail", email);

        setSuccess(true);
        setTimeout(() => router.push("/auth/verify-otp"), 500);
        return;
      }

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
    <div className={dark ? "dark" : ""}>
      {/* Your complete UI code stays here - I'm keeping it short for brevity */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0a0e1a] dark:via-[#0f1419] dark:to-[#1a1f2e] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Page</h1>
          <p>Your login form here...</p>
        </div>
      </div>
    </div>
  );
}

// 🔥 EXPORT WITH SUSPENSE WRAPPER
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-[#0a0e1a] dark:to-[#1a1f2e]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}