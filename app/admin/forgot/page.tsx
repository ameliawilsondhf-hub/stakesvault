"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!email) return alert("Enter your admin email");

    setLoading(true);

    const res = await fetch("/api/admin/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) return alert(data.message);

    alert("OTP sent to your email!");
    setOtpSent(true);
  };

  const resetPassword = async () => {
    if (!otp || !newPassword) return alert("Enter OTP & new password");

    setLoading(true);

    const res = await fetch("/api/admin/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    setLoading(false);

    const data = await res.json();
    if (res.ok) {
      alert("Password reset successfully!");
      window.location.href = "/admin/login";
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-purple-900 p-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        <h1 className="text-3xl text-white font-bold text-center mb-6">
          Reset Password
        </h1>

        {!otpSent ? (
          <>
            <input
              type="email"
              placeholder="Enter admin email"
              className="w-full p-3 bg-gray-900 text-white rounded-xl mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full p-3 bg-gray-900 text-white rounded-xl mb-4"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              className="w-full p-3 bg-gray-900 text-white rounded-xl mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              onClick={resetPassword}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl text-white"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
