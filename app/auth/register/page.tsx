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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      document.cookie = `ref=${ref}; path=/; max-age=86400`;
    }
  }, []);

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
    <div className="min-h-[100svh] bg-[#0a0f1e] flex items-center justify-center px-4 py-6 relative overflow-hidden">
      
      {/* Professional Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      
      {/* Professional Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-[100px] -top-48 -left-48 animate-float"></div>
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-[100px] top-1/3 -right-32 animate-float-slow"></div>
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full blur-[100px] -bottom-32 left-1/4 animate-float-reverse"></div>
      </div>

      {/* Subtle Background Logos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src="/stakevault.png" className="rotate-bg absolute w-[180px] md:w-[280px] top-10 left-10 opacity-[0.04] blur-[1px]" alt="" />
        <img src="/stakevault.png" className="rotate-bg absolute w-[150px] md:w-[240px] top-40 right-10 opacity-[0.04] blur-[1px]" alt="" />
        <img src="/stakevault.png" className="rotate-bg absolute w-[160px] md:w-[260px] bottom-20 right-20 opacity-[0.04] blur-[1px]" alt="" />
        <img src="/stakevault.png" className="rotate-bg absolute w-[140px] md:w-[220px] bottom-32 left-16 opacity-[0.04] blur-[1px] hidden md:block" alt="" />
      </div>

      {/* Register Card */}
      <div className="relative bg-[#0f1629] shadow-2xl rounded-2xl p-6 md:p-8 w-full max-w-[420px] border border-white/5 z-10 backdrop-blur-xl">
        
        {/* Professional Card Glow */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-sm"></div>

        {/* Content Container */}
        <div className="relative z-10">
          
          {/* Logo Section */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-300 rounded-full blur-xl opacity-40 animate-pulse-slow scale-110"></div>
              
              <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full overflow-hidden shadow-xl">
                <img
                  src="/stakevault.png"
                  alt="StakeVault Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              StakeVault
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              🚀 Create your account and start earning
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full border border-gray-300 bg-white text-gray-900 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 bg-white text-gray-900 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full border border-gray-300 bg-white text-gray-900 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition text-xl"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Referral Input */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Referral Code <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter referral code"
                className="w-full border border-gray-300 bg-white text-gray-900 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm text-center animate-pulse">
                ✓ Registration Successful! Redirecting...
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
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
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-sm font-medium text-gray-700"
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
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-sm font-medium text-gray-700"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.6 46.98 32.42 46.98 24.55z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link 
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} StakeVault • All Rights Reserved
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes rotate-logo-bg {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .rotate-bg {
          animation: rotate-logo-bg 50s linear infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
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
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 22s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}