"use client";

import React, { useEffect, useState, useMemo } from "react";
// Lucide icons ka istemaal kar rahe hain
import { Link, Copy, Users, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

// Interfaces for data types
interface UserReferral {
  _id: string;
  email: string;
  registeredAt: string; // List mein dikhane ke liye
}

interface User {
  _id: string;
  email: string;
  referralCode: string;
  level1?: UserReferral[];
  level2?: UserReferral[];
  level3?: UserReferral[];
  referralEarnings?: number;
  levelIncome?: number;
}

// Testing ke liye zyada mock users banana
const createMockUsers = (count: number, prefix: string): UserReferral[] => {
    return Array.from({ length: count }, (_, i) => ({
        _id: `${prefix}_${i + 1}`,
        email: `${prefix.toLowerCase()}_user_${i + 1}@mockapp.com`,
        registeredAt: new Date(Date.now() - (i * 86400000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    }));
};

// Mock data to simulate API response in a standalone environment
const mockUser: User = {
  _id: "u12345",
  email: "user@example.com",
  referralCode: "EARNPROFIT25",
  level1: createMockUsers(25, 'Level1'), // 25 users
  level2: createMockUsers(18, 'Level2'), // 18 users
  level3: createMockUsers(5, 'Level3'), // 5 users
  referralEarnings: 450.75,
  levelIncome: 120.30,
};

const USERS_PER_PAGE = 10;

export default function App() { // Component ka naam App rakha gaya hai
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // State for Downline Tabs and Pagination
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Referral link banana
  const getReferralLink = () => {
    if (!user?.referralCode) return "https://yourdomain.com/auth/register?ref=CODE";
    const baseUrl = "https://yourdomain.com"; 
    return `${baseUrl}/auth/register?ref=${user.referralCode}`;
  };

  useEffect(() => {
    // Mock data load karna
    const fetchUserData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      try {
        setUser(mockUser);
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);
  
  // Level change hone par page reset karna
  useEffect(() => {
      setCurrentPage(1);
  }, [activeLevel]);


  // Clipboard function
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
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            successCallback(true);
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
    setTimeout(() => successCallback(false), 2000);
  };

  const copyCode = () => {
    if (!user?.referralCode) return;
    copyToClipboard(user.referralCode, setCopied);
  };

  const copyLink = () => {
    const link = getReferralLink();
    if (!link) return;
    copyToClipboard(link, setLinkCopied);
  };
  
  // --- Pagination aur Filter Logic ---

  // Active level ke users nikalna
  const activeUsers = useMemo(() => {
    if (!user) return [];
    switch (activeLevel) {
      case 1:
        return user.level1 || [];
      case 2:
        return user.level2 || [];
      case 3:
        return user.level3 || [];
      default:
        return [];
    }
  }, [user, activeLevel]);

  // Total pages nikalna
  const totalPages = Math.ceil(activeUsers.length / USERS_PER_PAGE);

  // Current page ke users nikalna
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Data Load Ho Raha Hai...</div>
          <div className="text-gray-400 text-sm mt-2">Network check kar raha hai.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Dobara Koshish Karein
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Koi user data available nahi hai.</div>
      </div>
    );
  }

  const totalReferrals = (user.level1?.length || 0) + (user.level2?.length || 0) + (user.level3?.length || 0);

  // Stats Data for dynamic rendering
  const stats = [
    { level: 1, title: "Level 1 Invites", count: user.level1?.length || 0, commission: "10%", color: "text-green-400", tagColor: "bg-green-500/20 text-green-400" },
    { level: 2, title: "Level 2 Invites", count: user.level2?.length || 0, commission: "5%", color: "text-blue-400", tagColor: "bg-blue-500/20 text-blue-400" },
    { level: 3, title: "Level 3 Invites", count: user.level3?.length || 0, commission: "2%", color: "text-purple-400", tagColor: "bg-purple-500/20 text-purple-400" },
  ];
  
  const getLevelColor = (level: number) => {
      switch (level) {
          case 1: return { border: 'border-green-500/50', tag: 'bg-green-500/20 text-green-400' };
          case 2: return { border: 'border-blue-500/50', tag: 'bg-blue-500/20 text-blue-400' };
          case 3: return { border: 'border-purple-500/50', tag: 'bg-purple-500/20 text-purple-400' };
          default: return { border: 'border-gray-500/50', tag: 'bg-gray-500/20 text-gray-400' };
      }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-4 bg-gray-900/40 rounded-xl shadow-lg border border-gray-700/50">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 flex items-center">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-yellow-400" />
            Invite & Earn Program
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Apna code ya link share kar ke team banaein aur commission kamaein.
          </p>
        </div>

        {/* Referral Code & Link Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Referral Code */}
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700">
                <p className="text-gray-400 text-xs mb-2 font-semibold flex items-center">
                    <Copy className="w-3 h-3 mr-1 text-indigo-400" /> Aapka Referral Code
                </p>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-wider truncate">{user.referralCode}</span>
                    <button
                      onClick={copyCode}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-full transition-all duration-200 transform hover:scale-[1.03] shadow-md flex-shrink-0"
                    >
                      {copied ? "Copy Ho Gaya!" : "Copy Code"}
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
                      {linkCopied ? "Copy Ho Gaya!" : "Copy Link"}
                    </button>
                </div>
            </div>
        </div>


        {/* Earnings and Total Referrals (Mobile: 2 columns, Tablet/Desktop: 3 columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <StatCard 
                title="Kul Earning" 
                value={`$${(user.referralEarnings + user.levelIncome)?.toFixed(2) || "0.00"}`} 
                icon={DollarSign} 
                color="text-yellow-400" 
            />
            <StatCard 
                title="Kul Referral" 
                value={totalReferrals.toString()} 
                icon={Users} 
                color="text-indigo-400" 
            />
            <StatCard 
                title="Level Income" 
                value={`$${user.levelIncome?.toFixed(2) || "0.00"}`} 
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
              <p className="text-gray-400 text-xs mt-1 font-medium">{stat.commission} Commission</p>
            </div>
          ))}
        </div>

        {/* Downline List with Tabs and Pagination */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700">
            <h2 className="text-white text-xl font-bold mb-4">
              Downline Users ({totalReferrals})
            </h2>

            {/* Level Tabs (Scrollable on Mobile) */}
            <div className="flex space-x-2 p-1 mb-4 bg-gray-900 rounded-lg overflow-x-auto">
                {stats.map((stat) => (
                    <button
                        key={stat.level}
                        onClick={() => setActiveLevel(stat.level as 1 | 2 | 3)}
                        // Active tab ko high-contrast color diya gaya hai
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
                    paginatedUsers.map((u, index) => {
                        const level = activeLevel;
                        const colors = getLevelColor(level);
                        const userNumber = (currentPage - 1) * USERS_PER_PAGE + index + 1;
                        const commission = stats.find(s => s.level === level)?.commission || '';
                        
                        return (
                            <DownlineUser 
                                key={u._id} 
                                email={u.email} 
                                level={level} 
                                commission={commission} 
                                registeredAt={u.registeredAt}
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
                            Level {activeLevel} mein koi user nahi mila. Apna link share karein!
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
                        // Pagination buttons bhi high-contrast hain
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

// Reusable Stat Card Component
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
            {/* Value font size mobile par chota rakha gaya hai */}
            <p className={`${color} text-2xl font-extrabold mt-0.5`}>{value}</p>
        </div>
        <Icon className={`w-6 h-6 ${color} opacity-70`} />
    </div>
);

// Reusable Downline User Component
interface DownlineUserProps {
    email: string;
    level: number;
    commission: string;
    color: string;
    tagColor: string;
    registeredAt: string;
    userNumber: number;
}
const DownlineUser: React.FC<DownlineUserProps> = ({ email, level, commission, color, tagColor, registeredAt, userNumber }) => (
    // User list item ka background aur border dark hai
    <div className={`bg-gray-900 p-3 rounded-lg border ${color} flex items-center justify-between transition-shadow hover:shadow-2xl`}>
        <div className="flex items-center space-x-3 min-w-0">
            {/* User Number Badge */}
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${tagColor}`}>
                {userNumber}
            </span>
            {/* Email aur Date */}
            <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{email}</p>
                <p className="text-xs text-gray-400">Joined: {registeredAt}</p>
            </div>
        </div>
        {/* Commission aur Level Tag */}
        <div className="text-right flex-shrink-0 ml-2">
             <p className="text-xs text-gray-300 font-medium whitespace-nowrap">{commission} Commission</p>
             <span className={`px-2 py-0.5 ${tagColor} rounded-full text-xs font-semibold mt-1 inline-block`}>
                L{level}
             </span>
        </div>
    </div>
);