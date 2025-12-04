"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Link, Copy, Users, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Loader2, AlertCircle, Gift, Percent } from 'lucide-react';

// INTERFACES (same as before)
interface ReferralUser {
  _id: string;
  email: string;
  name?: string;
  totalDeposits: number;
  stakedBalance: number;
  createdAt: string;
}

interface ReferralLevel {
  count: number;
  users: ReferralUser[];
  totalDeposits: number;
  totalStaked: number;
}

interface DashboardData {
  success: boolean;
  referralCode: string;
  referralEarnings: number;
  levelIncome: number;
  referralCount: number;
  referralLevels: {
    level1: ReferralLevel;
    level2: ReferralLevel;
    level3: ReferralLevel;
  };
}

const USERS_PER_PAGE = 10;

export default function ReferralPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Authentication & Data Fetching (keep same as before)
  useEffect(() => {
    if (status === "loading") return;
    const checkAuth = async () => {
      const userId = localStorage.getItem("userId");
      if (status === "authenticated" || userId) return;
      router.push("/auth/login");
    };
    checkAuth();
  }, [status, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" && !localStorage.getItem("userId")) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 401) {
          localStorage.removeItem("userId");
          router.push("/auth/login");
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to load data');

        const transformedData = {
          success: true,
          referralCode: result.referralCode || '',
          referralEarnings: result.referralEarnings || 0,
          levelIncome: result.levelIncome || 0,
          referralCount: result.referralCount || 0,
          referralLevels: {
            level1: {
              count: result.referralLevels?.level1?.users?.length || 0,
              users: result.referralLevels?.level1?.users || [],
              totalDeposits: 0,
              totalStaked: 0,
            },
            level2: {
              count: result.referralLevels?.level2?.users?.length || 0,
              users: result.referralLevels?.level2?.users || [],
              totalDeposits: 0,
              totalStaked: 0,
            },
            level3: {
              count: result.referralLevels?.level3?.users?.length || 0,
              users: result.referralLevels?.level3?.users || [],
              totalDeposits: 0,
              totalStaked: 0,
            },
          },
        };

        setData(transformedData);
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, router]);

  useEffect(() => setCurrentPage(1), [activeLevel]);

  const getReferralLink = () => {
    if (!data?.referralCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/auth/register?ref=${data.referralCode}`;
  };

  const copyToClipboard = (text: string, successCallback: (status: boolean) => void) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => successCallback(true))
        .catch(() => {
          const el = document.createElement('textarea');
          el.value = text;
          el.style.position = 'absolute';
          el.style.left = '-9999px';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          successCallback(true);
        });
    }
    setTimeout(() => successCallback(false), 2000);
  };

  const copyCode = () => {
    if (!data?.referralCode) return;
    copyToClipboard(data.referralCode, setCopied);
  };

  const copyLink = () => {
    const link = getReferralLink();
    if (!link) return;
    copyToClipboard(link, setLinkCopied);
  };

  const activeUsers = useMemo(() => {
    if (!data) return [];
    switch (activeLevel) {
      case 1: return data.referralLevels.level1.users || [];
      case 2: return data.referralLevels.level2.users || [];
      case 3: return data.referralLevels.level3.users || [];
      default: return [];
    }
  }, [data, activeLevel]);

  const totalPages = Math.ceil(activeUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return activeUsers.slice(startIndex, endIndex);
  }, [activeUsers, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F0B90B] animate-spin mx-auto mb-4" />
          <div className="text-white text-xl font-semibold">Loading Referral Data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4">
        <div className="bg-[#2B1515] border border-[#CF304A] rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-[#F6465D]" />
            <h2 className="text-[#F6465D] text-xl font-bold">Error</h2>
          </div>
          <p className="text-white mb-4">{error || "No data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] px-4 py-2 rounded-lg transition-colors w-full font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalReferrals = data.referralCount || 0;
  const totalEarnings = (data.referralEarnings || 0) + (data.levelIncome || 0);

  // ✅ PROFESSIONAL STATS WITH PERCENTAGES
  const stats = [
    { 
      level: 1, 
      title: "Level 1", 
      count: data.referralLevels.level1.count, 
      percentage: "10%",
      description: "Direct Referrals",
      color: "from-green-500 to-emerald-600",
      textColor: "text-green-400",
      icon: "🎯"
    },
    { 
      level: 2, 
      title: "Level 2", 
      count: data.referralLevels.level2.count, 
      percentage: "5%",
      description: "2nd Level Network",
      color: "from-blue-500 to-cyan-600",
      textColor: "text-blue-400",
      icon: "🌟"
    },
    { 
      level: 3, 
      title: "Level 3", 
      count: data.referralLevels.level3.count, 
      percentage: "2%",
      description: "3rd Level Network",
      color: "from-purple-500 to-pink-600",
      textColor: "text-purple-400",
      icon: "💎"
    },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* 🎨 MODERN HEADER */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] px-6 py-3 rounded-full mb-4">
            <Gift className="w-6 h-6 text-[#0B0E11]" />
            <h1 className="text-2xl font-bold text-[#0B0E11]">Referral Program</h1>
          </div>
          <p className="text-[#848E9C] text-sm">Invite friends and earn up to 10% commission on every deposit</p>
        </div>

        {/* 💰 EARNINGS BANNER */}
        <div className="bg-gradient-to-r from-[#F0B90B]/10 to-[#F8D12F]/10 border border-[#F0B90B]/30 rounded-xl p-6 mb-6 text-center">
          <p className="text-[#848E9C] text-sm mb-2">Total Earnings</p>
          <p className="text-5xl font-bold text-[#F0B90B] mb-2">${totalEarnings.toFixed(2)}</p>
          <p className="text-[#EAECEF] text-sm">From {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''}</p>
        </div>

        {/* 🔗 REFERRAL CODE & LINK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#181A20] rounded-xl p-5 border border-[#2B3139]">
            <div className="flex items-center gap-2 mb-3">
              <Copy className="w-4 h-4 text-[#F0B90B]" />
              <p className="text-[#848E9C] text-sm font-semibold">Your Referral Code</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-bold text-white tracking-wider font-mono">
                {data.referralCode}
              </span>
              <button
                onClick={copyCode}
                className="bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] px-4 py-2 rounded-lg font-bold transition-all"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-[#181A20] rounded-xl p-5 border border-[#2B3139]">
            <div className="flex items-center gap-2 mb-3">
              <Link className="w-4 h-4 text-[#F0B90B]" />
              <p className="text-[#848E9C] text-sm font-semibold">Referral Link</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                className="flex-1 bg-[#1E2329] text-[#EAECEF] px-3 py-2 rounded-lg text-sm outline-none border border-[#2B3139]"
              />
              <button
                onClick={copyLink}
                className="bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap"
              >
                {linkCopied ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* 📊 COMMISSION LEVELS - PROFESSIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.level} className="bg-[#181A20] rounded-xl p-6 border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-sm font-bold`}>
                  {stat.percentage}
                </div>
              </div>
              
              <h3 className="text-[#EAECEF] font-semibold mb-1">{stat.title}</h3>
              <p className="text-[#848E9C] text-xs mb-3">{stat.description}</p>
              
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${stat.textColor}`}>{stat.count}</span>
                <span className="text-[#848E9C] text-sm">users</span>
              </div>
            </div>
          ))}
        </div>

        {/* 📋 REFERRAL NETWORK */}
        <div className="bg-[#181A20] rounded-xl p-6 border border-[#2B3139]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#EAECEF] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F0B90B]" />
              My Network ({totalReferrals})
            </h2>
          </div>

          {/* Level Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {stats.map((stat) => (
              <button
                key={stat.level}
                onClick={() => setActiveLevel(stat.level as 1 | 2 | 3)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                  activeLevel === stat.level
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {stat.icon} Level {stat.level} ({stat.count})
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="space-y-3 min-h-[300px]">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const userNumber = (currentPage - 1) * USERS_PER_PAGE + index + 1;
                const stat = stats[activeLevel - 1];
                
                return (
                  <div key={user._id} className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139] hover:border-[#F0B90B]/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white font-bold text-sm`}>
                          {userNumber}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#EAECEF] font-semibold text-sm">{user.name || user.email}</p>
                          {user.name && <p className="text-[#848E9C] text-xs">{user.email}</p>}
                          <p className="text-[#848E9C] text-xs mt-1">Joined: {formatDate(user.createdAt)}</p>
                          
                          <div className="flex gap-4 mt-2">
                            <div>
                              <span className="text-[#848E9C] text-xs">Deposits: </span>
                              <span className="text-[#0ECB81] font-semibold text-sm">${user.totalDeposits.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[#848E9C] text-xs">Staked: </span>
                              <span className="text-[#F0B90B] font-semibold text-sm">${user.stakedBalance.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-xs font-bold`}>
                          {stat.percentage}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#1E2329] rounded-lg border border-[#2B3139]">
                <Users className="w-12 h-12 text-[#848E9C] mx-auto mb-3" />
                <p className="text-[#848E9C]">No users in Level {activeLevel} yet</p>
                <p className="text-[#848E9C] text-sm mt-1">Share your link to start earning!</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#1E2329] text-white disabled:opacity-30 hover:bg-[#2B3139] transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-[#EAECEF] text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#1E2329] text-white disabled:opacity-30 hover:bg-[#2B3139] transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* 💡 HOW IT WORKS */}
        <div className="mt-6 bg-[#181A20] rounded-xl p-6 border border-[#2B3139]">
          <h3 className="text-lg font-bold text-[#EAECEF] mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-[#F0B90B]" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold flex-shrink-0">1</div>
              <div>
                <p className="text-[#EAECEF] font-semibold text-sm">Level 1 - 10%</p>
                <p className="text-[#848E9C] text-xs mt-1">Earn 10% commission from direct referrals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">2</div>
              <div>
                <p className="text-[#EAECEF] font-semibold text-sm">Level 2 - 5%</p>
                <p className="text-[#848E9C] text-xs mt-1">Earn 5% from your referrals' referrals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">3</div>
              <div>
                <p className="text-[#EAECEF] font-semibold text-sm">Level 3 - 2%</p>
                <p className="text-[#848E9C] text-xs mt-1">Earn 2% from third-level network</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}