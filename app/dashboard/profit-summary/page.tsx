"use client";

import { useEffect, useState } from "react";

export default function ProfitSummary() {
  const [wallet, setWallet] = useState(0);
  const dailyRate = 1; // 1% FIX
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const res = await fetch("/api/user/dashboard", { cache: "no-store" });
    const json = await res.json();
    setWallet(json.walletBalance || 0);

    calculate(json.walletBalance || 0);
  };

  const calculate = (P: number) => {
    const r = dailyRate / 100;

    const oneMonth = P * Math.pow(1 + r, 30) - P;
    const threeMonth = P * Math.pow(1 + r, 90) - P;
    const sixMonth = P * Math.pow(1 + r, 180) - P;
    const oneYear = P * Math.pow(1 + r, 365) - P;
    const fiveYear = P * Math.pow(1 + r, 365 * 5) - P;

    setSummary({
      oneMonth: Number(oneMonth.toFixed(2)),
      threeMonth: Number(threeMonth.toFixed(2)),
      sixMonth: Number(sixMonth.toFixed(2)),
      oneYear: Number(oneYear.toFixed(2)),
      fiveYear: Number(fiveYear.toFixed(2)),
    });
  };

  if (!summary) return <p className="text-white p-10">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#06080e] via-[#0f121b] to-[#161b26] text-white">

      <h1 className="text-4xl font-bold mb-8">Profit Summary</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        <Card label="1 Month Profit" value={summary.oneMonth} />
        <Card label="3 Months Profit" value={summary.threeMonth} />
        <Card label="6 Months Profit" value={summary.sixMonth} />
        <Card label="1 Year Profit" value={summary.oneYear} />
        <Card label="5 Year Profit" value={summary.fiveYear} />
        <Card label="Daily Rate" value={"1% Daily"} />
      </div>
    </div>
  );
}

function Card({ label, value }: any) {
  return (
    <div className="p-6 bg-white/10 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl hover:scale-[1.02] transition">
      <p className="text-white/60">{label}</p>
      <p className="text-3xl font-bold mt-2">${value.toLocaleString()}</p>
    </div>
  );
}
