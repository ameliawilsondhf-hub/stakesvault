"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function DepositPage() {
  const [settings, setSettings] = useState<any>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [timer, setTimer] = useState(1200);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch settings
  useEffect(() => {
    fetch("/api/settings/get")
      .then((res) => res.json())
      .then((data) => {
        console.log("SETTINGS LOADED:", data);
        setSettings(data.settings);
      });
  }, []);

  // Timer
  useEffect(() => {
    if (showAddress && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [showAddress, timer]);

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${("0" + (sec % 60)).slice(-2)}`;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  // Submit deposit with file upload
  const submitDeposit = async () => {
    setMessage("");

    if (!amount || Number(amount) < 20) {
      setMessage("❌ Minimum deposit is $20");
      return;
    }

    if (!file) {
      setMessage("❌ Please upload payment screenshot");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload screenshot
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        setMessage("❌ Failed to upload screenshot");
        setLoading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      const screenshotPath = uploadData.filePath;

      console.log("📸 Screenshot uploaded:", screenshotPath);

      // Step 2: Create deposit request
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: Number(amount),
          screenshot: screenshotPath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("❌ " + data.message);
        setLoading(false);
        return;
      }

      setMessage("✅ Deposit request submitted successfully!");
      setAmount("");
      setFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Deposit error:", error);
      setMessage("❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!settings)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Loading Settings...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex justify-center items-center p-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-3xl shadow-2xl">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" width={120} height={120} alt="StakeVault" className="drop-shadow-2xl" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">💰 Deposit Funds</h1>
        <p className="text-gray-300 text-center mb-6">Secure and fast deposits</p>

        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <p className="text-lg"><b>Minimum:</b> $20</p>
          <p className="text-lg"><b>Maximum:</b> Unlimited</p>
        </div>

        {!showAddress && (
          <button
            onClick={() => setShowAddress(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Request Deposit Address
          </button>
        )}

        {showAddress && (
          <div className="mt-6 space-y-5">

            {/* ADDRESS SECTION */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-5">
              <p className="text-sm mb-2 text-gray-300">Your Deposit Address (TRC20):</p>

              <div className="flex items-center bg-gray-900 p-3 rounded-xl">
                <input
                  value={settings.depositAddress}
                  readOnly
                  className="w-full bg-transparent outline-none text-white"
                />
                <button
                  className="ml-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.depositAddress);
                    setMessage("✅ Address copied!");
                    setTimeout(() => setMessage(""), 2000);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* QR CODE */}
            <div className="flex justify-center bg-black/40 border border-white/10 rounded-xl p-6">
              {settings.qrImage ? (
                <div className="bg-white p-3 rounded-xl">
                  <Image
                    src={settings.qrImage.startsWith("/") ? settings.qrImage : "/" + settings.qrImage}
                    width={200}
                    height={200}
                    alt="QR Code"
                  />
                </div>
              ) : (
                <p className="text-gray-400">No QR Code Available</p>
              )}
            </div>

            {/* TIMER */}
            <p className="text-yellow-400 text-center font-semibold text-lg">
              ⏳ Address valid for: {formatTime(timer)}
            </p>

            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                placeholder="Enter amount (min $20)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:border-blue-500 transition-all text-white"
                min="20"
              />
            </div>

            {/* FILE UPLOAD */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Payment Screenshot (Required)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="block w-full p-4 bg-gray-900 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl text-center cursor-pointer transition-all"
                >
                  {file ? (
                    <span className="text-green-400 font-semibold">
                      ✓ {file.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      📎 Click to upload screenshot
                    </span>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload proof of payment (PNG, JPG, JPEG)
              </p>
            </div>

            {/* MESSAGE */}
            {message && (
              <div className={`p-4 rounded-xl text-center font-semibold ${
                message.includes("✅") 
                  ? "bg-green-900/50 text-green-400 border border-green-700" 
                  : "bg-red-900/50 text-red-400 border border-red-700"
              }`}>
                {message}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              onClick={submitDeposit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? "Submitting..." : "Submit Deposit Request"}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}