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
  twoFactorEnabled: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const otpSendingRef = useRef(false);
  const lastOtpTimeRef = useRef(0);
  const [manualKey, setManualKey] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    phoneCode: "+1",
    country: "",
    emailVerified: false,
    twoFactorEnabled: false,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  // const [backupCodes, setBackupCodes] = useState<string[]>([]); // <-- DELETED
  const [toggling2FA, setToggling2FA] = useState(false);
  const [twoFaOtp, setTwoFaOtp] = useState(""); // For 2FA verification in modal

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
        console.error("Profile API failed:", res.status);
        setMessage({ type: "error", text: "Session issue. Please refresh the page." });
        setLoading(false);
        return;
      }

      const data = await res.json();

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
        twoFactorEnabled: data.twoFactorEnabled || false,
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load profile:", error);
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
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

  const handleSendOtp = async () => {
    const now = Date.now();

    if (otpSendingRef.current) {
      console.log("⚠️ OTP send blocked - Already in progress (ref check)");
      return;
    }

    if (sendingOtp) {
      console.log("⚠️ OTP send blocked - Already in progress (state check)");
      return;
    }

    if (now - lastOtpTimeRef.current < 5000) {
      console.log("⚠️ OTP send blocked - Too soon (rate limit)");
      setMessage({
        type: "error",
        text: "Please wait a few seconds before requesting another code"
      });
      return;
    }

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

      setTimeout(() => {
        otpSendingRef.current = false;
        console.log("🔓 OTP send unlocked for retry");
      }, 5000);
    }
  };

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

  // ✅ UPDATED handleVerify2FA FUNCTION
  const handleVerify2FA = async () => {
    if (!twoFaOtp || twoFaOtp.length !== 6) {
      setMessage({ type: "error", text: "Please enter valid 6-digit code" });
      return;
    }

    // Clear any previous general error message
    setMessage({ type: "", text: "" });

    try {
      // NOTE: Using /api/user/2fa/toggle with enable: true
      const res = await fetch("/api/user/2fa/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enable: true,
          otp: String(twoFaOtp).trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Set a specific error message for the modal, not the general page message
        // Re-using the page's setMessage state for simplicity in this example
        setMessage({ type: "error", text: data.error || "OTP verification failed. Check your code/time." });
        return;
      }

      setProfile({ ...profile, twoFactorEnabled: true });
      setShow2FAModal(false);
      setTwoFaOtp("");
      setMessage({ type: "success", text: "✅ 2FA Enabled Successfully" });

      // Ensure the toggling state is reset
      setToggling2FA(false);

    } catch (err) {
      setMessage({ type: "error", text: "Server error during 2FA verification" });
    }
  };

  const handleToggle2FA = async () => {
    try {
      setToggling2FA(true);
      setMessage({ type: "", text: "" });

      // ✅ CASE 1: ENABLE 2FA FLOW - Request QR, Secret
      if (!profile.twoFactorEnabled) {
        const res = await fetch("/api/user/2fa/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enable: true }),
        });

        const data = await res.json();

        if (!res.ok || !data.qrCode || !data.secret) {
          setMessage({ type: "error", text: data.error || "Failed to start 2FA setup" });
          setToggling2FA(false); // Reset on failure
          return;
        }

        setQrCode(data.qrCode);
        setManualKey(data.secret);
        // setBackupCodes(data.backupCodes || []); // <-- DELETED
        setShow2FAModal(true); // Open the modal to show QR and get OTP for final verification
        setToggling2FA(false); // Stop loading indicator here, setup moves to modal verification

        setMessage({
          type: "success",
          text: "QR Code generated. Scan & verify OTP to enable 2FA.",
        });

        return; // Stop here and wait for modal verification
      }

      // ✅ CASE 2: DISABLE 2FA FLOW - OTP REQUIRED
      const otp = prompt("Enter 6-digit OTP to disable 2FA:");
      if (!otp || otp.length !== 6) {
        setMessage({ type: "error", text: "Valid 6-digit OTP required" });
        setToggling2FA(false);
        return;
      }

      const res = await fetch("/api/user/2fa/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enable: false,
          otp: String(otp).trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Disable failed" });
        setToggling2FA(false);
        return;
      }

      setProfile({ ...profile, twoFactorEnabled: false });
      setMessage({ type: "success", text: "✅ 2FA disabled successfully" });

    } catch (err) {
      setMessage({ type: "error", text: "Server error" });
    } finally {
      setToggling2FA(false);
    }
  };


  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6 text-white">

      <Link href="/dashboard">
        <button className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white hover:bg-slate-700/60 transition text-sm">
          ← Back
        </button>
      </Link>

      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-slate-400 mt-2 text-xs sm:text-sm">Manage your account information</p>
      </div>

      {message.text && (
        <div className={`max-w-3xl mx-auto mb-4 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-slate-800/40 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-2xl">

        <div className="space-y-5">

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-2.5 sm:p-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full p-2.5 sm:p-3 pr-20 rounded-lg border border-slate-600 bg-slate-900/50 text-slate-200 text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {profile.emailVerified ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] sm:text-xs font-bold bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/40">
                    ✓ <span className="hidden sm:inline">Verified</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 text-[10px] sm:text-xs font-bold bg-amber-500/20 px-2 py-1 rounded border border-amber-500/40">
                    ⚠ <span className="hidden sm:inline">Unverified</span>
                  </span>
                )}
              </div>
            </div>

            {!profile.emailVerified && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-300 text-xs mb-3">
                  📧 Verify your email to secure your account
                </p>

                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp || otpSendingRef.current}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-xs"
                  >
                    {sendingOtp ? "Sending..." : "📧 Send Verification Code"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full p-2.5 rounded-lg border border-slate-600 bg-slate-900 text-white text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-semibold transition disabled:opacity-50 text-xs"
                      >
                        {verifyingOtp ? "Verifying..." : "✓ Verify"}
                      </button>
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp || otpSendingRef.current}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-lg font-semibold transition disabled:opacity-50 text-xs"
                      >
                        {sendingOtp ? "..." : "↻ Resend"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">
                  🔐 Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-400">
                  Extra security for your account
                </p>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={!profile.emailVerified || toggling2FA}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-40 disabled:cursor-not-allowed ${
                  profile.twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-600'
                }`}
              >
                {toggling2FA ? (
                  <span className="inline-block h-4 w-4 rounded-full bg-white animate-pulse mx-auto" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </div>
            {!profile.emailVerified && (
              <p className="mt-2 text-xs text-amber-400">
                ⚠ Verify your email first to enable 2FA
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Country
            </label>
            <select
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full p-2.5 sm:p-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={profile.phoneCode}
                onChange={(e) => setProfile({ ...profile, phoneCode: e.target.value })}
                className="w-20 sm:w-24 p-2.5 sm:p-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
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
                className="flex-1 p-2.5 sm:p-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleProfileUpdate}
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
          >
            {saving ? "Saving Changes..." : "💾 Save Profile"}
          </button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              🔐 Setup Two-Factor Authentication
            </h2>

            {/* QR Code */}
            <div className="mb-6">
              <p className="text-sm text-slate-300 mb-3">
                1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto block">
                
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
              </div>
            </div>
            
            {/* Manual Secret Key */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">
                🔑 Manual Setup Key (Copy & Paste)
              </h3>

              <p className="text-xs text-slate-400 mb-2">
                If QR scan doesn't work, copy this key and paste it in Google Authenticator
              </p>

              <div className="bg-slate-900 p-3 rounded-lg flex items-center justify-between gap-3">
<span className="text-emerald-400 font-mono text-[11px] sm:text-sm break-all leading-tight">

                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(manualKey);
                    alert("✅ Secret key copied!");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Backup Codes Section was deleted here as per request */}
            
            {/* OTP Verify */}
            <div className="mt-4">
              <p className="text-sm text-slate-300 mb-2">
                2. Enter 6-digit code from your Authenticator App to confirm setup
              </p>

              <input
                type="text"
                maxLength={6}
                value={twoFaOtp}
                onChange={(e) => setTwoFaOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full p-2 rounded bg-slate-900 border border-slate-600 text-center text-lg tracking-widest text-white"
                placeholder="123456"
              />

              <button
                onClick={handleVerify2FA}
                disabled={twoFaOtp.length !== 6}
                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                ✅ Verify & Enable 2FA
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShow2FAModal(false);
                setToggling2FA(false); // Stop loading indicator if setup is cancelled
              }}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-lg font-semibold transition mt-3 text-xs"
            >
              Cancel Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}