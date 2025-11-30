"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDarkMode);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    document.cookie = `ref=${ref}; path=/; max-age=86400`; // 24 hours
  }
}, []);

  const toggleDark = () => setDark(!dark);

  const handleRegister = async (e: any) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, referral }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1500);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      setError("Server error. Please try again.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0a0e1a] dark:via-[#0f1419] dark:to-[#1a1f2e] flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500">

        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500 opacity-20 rounded-full blur-3xl -top-32 -left-32 animate-float"></div>
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-300 dark:from-purple-600 dark:to-pink-500 opacity-20 rounded-full blur-3xl top-1/3 -right-32 animate-float-slow"></div>
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-400 to-blue-300 dark:from-indigo-600 dark:to-blue-500 opacity-15 rounded-full blur-3xl -bottom-32 left-1/4 animate-float-reverse"></div>
        </div>
{/* 10 Rotating Background Logos */}
<img src="/stakevault.png" className="rotate-bg absolute w-[300px] top-10 left-10" />
<img src="/stakevault.png" className="rotate-bg absolute w-[260px] top-40 right-20" />
<img src="/stakevault.png" className="rotate-bg absolute w-[220px] bottom-20 left-1/4" />
<img src="/stakevault.png" className="rotate-bg absolute w-[200px] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
<img src="/stakevault.png" className="rotate-bg absolute w-[280px] bottom-10 right-10" />
<img src="/stakevault.png" className="rotate-bg absolute w-[240px] top-1/3 left-1/2" />
<img src="/stakevault.png" className="rotate-bg absolute w-[180px] bottom-1/3 left-10" />
<img src="/stakevault.png" className="rotate-bg absolute w-[260px] bottom-1/4 right-1/3" />
<img src="/stakevault.png" className="rotate-bg absolute w-[300px] top-1/4 right-1/4" />
<img src="/stakevault.png" className="rotate-bg absolute w-[230px] top-2/3 left-1/3" />

        {/* Register Card */}
        <div className="relative bg-white/95 dark:bg-[#1a1f2e]/95 backdrop-blur-xl shadow-2xl rounded-3xl p-4 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 animate-fade-in z-10">

          {/* Card Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20 dark:opacity-30 animate-pulse-slow"></div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="absolute right-5 top-5 p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-110 hover:rotate-12 transition-all shadow-md z-20"
            aria-label="Toggle dark mode"
          >
            <span className="text-lg">{dark ? "☀️" : "🌙"}</span>
          </button>

          {/* Content Container */}
          <div className="relative z-10">
            
            {/* Logo Section */}
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
              
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                StakeVault
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                🚀 Create your account and start earning
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* Name Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Referral Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Referral Code <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter referral code"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1f2937] text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  disabled={loading}
                />
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
                  ✓ Registration Successful! Redirecting...
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/50 dark:shadow-blue-800/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#1a1f2e] text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
              >
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="18"
  height="18"
  fill="#1877F2"
>
  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24h11.495v-9.294H9.691V11.01h3.129V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.716-1.795 1.764v2.316h3.587l-.467 3.696h-3.12V24h6.116C23.407 24 24 23.407 24 22.675V1.325C24 .593 23.407 0 22.675 0z"/>
</svg>
                Facebook
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
              >
<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0C14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.6 46.98 32.42 46.98 24.55z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>
                Google
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Already have an account?{" "}
                <Link 
                  href="/auth/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-600 mt-6">
              © {new Date().getFullYear()} StakeVault • All Rights Reserved
            </div>
          </div>
        </div>

        {/* Animations */}
        <style jsx>{`@keyframes rotate-logo-bg {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1); }
}

.rotate-bg {
  animation: rotate-logo-bg 45s linear infinite;
  opacity: 0.05;
}

          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
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
          @keyframes float-reverse {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(20px, -20px) rotate(-180deg); }
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
          .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
          .animate-float { animation: float 20s ease-in-out infinite; }
          .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
          .animate-float-reverse { animation: float-reverse 22s ease-in-out infinite; }
          .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    </div>
  );
}