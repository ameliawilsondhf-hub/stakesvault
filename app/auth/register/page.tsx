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
    <div className="min-h-[100svh] bg-[#0d1117] flex items-center justify-center px-3 py-4 relative overflow-hidden">
      
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

      {/* Register Card - Professional Design - Bigger for Mobile */}
      {/* Register Card - Bigger & Professional for Mobile */}
      <div className="relative bg-[#161b22] backdrop-blur-xl shadow-2xl rounded-xl md:rounded-2xl p-6 md:p-8 w-full max-w-[calc(100%-2rem)] md:max-w-[480px] border border-[#30363d] z-10">
        
        {/* Subtle Card Glow */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-xl md:rounded-2xl blur-xl"></div>

        {/* Content Container */}
        <div className="relative z-10">
          
          {/* Logo Section - Professional & Bigger */}
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
            <p className="text-gray-400 text-xs sm:text-sm">
              Create your account and start earning rewards
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            
            {/* Name Input */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 hover:border-[#484f58]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 hover:border-[#484f58]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-gray-500 hover:border-[#484f58]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-lg sm:text-xl"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Referral Input */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 block">
                Referral Code <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter referral code"
                className="w-full border border-[#30363d] bg-[#0d1117] text-white p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 hover:border-[#484f58]"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-xs sm:text-sm text-center animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2.5 rounded-lg text-xs sm:text-sm text-center animate-pulse">
                ✓ Registration Successful! Redirecting...
              </div>
            )}

            {/* Register Button - Professional */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 sm:p-4 rounded-lg font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
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
          <div className="relative my-4 sm:my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#30363d]"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-[#161b22] text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons - Professional */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <button
              type="button"
              onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border border-[#30363d] rounded-lg hover:bg-[#161b22] hover:border-[#484f58] transition-all text-xs sm:text-sm font-medium text-gray-300"
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
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d1117] border border-[#30363d] rounded-lg hover:bg-[#161b22] hover:border-[#484f58] transition-all text-xs sm:text-sm font-medium text-gray-300"
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

          {/* Login Link */}
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-gray-400 text-xs sm:text-sm">
              Already have an account?{" "}
              <Link 
                href="/auth/login"
                className="text-blue-500 hover:text-blue-400 font-medium transition"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] sm:text-xs text-gray-500">
            © {new Date().getFullYear()} StakeVault • All Rights Reserved
          </div>
        </div>
      </div>

      {/* Professional Animations */}
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
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-spin-very-slow { animation: spin-very-slow 60s linear infinite; }
        .animate-spin-very-slow-reverse { animation: spin-very-slow-reverse 60s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 5s ease-in-out infinite; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}