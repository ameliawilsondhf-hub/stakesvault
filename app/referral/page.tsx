"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Link, Copy, Users, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Hash, Loader2, AlertCircle } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface ReferralUser {
  _id: string;
  email: string;
  name?: string;
  totalDeposits: number;
  stakedBalance: number;
  createdAt: string;  // ⭐ Backend returns createdAt, not registeredAt
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Downline Tabs and Pagination
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================
  // FETCH REAL DATA FROM DASHBOARD API
  // ============================================
 useEffect(() => {
  const fetchData = async () => {
    try {
      // ✅ Use dedicated referral API
      const response = await fetch('/api/referral/assign');  // ← Change this
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load data');
      }

      // ✅ Transform data to match expected format
      const transformedData = {
        success: true,
        referralCode: result.data.referralCode || '',
        referralEarnings: result.data.referralEarnings || 0,
        levelIncome: result.data.levelIncome || 0,
        referralCount: result.data.referralCount || 0,
        referralLevels: {
          level1: {
            count: result.data.level1?.length || 0,
            users: result.data.level1 || [],
            totalDeposits: 0,
            totalStaked: 0,
          },
          level2: {
            count: result.data.level2?.length || 0,
            users: result.data.level2 || [],
            totalDeposits: 0,
            totalStaked: 0,
          },
          level3: {
            count: result.data.level3?.length || 0,
            users: result.data.level3 || [],
            totalDeposits: 0,
            totalStaked: 0,
          },
        },
      };

      setData(transformedData);
      console.log('✅ Referral data loaded:', transformedData);
    } catch (err: any) {
      console.error('❌ Error fetching referrals:', err);
      setError(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
  // Reset page when level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeLevel]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getReferralLink = () => {
    if (!data?.referralCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/auth/register?ref=${data.referralCode}`;
  };

  const copyToClipboard = (text: string, successCallback: (status: boolean) => void) => {
    const fallbackCopy = (t: string) => {
      const el = document.createElement('textarea');
      el.value = t;
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy'); 
      document.body.removeChild(el);
      successCallback(true);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => successCallback(true))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
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

  // ============================================
  // PAGINATION LOGIC
  // ============================================
  const activeUsers = useMemo(() => {
    if (!data) return [];
    
    switch (activeLevel) {
      case 1:
        return data.referralLevels.level1.users || [];
      case 2:
        return data.referralLevels.level2.users || [];
      case 3:
        return data.referralLevels.level3.users || [];
      default:
        return [];
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

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="text-white text-xl font-semibold">Loading Referral Data...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-red-500 text-xl font-bold">Error</h2>
          </div>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">No data available</div>
      </div>
    );
  }

  // ============================================
  // CALCULATE STATS
  // ============================================
  const totalReferrals = data.referralCount || 0;
  const totalEarnings = (data.referralEarnings || 0) + (data.levelIncome || 0);

  const stats = [
    { 
      level: 1, 
      title: "Level 1 Invites", 
      count: data.referralLevels.level1.count, 
      commission: "$5 per $50", 
      color: "text-green-400", 
      tagColor: "bg-green-500/20 text-green-400" 
    },
    { 
      level: 2, 
      title: "Level 2 Invites", 
      count: data.referralLevels.level2.count, 
      commission: "$2.5 per $50", 
      color: "text-blue-400", 
      tagColor: "bg-blue-500/20 text-blue-400" 
    },
    { 
      level: 3, 
      title: "Level 3 Invites", 
      count: data.referralLevels.level3.count, 
      commission: "$1.25 per $50", 
      color: "text-purple-400", 
      tagColor: "bg-purple-500/20 text-purple-400" 
    },
  ];
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return { border: 'border-green-500/50', tag: 'bg-green-500/20 text-green-400' };
      case 2: return { border: 'border-blue-500/50', tag: 'bg-blue-500/20 text-blue-400' };
      case 3: return { border: 'border-purple-500/50', tag: 'bg-purple-500/20 text-purple-400' };
      default: return { border: 'border-gray-500/50', tag: 'bg-gray-500/20 text-gray-400' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 p-4 bg-gray-900/40 rounded-xl shadow-lg border border-gray-700/50">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 flex items-center">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-yellow-400" />
            Invite & Earn
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Share your referral link and earn commissions from 3 levels.
          </p>
        </div>

        {/* Referral Code & Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Referral Code */}
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700">
            <p className="text-gray-400 text-xs mb-2 font-semibold flex items-center">
              <Copy className="w-3 h-3 mr-1 text-indigo-400" /> Your Referral Code
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-wider truncate">
                {data.referralCode || 'Loading...'}
              </span>
              <button
                onClick={copyCode}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-full transition-all duration-200 transform hover:scale-[1.03] shadow-md flex-shrink-0"
              >
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700">
            <p className="text-gray-400 text-xs mb-2 font-semibold flex items-center">
              <Link className="w-3 h-3 mr-1 text-indigo-400" /> Referral Link
            </p>
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                className="bg-gray-900 text-xs text-gray-300 flex-1 px-3 py-1.5 rounded-lg outline-none min-w-0 truncate"
              />
              <button
                onClick={copyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-full transition-all duration-200 transform hover:scale-[1.03] shadow-md whitespace-nowrap flex-shrink-0"
              >
                {linkCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>

        {/* Earnings and Total Referrals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="Total Earnings" 
            value={`$${totalEarnings.toFixed(2)}`} 
            icon={DollarSign} 
            color="text-yellow-400" 
          />
          <StatCard 
            title="Total Referrals" 
            value={totalReferrals.toString()} 
            icon={Users} 
            color="text-indigo-400" 
          />
          <StatCard 
            title="Level Income" 
            value={`$${(data.levelIncome || 0).toFixed(2)}`} 
            icon={TrendingUp} 
            color="text-pink-400" 
          />
        </div>

        {/* Stats Grid (Level Counts) */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.level} className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-3 text-center shadow-xl border border-gray-700">
              <h3 className="text-white text-sm font-semibold mb-1 truncate">Level {stat.level}</h3>
              <p className={`${stat.color} text-2xl sm:text-3xl font-extrabold`}>{stat.count}</p>
              <p className="text-gray-400 text-xs mt-1 font-medium">{stat.commission}</p>
            </div>
          ))}
        </div>

        {/* Downline List with Tabs and Pagination */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700">
          <h2 className="text-white text-xl font-bold mb-4">
            My Referral Network ({totalReferrals})
          </h2>

          {/* Level Tabs */}
          <div className="flex space-x-2 p-1 mb-4 bg-gray-900 rounded-lg overflow-x-auto">
            {stats.map((stat) => (
              <button
                key={stat.level}
                onClick={() => setActiveLevel(stat.level as 1 | 2 | 3)}
                className={`flex-shrink-0 py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap
                  ${activeLevel === stat.level 
                    ? `${stat.tagColor.replace('text-', 'bg-')} text-white shadow-md` 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                Level {stat.level} ({stat.count})
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="space-y-3 min-h-[300px]">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const level = activeLevel;
                const colors = getLevelColor(level);
                const userNumber = (currentPage - 1) * USERS_PER_PAGE + index + 1;
                const commission = stats.find(s => s.level === level)?.commission || '';
                
                return (
                  <DownlineUser 
                    key={user._id} 
                    email={user.email}
                    name={user.name}
                    totalDeposits={user.totalDeposits}
                    stakedBalance={user.stakedBalance}
                    level={level} 
                    commission={commission} 
                    registeredAt={formatDate(user.createdAt)}
                    color={colors.border} 
                    tagColor={colors.tag} 
                    userNumber={userNumber}
                  />
                );
              })
            ) : (
              <div className="text-center p-8 bg-gray-900 rounded-lg border border-gray-700">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-md">
                  No users in Level {activeLevel} yet. Share your link!
                </p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-gray-300 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl flex items-center justify-between border border-gray-700">
    <div>
      <p className="text-gray-400 text-xs font-medium">{title}</p>
      <p className={`${color} text-2xl font-extrabold mt-0.5`}>{value}</p>
    </div>
    <Icon className={`w-6 h-6 ${color} opacity-70`} />
  </div>
);

// ============================================
// DOWNLINE USER COMPONENT
// ============================================
interface DownlineUserProps {
  email: string;
  name?: string;
  totalDeposits: number;
  stakedBalance: number;
  level: number;
  commission: string;
  color: string;
  tagColor: string;
  registeredAt: string;
  userNumber: number;
}

const DownlineUser: React.FC<DownlineUserProps> = ({ 
  email, 
  name,
  totalDeposits,
  stakedBalance,
  level, 
  commission, 
  color, 
  tagColor, 
  registeredAt, 
  userNumber 
}) => (
  <div className={`bg-gray-900 p-3 rounded-lg border ${color} transition-shadow hover:shadow-2xl`}>
    <div className="flex items-start justify-between gap-3">
      {/* Left: User Info */}
      <div className="flex items-start space-x-3 min-w-0 flex-1">
        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${tagColor}`}>
          {userNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white font-medium truncate">{name || email}</p>
          {name && <p className="text-xs text-gray-500 truncate">{email}</p>}
          <p className="text-xs text-gray-400 mt-1">Joined: {registeredAt}</p>
          
          {/* Stats Row */}
          <div className="flex gap-3 mt-2 text-xs">
            <div>
              <span className="text-gray-500">Deposits:</span>
              <span className="text-green-400 font-semibold ml-1">${totalDeposits.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Staked:</span>
              <span className="text-orange-400 font-semibold ml-1">${stakedBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right: Commission & Level */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-300 font-medium whitespace-nowrap">{commission}</p>
        <span className={`px-2 py-0.5 ${tagColor} rounded-full text-xs font-semibold mt-1 inline-block`}>
          L{level}
        </span>
      </div>
    </div>
  </div>
);