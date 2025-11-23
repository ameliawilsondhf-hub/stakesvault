"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function DepositPage() {
  const [settings, setSettings] = useState<any>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [timer, setTimer] = useState(1200);
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ⭐ NEW: Get user
  const [user, setUser] = useState<any>(null);

  // ⭐ Fullscreen QR modal
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // 🔥 Fetch settings
  useEffect(() => {
    fetch("/api/settings/get")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings));
  }, []);

  // 🔥 Fetch logged-in user
  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, []);

  // ⏳ Timer
  useEffect(() => {
    if (showAddress && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [showAddress, timer]);

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${("0" + (sec % 60)).slice(-2)}`;

  // 📩 Submit Deposit
  const submitDeposit = async () => {
    if (!amount) return alert("Enter amount");
    if (!screenshot) return alert("Upload screenshot");
    if (!user?._id) return alert("User not authenticated");

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("screenshot", screenshot);
    formData.append("userId", user._id); // 🔥 CRITICAL FIX

    setLoading(true);
    const res = await fetch("/api/deposit", {
      method: "POST",
      body: formData,
    });
    setLoading(false);

    const data = await res.json();

    if (res.ok) {
      alert("Deposit Request Submitted Successfully!");
      setAmount("");
      setScreenshot(null);
      setShowAddress(false);
      setTimer(1200);
    } else {
      alert("Error: " + data.message);
    }
  };

  if (!settings)
    return <p className="text-white text-center mt-10">Loading Settings...</p>;

  return (
    <div className="min-h-screen text-white flex justify-center p-6">
      <div className="bg-[#0d1117] p-8 rounded-2xl w-full max-w-3xl">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" width={120} height={120} alt="StakeVault" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-6">💰 Deposit Funds</h1>

        <p className="text-lg"><b>Minimum:</b> $20</p>
        <p className="text-lg mb-6"><b>Maximum:</b> Unlimited</p>

        {!showAddress && (
          <button
            onClick={() => setShowAddress(true)}
            className="w-full bg-blue-600 py-4 rounded-xl text-lg"
          >
            Request Deposit Address
          </button>
        )}

        {showAddress && (
          <div className="mt-6 p-5 bg-black/40 border rounded-xl">

            <p className="text-sm mb-2">Your Deposit Address (TRC20):</p>

            {/* ADDRESS FIELD */}
            <div className="flex items-center bg-gray-900 p-3 rounded-xl">
              <input
                value={settings.depositAddress}
                readOnly
                className="w-full bg-transparent outline-none text-white"
              />
              <button
                className="ml-2 bg-blue-500 px-3 py-1 rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(settings.depositAddress);
                  alert("Address Copied!");
                }}
              >
                Copy
              </button>
            </div>

            {/* QR IMAGE (Tap to enlarge) */}
            <div className="flex justify-center my-4">
              {settings.qrImage ? (
                <img
                  src={
                    settings.qrImage.startsWith("/")
                      ? settings.qrImage
                      : "/" + settings.qrImage
                  }
                  width={180}
                  height={180}
                  alt="QR Code"
                  onClick={() =>
                    setQrPreview(
                      settings.qrImage.startsWith("/")
                        ? settings.qrImage
                        : "/" + settings.qrImage
                    )
                  }
                  className="cursor-pointer rounded-xl shadow-lg hover:scale-105 transition-all"
                />
              ) : (
                <p>No QR Uploaded</p>
              )}
            </div>

            {/* TIMER */}
            <p className="text-yellow-400 text-center mb-4">
              ⏳ Address valid for: {formatTime(timer)}
            </p>

            {/* AMOUNT */}
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full p-3 bg-gray-900 rounded-xl mb-4"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {/* SCREENSHOT */}
            <input
              type="file"
              accept="image/*"
              className="w-full bg-gray-800 p-3 rounded-xl mb-4"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />

            {/* SUBMIT */}
            <button
              onClick={submitDeposit}
              disabled={loading}
              className="w-full bg-blue-600 py-4 rounded-xl text-lg"
            >
              {loading ? "Submitting..." : "Submit Deposit Request"}
            </button>
          </div>
        )}
      </div>

      {/* ⭐ Fullscreen QR Preview Modal */}
      {qrPreview && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setQrPreview(null)}
        >
          <img
            src={qrPreview}
            alt="QR Preview"
            className="max-w-full max-h-full object-contain rounded-2xl animate-zoom"
          />

          <style jsx>{`
            @keyframes zoom {
              0% {
                opacity: 0;
                transform: scale(0.7);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-zoom {
              animation: zoom 0.25s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
