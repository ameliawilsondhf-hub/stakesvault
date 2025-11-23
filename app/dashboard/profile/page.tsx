"use client";

import { useEffect, useState } from "react";
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
  { name: "Czech Republic", code: "+420" },
  { name: "Denmark", code: "+45" },
  { name: "Egypt", code: "+20" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Germany", code: "+49" },
  { name: "Greece", code: "+30" },
  { name: "Hong Kong", code: "+852" },
  { name: "Hungary", code: "+36" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Kenya", code: "+254" },
  { name: "Kuwait", code: "+965" },
  { name: "Lebanon", code: "+961" },
  { name: "Malaysia", code: "+60" },
  { name: "Mexico", code: "+52" },
  { name: "Morocco", code: "+212" },
  { name: "Netherlands", code: "+31" },
  { name: "New Zealand", code: "+64" },
  { name: "Nigeria", code: "+234" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Palestine", code: "+970" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Qatar", code: "+974" },
  { name: "Romania", code: "+40" },
  { name: "Russia", code: "+7" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Singapore", code: "+65" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syria", code: "+963" },
  { name: "Taiwan", code: "+886" },
  { name: "Thailand", code: "+66" },
  { name: "Turkey", code: "+90" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Vietnam", code: "+84" },
  { name: "Yemen", code: "+967" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile data
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    phoneCode: "+1",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    emailVerified: false,
    twoFactorEnabled: false,
  });

  // ✅ NEW: Two-Factor Data State
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: "",
    secret: "",
    backupCodes: [] as string[],
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        postalCode: data.postalCode || "",
        emailVerified: data.emailVerified || false,
        twoFactorEnabled: data.twoFactorEnabled || false,
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
          ...profile,
          phone: fullPhone,
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters!" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMessage({ type: "error", text: data.message || "Password change failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ✅ UPDATED: Toggle Two-Factor Authentication
  const toggleTwoFactor = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/security/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enable: !profile.twoFactorEnabled,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile({ ...profile, twoFactorEnabled: !profile.twoFactorEnabled });
        
        // ✅ If enabling, show QR code and backup codes
        if (data.qrCode) {
          setTwoFactorData({
            qrCode: data.qrCode,
            secret: data.secret,
            backupCodes: data.backupCodes,
          });
        } else {
          // Clear data when disabling
          setTwoFactorData({
            qrCode: "",
            secret: "",
            backupCodes: [],
          });
        }
        
        setMessage({ 
          type: "success", 
          text: data.message
        });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#06080e] dark:via-[#0f121b] dark:to-[#161b26]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#06080e] dark:via-[#0f121b] dark:to-[#161b26] p-6">
      
      {/* Back Button */}
      <Link href="/dashboard">
        <button className="mb-6 px-4 py-2 bg-white/20 dark:bg-white/10 border border-white/30 rounded-xl text-gray-800 dark:text-white hover:bg-white/30 dark:hover:bg-white/20 transition">
          ← Back to Dashboard
        </button>
      </Link>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-4 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "profile"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            👤 Profile Info
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "security"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            🔒 Security
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`max-w-4xl mx-auto mb-6 p-4 rounded-xl ${
          message.type === "success" 
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Info Tab */}
      {activeTab === "profile" && (
        <div className="max-w-4xl mx-auto bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {profile.emailVerified ? "✓ Verified" : "⚠️ Not verified"}
              </p>
            </div>

            {/* Phone with Country Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={profile.phoneCode}
                  onChange={(e) => setProfile({ ...profile, phoneCode: e.target.value })}
                  className="w-32 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {countries.map((country, idx) => (
                    <option key={`phone-${country.code}-${idx}`} value={country.code}>
                      {country.code} {country.name}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234567890"
                  className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 Main Street"
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="New York"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  placeholder="10001"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Country Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <select
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Change Password */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* ✅ TWO-FACTOR AUTHENTICATION WITH QR CODE */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add an extra layer of security to your account with Google Authenticator
            </p>
            
            {/* Status & Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
              <span className="text-gray-800 dark:text-white font-medium">
                Status: {profile.twoFactorEnabled ? "✓ Enabled" : "✗ Disabled"}
              </span>
              <button 
                onClick={toggleTwoFactor}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  profile.twoFactorEnabled
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } disabled:opacity-50`}
              >
                {saving ? "Processing..." : profile.twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* ✅ QR Code & Setup Instructions */}
            {twoFactorData.qrCode && (
              <div className="mt-6 space-y-6">
                
                {/* QR Code */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
                    📱 Scan QR Code
                  </h3>
                  <div className="flex justify-center mb-4">
                    <img 
                      src={twoFactorData.qrCode} 
                      alt="2FA QR Code" 
                      className="w-64 h-64 border-4 border-purple-500 rounded-xl"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Scan this QR code with Google Authenticator or Authy app
                  </p>
                </div>

                {/* Manual Setup */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3">
                    🔑 Manual Setup Key
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                    If you can't scan the QR code, enter this key manually:
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
                    {twoFactorData.secret}
                  </div>
                </div>

                {/* Backup Codes */}
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-3">
                    🚨 Backup Codes
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                    <strong>IMPORTANT:</strong> Save these backup codes in a safe place. 
                    You can use them to login if you lose access to your authenticator app.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {twoFactorData.backupCodes.map((code, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-gray-800 p-2 rounded-lg font-mono text-sm text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const codes = twoFactorData.backupCodes.join('\n');
                      navigator.clipboard.writeText(codes);
                      alert('Backup codes copied to clipboard!');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-semibold transition"
                  >
                    📋 Copy All Backup Codes
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">
                    📖 Setup Instructions
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li>Download Google Authenticator or Authy app on your phone</li>
                    <li>Open the app and tap "Add Account" or "+"</li>
                    <li>Scan the QR code above with your phone camera</li>
                    <li>The app will generate a 6-digit code every 30 seconds</li>
                    <li>Save your backup codes in a safe place</li>
                    <li>Use the 6-digit code to login from now on</li>
                  </ol>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}