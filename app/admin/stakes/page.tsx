"use client";

import { useEffect, useState } from "react";

interface Stake {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    walletBalance?: number;
    stakedBalance?: number;
  };
  amount: number;
  originalAmount: number;
  currentAmount: number;
  stakedAt: string;
  unlockDate: string;
  lockPeriod: number;
  status: 'active' | 'completed' | 'withdrawn';
  apy: number;
  earnedRewards: number;
  totalProfit: number;
  cycle: number;
}

export default function AdminStakesPage() {
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'withdrawn'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/stake/admin", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch stakes");
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log("Fetched stakes:", data);
      setStakes(data.stakes || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  // ⭐ Calculation Functions
  const calculateCurrentBalance = (originalAmount: number, stakedAt: string) => {
    const daysPassed = Math.floor(
      (new Date().getTime() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return originalAmount * Math.pow(1.01, daysPassed);
  };

  const calculateDailyEarnings = (currentBalance: number) => {
    return currentBalance * 0.01; // 1% daily
  };

  const calculateTotalEarned = (originalAmount: number, stakedAt: string) => {
    const currentBalance = calculateCurrentBalance(originalAmount, stakedAt);
    return currentBalance - originalAmount;
  };

  // Filter by status
  const filteredByStatus = stakes.filter(stake => {
    if (filter === 'all') return true;
    return stake.status === filter;
  });

  // Filter by search query (name or email)
  const filteredStakes = filteredByStatus.filter(stake => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stake.userId?.name?.toLowerCase().includes(query) ||
      stake.userId?.email?.toLowerCase().includes(query)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStakes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStakes = filteredStakes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // ⭐ Enhanced Statistics
  const totalStaked = stakes.reduce((sum, s) => sum + (s.originalAmount || s.amount), 0);
  const totalCurrentValue = stakes.reduce((sum, s) => {
    if (s.status === 'active') {
      return sum + calculateCurrentBalance(s.originalAmount || s.amount, s.stakedAt);
    }
    return sum + (s.originalAmount || s.amount);
  }, 0);
  const totalEarnings = stakes.reduce((sum, s) => {
    if (s.status === 'active') {
      return sum + calculateTotalEarned(s.originalAmount || s.amount, s.stakedAt);
    }
    return sum + (s.earnedRewards || 0);
  }, 0);
  const totalDailyPayouts = stakes
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const current = calculateCurrentBalance(s.originalAmount || s.amount, s.stakedAt);
      return sum + calculateDailyEarnings(current);
    }, 0);

  const activeStakes = stakes.filter(s => s.status === 'active').length;
  const completedStakes = stakes.filter(s => s.status === 'completed').length;
  const totalUsers = new Set(stakes.map(s => s.userId?._id)).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getDaysRemaining = (unlockDate: string) => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    const diffTime = unlock.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg mb-8 backdrop-blur-xl">
          <h1 className="text-4xl text-white font-bold flex items-center gap-3">
            🔒 Staking Dashboard
          </h1>
          <p className="text-gray-300">Manage all user stakes • Live Data</p>
        </div>

        {/* ⭐ ENHANCED STATS - 2 Rows */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 border border-blue-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <span>👥</span> Total Users
            </p>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>

          <div className="bg-gradient-to-br from-green-600/30 to-green-800/30 border border-green-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-green-300 text-sm flex items-center gap-2">
              <span>💰</span> Original Staked
            </p>
            <p className="text-3xl font-bold text-white">${totalStaked.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-600/30 to-cyan-800/30 border border-cyan-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-cyan-300 text-sm flex items-center gap-2">
              <span>📈</span> Current Value (TVL)
            </p>
            <p className="text-3xl font-bold text-white">${totalCurrentValue.toFixed(2)}</p>
            <p className="text-xs text-cyan-400 mt-1">With Compound Interest</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 border border-emerald-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-emerald-300 text-sm flex items-center gap-2">
              <span>✨</span> Total Earnings
            </p>
            <p className="text-3xl font-bold text-white">+${totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-emerald-400 mt-1">Platform Profit Generated</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-600/30 to-orange-800/30 border border-orange-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-orange-300 text-sm flex items-center gap-2">
              <span>🔥</span> Active Stakes
            </p>
            <p className="text-3xl font-bold text-white">{activeStakes}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-purple-300 text-sm flex items-center gap-2">
              <span>✅</span> Completed
            </p>
            <p className="text-3xl font-bold text-white">{completedStakes}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 border border-yellow-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-yellow-300 text-sm flex items-center gap-2">
              <span>💸</span> Daily Payouts
            </p>
            <p className="text-3xl font-bold text-white">${totalDailyPayouts.toFixed(2)}</p>
            <p className="text-xs text-yellow-400 mt-1">Compounding Daily (1%)</p>
          </div>

          <div className="bg-gradient-to-br from-pink-600/30 to-pink-800/30 border border-pink-500/40 p-6 rounded-xl backdrop-blur-xl">
            <p className="text-pink-300 text-sm flex items-center gap-2">
              <span>📊</span> Total Stakes
            </p>
            <p className="text-3xl font-bold text-white">{stakes.length}</p>
          </div>
        </div>

        {/* SEARCH & ITEMS PER PAGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Show 10 per page</option>
            <option value={25}>Show 25 per page</option>
            <option value={50}>Show 50 per page</option>
            <option value={100}>Show 100 per page</option>
          </select>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All ({stakes.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🔥 Active ({activeStakes})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              filter === 'completed' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ✅ Completed ({completedStakes})
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-white/10 border-b border-white/20 p-4 text-white font-bold flex justify-between items-center">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredStakes.length)} of {filteredStakes.length} stakes</span>
            {searchQuery && <span className="text-blue-300 text-sm">🔍 Search active</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-white/10 sticky top-0">
                <tr>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Original</th>
                  <th className="p-4 text-left">Current</th>
                  <th className="p-4 text-left">Daily</th>
                  <th className="p-4 text-left">Earned</th>
                  <th className="p-4 text-left">Lock</th>
                  <th className="p-4 text-left">APY</th>
                  <th className="p-4 text-left">Cycle</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Staked At</th>
                  <th className="p-4 text-left">Days Left</th>
                </tr>
              </thead>

              <tbody>
                {paginatedStakes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-400">
                      {searchQuery ? 'No stakes found for this search' : 'No stakes found'}
                    </td>
                  </tr>
                ) : (
                  paginatedStakes.map((stake) => {
                    const originalAmount = stake.originalAmount || stake.amount;
                    const currentBalance = stake.status === 'active' 
                      ? calculateCurrentBalance(originalAmount, stake.stakedAt)
                      : originalAmount;
                    const dailyEarning = stake.status === 'active' 
                      ? calculateDailyEarnings(currentBalance)
                      : 0;
                    const totalEarned = stake.status === 'active'
                      ? calculateTotalEarned(originalAmount, stake.stakedAt)
                      : stake.earnedRewards || 0;

                    return (
                      <tr key={stake._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                              {stake.userId?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{stake.userId?.name || 'Unknown'}</p>
                              <p className="text-gray-400 text-xs">{stake.userId?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300 font-semibold text-sm">
                          ${originalAmount.toFixed(2)}
                        </td>
                        <td className="p-4 text-blue-400 font-bold">
                          ${currentBalance.toFixed(2)}
                        </td>
                        <td className="p-4 text-green-400 font-bold text-sm">
                          {stake.status === 'active' ? `+$${dailyEarning.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 text-emerald-400 font-bold">
                          +${totalEarned.toFixed(2)}
                        </td>
                        <td className="p-4 text-cyan-300 text-sm">{stake.lockPeriod}d</td>
                        <td className="p-4 text-yellow-300 font-bold text-sm">{stake.apy}%</td>
                        <td className="p-4 text-purple-300 font-semibold">#{stake.cycle || 1}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            stake.status === 'active' ? 'bg-green-600/20 text-green-300 border border-green-500/30' :
                            stake.status === 'completed' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                            'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {stake.status === 'active' ? '🔥 ACTIVE' : 
                             stake.status === 'completed' ? '✅ DONE' : '📦 WITHDRAWN'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 text-xs">{formatDate(stake.stakedAt)}</td>
                        <td className="p-4">
                          {stake.status === 'active' ? (
                            <span className="text-orange-300 font-bold">{getDaysRemaining(stake.unlockDate)}d</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="bg-white/10 border-t border-white/20 p-4 flex justify-between items-center">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
              >
                ← Previous
              </button>

              <div className="flex gap-2">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => goToPage(page as number)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}