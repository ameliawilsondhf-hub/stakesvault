"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  
  // Step 1: Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [tempToken, setTempToken] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDarkMode);
  }, [mounted]);

  // OTP Resend Timer
  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Handle Credentials Submit
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.requiresOTP) {
        // Move to OTP step
        setTempToken(data.tempToken);
        setOtpSentTo(data.email);
        setStep("otp");
        setSuccess("OTP has been sent to your email!");
        setResendTimer(60);
      } else {
        // Direct login (shouldn't happen for admin)
        router.push("/admin");
      }

      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tempToken,
          otp: otpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid OTP");
        setLoading(false);
        return;
      }

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/admin");
      }, 1000);

    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("New OTP sent to your email!");
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-700"></div>
        </div>

        {/* Login Card */}
        <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-md border border-slate-200/50 dark:border-slate-700/50">
          
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-lg opacity-20 animate-pulse"></div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <span className="text-4xl">🔐</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Portal
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step === "credentials" ? "Secure authentication required" : "Enter verification code"}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8 gap-2">
              <div className={`flex items-center gap-2 ${step === "credentials" ? "text-purple-600" : "text-green-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "credentials" ? "bg-purple-600 text-white" : "bg-green-500 text-white"
                }`}>
                  {step === "otp" ? "✓" : "1"}
                </div>
                <span className="text-xs font-semibold">Credentials</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-700"></div>
              <div className={`flex items-center gap-2 ${step === "otp" ? "text-purple-600" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "otp" ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600"
                }`}>
                  2
                </div>
                <span className="text-xs font-semibold">Verification</span>
              </div>
            </div>

            {/* STEP 1: Credentials Form */}
            {step === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter admin email"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
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
                      className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none pr-12 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3.5 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Continue to Verification"}
                </button>
              </form>
            )}

            {/* STEP 2: OTP Form */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                    📧 Verification code sent to:<br />
                    <span className="font-bold">{otpSentTo}</span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !digit && index > 0) {
                            document.getElementById(`otp-${index - 1}`)?.focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm text-center">
                    ✓ {success}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3.5 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resend code in <span className="font-bold text-purple-600">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  ← Back to login
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                ← Back to User Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}