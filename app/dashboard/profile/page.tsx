"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ✅ Country List with Codes
const countries = [
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "Argentina", code: "+54" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Bangladesh", code: "+880" },
  { name: "Belgium", code: "+32" },
  { name: "Brazil", code: "+55" },
  { name: "Canada", code: "+1" },
  { name: "China", code: "+86" },
  { name: "Colombia", code: "+57" },
  { name: "Denmark", code: "+45" },
  { name: "Egypt", code: "+20" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Germany", code: "+49" },
  { name: "Greece", code: "+30" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Malaysia", code: "+60" },
  { name: "Mexico", code: "+52" },
  { name: "Morocco", code: "+212" },
  { name: "Netherlands", code: "+31" },
  { name: "Nigeria", code: "+234" },
  { name: "Norway", code: "+47" },
  { name: "Pakistan", code: "+92" },
  { name: "Palestine", code: "+970" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Qatar", code: "+974" },
  { name: "Russia", code: "+7" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Singapore", code: "+65" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "Spain", code: "+34" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syria", code: "+963" },
  { name: "Thailand", code: "+66" },
  { name: "Turkey", code: "+90" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Vietnam", code: "+84" },
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  phoneCode: string;
  country: string;
  emailVerified: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🔥 Triple Protection: Prevent duplicate OTP calls
  const otpSendingRef = useRef(false);
  const lastOtpTimeRef = useRef(0);
  
  // Profile data
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    phoneCode: "+1",
    country: "",
    emailVerified: false,
  });

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Messages
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      
      // Extract phone code and number
      let phoneCode = "+1";
      let phoneNumber = data.phone || "";
      
      if (phoneNumber) {
        const match = countries.find(c => phoneNumber.startsWith(c.code));
        if (match) {
          phoneCode = match.code;
          phoneNumber = phoneNumber.substring(match.code.length).trim();
        }
      }

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: phoneNumber,
        phoneCode: phoneCode,
        country: data.country || "",
        emailVerified: data.emailVerified || false,
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load profile:", error);
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Combine phone code and number
      const fullPhone = profile.phoneCode + profile.phone;

      const res = await fetch("/api/user/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profile.name,
          phone: fullPhone,
          country: profile.country,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Update failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // 🔥 FIXED: Send OTP with TRIPLE protection against duplicates
  const handleSendOtp = async () => {
    const now = Date.now();

    // Protection 1: Check if already sending (ref)
    if (otpSendingRef.current) {
      console.log("⚠️ OTP send blocked - Already in progress (ref check)");
      return;
    }

    // Protection 2: Check state
    if (sendingOtp) {
      console.log("⚠️ OTP send blocked - Already in progress (state check)");
      return;
    }

    // Protection 3: Rate limiting (prevent multiple calls within 5 seconds)
    if (now - lastOtpTimeRef.current < 5000) {
      console.log("⚠️ OTP send blocked - Too soon (rate limit)");
      setMessage({ 
        type: "error", 
        text: "Please wait a few seconds before requesting another code" 
      });
      return;
    }

    // Lock all protections
    otpSendingRef.current = true;
    lastOtpTimeRef.current = now;
    setSendingOtp(true);
    setMessage({ type: "", text: "" });

    console.log("📤 Sending OTP request...");

    try {
      const res = await fetch("/api/user/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setMessage({ type: "success", text: "✅ OTP sent to your email!" });
        console.log("✅ OTP sent successfully");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send OTP" });
        console.error("❌ OTP send failed:", data.message);
      }
    } catch (error) {
      console.error("❌ OTP send exception:", error);
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setSendingOtp(false);
      
      // Unlock ref after 5 seconds to allow retry
      setTimeout(() => {
        otpSendingRef.current = false;
        console.log("🔓 OTP send unlocked for retry");
      }, 5000);
    }
  };

  // 🔥 Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setMessage({ type: "error", text: "Please enter a valid 6-digit OTP" });
      return;
    }

    setVerifyingOtp(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile({ ...profile, emailVerified: true });
        setOtpSent(false);
        setOtpCode("");
        setMessage({ type: "success", text: "✅ Email verified! Welcome email sent." });
        
        // Reload profile to get updated data
        setTimeout(() => {
          loadProfile();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.message || "Invalid OTP" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 sm:p-6">
      
      {/* Back Button */}
      <Link href="/dashboard">
        <button className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white hover:bg-white/20 transition text-sm sm:text-base">
          ← Back
        </button>
      </Link>

      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-gray-400 mt-2 text-xs sm:text-sm md:text-base">Manage your account information</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`max-w-3xl mx-auto mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base ${
          message.type === "success" 
            ? "bg-green-500/20 border border-green-500/50 text-green-300"
            : "bg-red-500/20 border border-red-500/50 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
        <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
          
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email with OTP Verification */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600 bg-gray-700/50 text-gray-400 cursor-not-allowed text-sm sm:text-base"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                {profile.emailVerified ? (
                  <span className="flex items-center gap-1 sm:gap-2 text-green-400 text-xs sm:text-sm font-semibold bg-green-500/20 px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-sm sm:text-base">✓</span>
                    <span className="hidden sm:inline">Verified</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 sm:gap-2 text-yellow-400 text-xs sm:text-sm font-semibold bg-yellow-500/20 px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-sm sm:text-base">⚠</span>
                    <span className="hidden sm:inline">Not Verified</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* OTP Verification Section */}
            {!profile.emailVerified && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl">
                <p className="text-yellow-300 text-xs sm:text-sm mb-3">
                  Please verify your email address to secure your account
                </p>
                
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendOtp();
                    }}
                    disabled={sendingOtp || otpSendingRef.current}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 sm:p-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    {sendingOtp ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Sending OTP...
                      </span>
                    ) : (
                      "📧 Send Verification Code"
                    )}
                  </button>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-600 bg-gray-800 text-white text-center text-base sm:text-lg font-mono tracking-widest focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 sm:p-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      >
                        {verifyingOtp ? "Verifying..." : "✓ Verify Code"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSendOtp();
                        }}
                        disabled={sendingOtp || otpSendingRef.current}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-xs sm:text-sm"
                      >
                        {sendingOtp ? "..." : "↻ Resend"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Country
            </label>
            <select
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600 bg-gray-800/50 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
              required
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phone with Country Code */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={profile.phoneCode}
                onChange={(e) => setProfile({ ...profile, phoneCode: e.target.value })}
                className="w-20 sm:w-28 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600 bg-gray-800/50 text-white focus:ring-2 focus:ring-purple-500 outline-none text-xs sm:text-sm"
              >
                {countries.map((country, index) => (
                  <option key={`phone-${country.code}-${index}`} value={country.code}>
                    {country.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="1234567890"
                className="flex-1 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {saving ? "Saving Changes..." : "💾 Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}