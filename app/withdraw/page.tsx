"use client";
import { useState, useEffect } from "react";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load wallet balance
  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.walletBalance !== undefined) {
          setWalletBalance(data.data.walletBalance);
        }
      });
  }, []);

  const handleWithdraw = async () => {
    setMessage("");

    if (!amount || Number(amount) <= 0) {
      setMessage("Enter valid amount");
      return;
    }

    if (Number(amount) > walletBalance) {
      setMessage("Insufficient wallet balance");
      return;
    }

    if (!walletAddress || walletAddress.length < 5) {
      setMessage("Enter valid wallet address (TRC20)");
      return;
    }

    setLoading(true);

    // ----------- BUILD FORMDATA (Required for file upload) -----------
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("walletAddress", walletAddress);
    if (qrImage) formData.append("qrImage", qrImage);

    const res = await fetch("/api/withdraw", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage("Withdraw request submitted!");
      setAmount("");
      setWalletAddress("");
      setQrImage(null);
    } else {
      setMessage(data.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Withdraw Funds</h1>

      <div className="bg-gray-900 p-6 rounded-xl max-w-lg mx-auto">
        <p className="text-gray-300 mb-3">
          <strong>Wallet Balance:</strong> ${walletBalance}
        </p>

        <label className="block mb-2 text-lg">Your Wallet Address (TRC20)</label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
          placeholder="Enter your USDT TRC20 address"
        />

        <label className="block mt-4 mb-2 text-lg">Upload QR Code (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setQrImage(e.target.files?.[0] || null)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
        />

        <label className="block mt-4 mb-2 text-lg">Withdraw Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
          placeholder="Enter amount"
        />

        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold"
        >
          {loading ? "Processing..." : "Submit Withdraw Request"}
        </button>

        {message && (
          <p className="mt-4 text-yellow-400 font-semibold text-center">{message}</p>
        )}
      </div>
    </div>
  );
}
