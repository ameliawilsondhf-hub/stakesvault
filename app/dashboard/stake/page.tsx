"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StakeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/dashboard");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (unlockDate: string) => {
    const diff = new Date(unlockDate).getTime() - new Date().getTime();
    if (diff <= 0) return "Unlocked";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  };

  const getProgress = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const n = new Date().getTime();
    return Math.min(Math.max(((n - s) / (e - s)) * 100, 0), 100);
  };

  // ⭐ Calculate daily earnings (1% of current amount)
  const calculateDailyEarnings = (amount: number) => {
    return amount * 0.01; // 1% daily
  };

  // ⭐ Calculate total earned so far (based on days passed)
  const calculateTotalEarned = (amount: number, stakedAt: string) => {
    const daysPassed = Math.floor(
      (new Date().getTime() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    // Compound interest formula: A = P(1 + r)^n - P
    const currentAmount = amount * Math.pow(1.01, daysPassed);
    return currentAmount - amount;
  };

  // ⭐ Calculate current balance with compound interest
  const calculateCurrentBalance = (amount: number, stakedAt: string) => {
    const daysPassed = Math.floor(
      (new Date().getTime() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return amount * Math.pow(1.01, daysPassed);
  };

  // ⭐ Calculate total daily earnings from all stakes
  const getTotalDailyEarnings = () => {
    if (!data?.stakes) return 0;
    return data.stakes.reduce((sum: number, stake: any) => {
      const currentBalance = calculateCurrentBalance(stake.amount, stake.stakedAt);
      return sum + calculateDailyEarnings(currentBalance);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Staking Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-gray-400 mb-2">Available Balance</h3>
            <p className="text-4xl font-bold mb-4">
              ${data?.walletBalance?.toFixed(2) || "0.00"}
            </p>
            <Link href="/dashboard/stake-plan">
              <button className="block w-full text-center bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold">
                Start Staking
              </button>
            </Link>
          </div>

          <div className="bg-blue-900 rounded-xl p-6 border border-blue-700">
            <h3 className="text-blue-300 mb-2">Total Staked</h3>
            <p className="text-4xl font-bold mb-2">
              ${data?.stakedBalance?.toFixed(2) || "0.00"}
            </p>
            <p className="text-blue-300 text-sm">Locked and Earning</p>
          </div>

          {/* ⭐ NEW: Daily Earnings Card */}
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-xl p-6 border border-green-700">
            <h3 className="text-green-300 mb-2 flex items-center gap-2">
              <span>💰</span> Daily Earnings
            </h3>
            <p className="text-4xl font-bold mb-2 text-green-400">
              ${getTotalDailyEarnings().toFixed(2)}
            </p>
            <p className="text-green-300 text-sm">Compounding Daily (1%)</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6">Active Stakes</h2>

          {!data?.stakes || data.stakes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No active stakes</p>
              <Link href="/dashboard/stake-plan">
                <button className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-bold">
                  Create First Stake
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.stakes.map((stake: any, idx: number) => {
                const currentBalance = calculateCurrentBalance(stake.amount, stake.stakedAt);
                const totalEarned = calculateTotalEarned(stake.amount, stake.stakedAt);
                const dailyEarning = calculateDailyEarnings(currentBalance);

                return (
                  <div key={idx} className="bg-slate-700 rounded-lg p-5 border border-slate-600">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold">${stake.amount?.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">
                          APY: <span className="text-green-400">{stake.apy}%</span>
                        </p>
                      </div>

                      {/* ⭐ Current Balance */}
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Current Balance</p>
                        <p className="font-bold text-blue-400 text-xl">
                          ${currentBalance.toFixed(2)}
                        </p>
                      </div>

                      {/* ⭐ Daily Earnings */}
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Daily Earnings</p>
                        <p className="font-bold text-green-400 text-lg">
                          +${dailyEarning.toFixed(2)}
                        </p>
                      </div>

                      {/* ⭐ Total Earned */}
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Total Earned</p>
                        <p className="font-bold text-emerald-400 text-lg">
                          +${totalEarned.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-400">Lock Period</p>
                        <p className="font-bold">{stake.lockPeriod} Days</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-400">Unlocks in</p>
                        <p className="font-bold text-orange-400 text-lg">
                          {getTimeRemaining(stake.unlockDate)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${getProgress(stake.stakedAt, stake.unlockDate)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{new Date(stake.stakedAt).toLocaleDateString()}</span>
                      <span>{new Date(stake.unlockDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}