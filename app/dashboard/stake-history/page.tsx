"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ⭐ Calculation Functions
const calculateDailyEarnings = (amount: number) => {
  return amount * 0.01; // 1% daily
};

const calculateTotalEarned = (amount: number, stakedAt: string) => {
  const daysPassed = Math.floor(
    (new Date().getTime() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentAmount = amount * Math.pow(1.01, daysPassed);
  return currentAmount - amount;
};

const calculateCurrentBalance = (amount: number, stakedAt: string) => {
  const daysPassed = Math.floor(
    (new Date().getTime() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return amount * Math.pow(1.01, daysPassed);
};

export default function StakeHistoryPage() {
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, unlocked

  useEffect(() => {
    fetchStakes();
  }, []);

  const fetchStakes = async () => {
    try {
      const res = await fetch("/api/user/dashboard");
      const result = await res.json();
      if (result.success) {
        setStakes(result.stakes || []);
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
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (unlockDate: string) => {
    const isUnlocked = getTimeRemaining(unlockDate) === "Unlocked";
    if (isUnlocked) {
      return (
        <span className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full text-sm font-bold">
          ✅ Unlocked
        </span>
      );
    }
    return (
      <span className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full text-sm font-bold">
        🔒 Active
      </span>
    );
  };

  const filteredStakes = stakes.filter((stake) => {
    if (filter === "all") return true;
    const isUnlocked = getTimeRemaining(stake.unlockDate) === "Unlocked";
    if (filter === "active") return !isUnlocked;
    if (filter === "unlocked") return isUnlocked;
    return true;
  });

  const activeCount = stakes.filter(s => getTimeRemaining(s.unlockDate) !== "Unlocked").length;
  const unlockedCount = stakes.filter(s => getTimeRemaining(s.unlockDate) === "Unlocked").length;
  const totalStaked = stakes.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  // ⭐ Calculate total earnings
  const totalEarnings = stakes.reduce((sum, s) => {
    return sum + calculateTotalEarned(s.amount, s.stakedAt);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] flex items-center justify-center">
        <div className="text-white text-2xl">Loading stake history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              📜 Stake History
            </h1>
            <p className="text-gray-400">View all your staking activities</p>
          </div>
          <Link href="/dashboard/stake-plan">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl">
              + New Stake
            </button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20">
            <p className="text-gray-400 text-sm mb-1">Total Stakes</p>
            <p className="text-3xl font-bold">{stakes.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20">
            <p className="text-gray-400 text-sm mb-1">Active Stakes</p>
            <p className="text-3xl font-bold text-orange-400">{activeCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20">
            <p className="text-gray-400 text-sm mb-1">Total Staked</p>
            <p className="text-3xl font-bold text-blue-400">${totalStaked.toFixed(2)}</p>
          </div>
          {/* ⭐ NEW: Total Earnings Card */}
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl rounded-xl p-5 border border-green-500/30">
            <p className="text-green-300 text-sm mb-1">💰 Total Earnings</p>
            <p className="text-3xl font-bold text-green-400">+${totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            All ({stakes.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              filter === "active"
                ? "bg-orange-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter("unlocked")}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              filter === "unlocked"
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
        </div>

        {/* Stakes Table/Cards */}
        {filteredStakes.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-16 border border-white/20 text-center">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-400 text-xl mb-6">
              {filter === "all" 
                ? "No stake history found" 
                : `No ${filter} stakes found`}
            </p>
            <Link href="/dashboard/stake-plan">
              <button className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all">
                Create First Stake
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/20">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-300">Original</th>
                      <th className="p-4 text-left font-bold text-gray-300">Current</th>
                      <th className="p-4 text-left font-bold text-gray-300">Daily</th>
                      <th className="p-4 text-left font-bold text-gray-300">Earned</th>
                      <th className="p-4 text-left font-bold text-gray-300">APY</th>
                      <th className="p-4 text-left font-bold text-gray-300">Lock</th>
                      <th className="p-4 text-left font-bold text-gray-300">Staked</th>
                      <th className="p-4 text-left font-bold text-gray-300">Unlocks</th>
                      <th className="p-4 text-left font-bold text-gray-300">Remaining</th>
                      <th className="p-4 text-center font-bold text-gray-300">Status</th>
                      <th className="p-4 text-center font-bold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStakes.map((stake: any, idx: number) => {
                      const currentBalance = calculateCurrentBalance(stake.amount, stake.stakedAt);
                      const dailyEarning = calculateDailyEarnings(currentBalance);
                      const totalEarned = calculateTotalEarned(stake.amount, stake.stakedAt);

                      return (
                        <tr
                          key={idx}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-bold text-gray-300 text-lg">
                              ${stake.amount?.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-blue-400 text-lg">
                              ${currentBalance.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-green-400">
                              +${dailyEarning.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-400">
                              +${totalEarned.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-purple-400">
                              {stake.apy}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold">{stake.lockPeriod}d</span>
                          </td>
                          <td className="p-4 text-gray-300 text-sm">
                            {new Date(stake.stakedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-gray-300 text-sm">
                            {new Date(stake.unlockDate).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-orange-400">
                              {getTimeRemaining(stake.unlockDate)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(stake.unlockDate)}
                          </td>
                          <td className="p-4 text-center">
                            {getTimeRemaining(stake.unlockDate) === "Unlocked" ? (
                              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm transition-all">
                                Withdraw
                              </button>
                            ) : (
                              <span className="text-gray-500 text-sm">Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredStakes.map((stake: any, idx: number) => {
                const currentBalance = calculateCurrentBalance(stake.amount, stake.stakedAt);
                const dailyEarning = calculateDailyEarnings(currentBalance);
                const totalEarned = calculateTotalEarned(stake.amount, stake.stakedAt);

                return (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Original Amount</p>
                        <p className="text-2xl font-bold text-gray-300">
                          ${stake.amount?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          APY: <span className="text-purple-400 font-semibold">{stake.apy}%</span>
                        </p>
                      </div>
                      {getStatusBadge(stake.unlockDate)}
                    </div>

                    {/* ⭐ Earnings Section */}
                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Current</p>
                        <p className="text-sm font-bold text-blue-400">
                          ${currentBalance.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Daily</p>
                        <p className="text-sm font-bold text-green-400">
                          +${dailyEarning.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Earned</p>
                        <p className="text-sm font-bold text-emerald-400">
                          +${totalEarned.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lock Period:</span>
                        <span className="font-semibold">{stake.lockPeriod} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Staked:</span>
                        <span>{new Date(stake.stakedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Unlocks:</span>
                        <span>{new Date(stake.unlockDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time Remaining:</span>
                        <span className="font-bold text-orange-400">
                          {getTimeRemaining(stake.unlockDate)}
                        </span>
                      </div>
                    </div>

                    {getTimeRemaining(stake.unlockDate) === "Unlocked" && (
                      <button className="mt-4 w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold transition-all">
                        Withdraw
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}