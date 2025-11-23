"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function WithdrawPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [fee, setFee] = useState(0);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch Wallet Balance
  useEffect(() => {
    fetch("/api/wallet/balance")
      .then((res) => res.json())
      .then((data) => setWalletBalance(data.balance || 0));
  }, []);

  // Auto Calculate Fee (3%) & You Will Receive
  useEffect(() => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFee(0);
      setReceiveAmount(0);
      return;
    }
    const f = amt * 0.03;
    setFee(f);
    setReceiveAmount(amt - f);
  }, [amount]);

  // Submit Withdraw
  const submitWithdraw = async () => {
    if (!amount) return alert("Enter withdraw amount");
    if (!walletAddress) return alert("Please enter your wallet address");

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("walletAddress", walletAddress);
    if (qrImage) formData.append("qrImage", qrImage);

    setLoading(true);

    const res = await fetch("/api/withdraw", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    const data = await res.json();

    if (res.ok) {
      alert("Withdraw request submitted successfully!");
      setAmount("");
      setWalletAddress("");
      setQrImage(null);
    } else {
      alert("Error: " + data.message);
    }
  };

  return (
    <div className="relative min-h-screen text-white p-6 overflow-hidden">

      {/* 🌈 Premium Floating Background Lights */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-3xl rounded-full -top-40 -left-40 animate-float"></div>
        <div className="absolute w-[650px] h-[650px] bg-purple-600/20 blur-3xl rounded-full top-1/3 -right-52 animate-float-slow"></div>
        <div className="absolute w-[400px] h-[400px] bg-pink-500/20 blur-3xl rounded-full bottom-10 left-1/4 animate-float-reverse"></div>
      </div>

      {/* CARD */}
      <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" width={120} height={120} alt="StakeVault Logo" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-6">Withdraw Funds</h1>

        <p className="text-lg mb-4">
          <b>Wallet Balance:</b> ${walletBalance}
        </p>

        {/* Wallet Address */}
        <div className="mb-4">
          <label className="text-sm opacity-80">Your Wallet Address (TRC20)</label>
          <input
            type="text"
            placeholder="TCX2J8... (Your TRC20 Address)"
            className="w-full p-3 bg-black/40 border border-white/20 rounded-xl mt-1 outline-none"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        {/* QR Upload */}
        <div className="mb-4">
          <label className="text-sm opacity-80">Upload QR Code (Optional)</label>
          <input
            type="file"
            className="w-full p-3 bg-black/40 border border-white/20 rounded-xl mt-1"
            accept="image/*"
            onChange={(e) => setQrImage(e.target.files?.[0] || null)}
          />
        </div>

        {/* Withdraw Amount */}
        <div className="mb-4">
          <label className="text-sm opacity-80">Withdraw Amount ($)</label>
          <input
            type="number"
            placeholder="0"
            className="w-full p-3 bg-black/40 border border-white/20 rounded-xl mt-1 outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Summary Box */}
        <div className="bg-white/10 border border-white/20 p-4 rounded-xl mb-4 backdrop-blur-xl">
          <p>Withdraw Fee (3%): <b>${fee.toFixed(2)}</b></p>
          <p>You Will Receive: <b>${receiveAmount.toFixed(2)}</b></p>
          <p className="text-gray-300 text-sm mt-2">Status: Pending → Approved</p>
        </div>

        <button
          onClick={submitWithdraw}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-lg font-semibold transition active:scale-95"
        >
          {loading ? "Submitting..." : "Submit Withdraw Request"}
        </button>
      </div>

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(25px, -25px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float-slow {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-35px, 35px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
          100% { transform: translate(0, 0); }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 28s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 26s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
