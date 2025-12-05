"use client";

import { useEffect, useState, useMemo, FC } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

// Set a limit for referrals per page
const PAGINATION_LIMIT = 10; 

// --------------------------------------------------------------------------------------------------
// INTERFACES AND TYPES
// --------------------------------------------------------------------------------------------------

interface ReferralUser {
  email: string;
  totalDeposits: number;
  stakedBalance: number;
  createdAt: string;
}

interface StakeData {
  amount: number;
  status: 'locked' | 'unlocked';
  unlockDate: string;
  totalProfit: number;
  autoLockCheckDate: string;
}

interface DashboardData {
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  referralCount: number;
  referralEarnings: number;
  levelIncome: number;
  stake: StakeData | null;
  referralCode: string;
  level1: ReferralUser[];
  level2: ReferralUser[];
  level3: ReferralUser[];
}

interface ReferralTableProps {
  level1: ReferralUser[];
  level2: ReferralUser[];
  level3: ReferralUser[];
  activeLevel: number;
  setActiveLevel: (level: number) => void;
  activeReferrals: ReferralUser[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

// --------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------------------------------------------------

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [name, domain] = email.split("@");
  if (name.length <= 1) return "***@" + domain;
  return name[0] + "****" + name.slice(-1) + "@" + domain;
}

// --------------------------------------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------------------------------------

const DashboardPage: FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [data, setData] = useState<DashboardData>({
    walletBalance: 0,
    stakedBalance: 0,
    totalDeposits: 0,
    referralCount: 0,
    referralEarnings: 0,
    levelIncome: 0,
    stake: null,
    referralCode: "",
    level1: [],
    level2: [],
    level3: [],
  });

  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const activeReferrals: ReferralUser[] = useMemo(() => {
    return activeLevel === 1
      ? data.level1
      : activeLevel === 2
      ? data.level2
      : data.level3;
  }, [activeLevel, data.level1, data.level2, data.level3]);

  useEffect(() => {
    if (status === "loading") return;

    const checkAuth = async () => {
      console.log("🔍 Checking authentication...");
      console.log("📊 NextAuth status:", status);
      
      const userId = localStorage.getItem("userId");
      console.log("💾 UserId from localStorage:", userId);

      if (status === "authenticated") {
        console.log("✅ Authenticated via OAuth");
        return;
      }

      if (userId) {
        console.log("✅ Authenticated via manual login");
        return;
      }

      console.log("🚫 Not authenticated - redirecting");
      router.push("/auth/login");
    };

    checkAuth();
  }, [status, router]);

  async function loadData() {
    try {
      console.log("📡 Loading dashboard data...");
      console.log("🔑 UserId:", localStorage.getItem("userId"));
      
      setLoading(true);

      const res = await fetch("/api/user/dashboard", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      console.log("📡 Response status:", res.status);

      if (res.status === 401) {
        console.log("🚫 Unauthorized - redirecting");
        localStorage.removeItem("userId");
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log("✅ Dashboard data loaded:", result.success);

      if (result.success) {
        setData({
          walletBalance: result.walletBalance || 0,
          stakedBalance: result.stakedBalance || 0,
          totalDeposits: result.totalDeposits || 0,
          referralCount: result.referralCount || 0,
          referralEarnings: result.referralEarnings || 0,
          levelIncome: result.levelIncome || 0,
          stake: result.stake || null,
          referralCode: result.referralCode || "",
          level1: result.referralLevels?.level1?.users || [],
          level2: result.referralLevels?.level2?.users || [],
          level3: result.referralLevels?.level3?.users || [],
        });
        console.log("✅ Dashboard loaded successfully!");
      }

      setLoading(false);
    } catch (err: any) {
      console.error("❌ Dashboard error:", err);
      setError(err.message || "Failed to load data");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" || localStorage.getItem("userId")) {
      void loadData();
    }
  }, [status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeLevel]);

  const logout = async () => {
    try {
      console.log("🚪 Logging out...");

      if (session) {
        await signOut({ redirect: false });
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("userId");
        window.location.href = "/auth/login";
      }
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#06080e] dark:via-[#0f121b] dark:to-[#161b26]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#020617] via-[#3b0764] to-[#020617] relative overflow-hidden p-4 sm:p-6 text-white text-[13px] sm:text-base leading-tight sm:leading-normal">

      <BackgroundOrbs />

      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-10 relative z-20">

        <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          StakeVault
        </h1>

        <div className="flex gap-3 items-center">

          <Link href="/dashboard/profile">
            <button
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center text-white text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              title="Profile Settings"
            >
              ⚙️
            </button>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="w-12 h-12 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-lg border border-white/10 hover:scale-110 transition flex items-center justify-center text-2xl"
              title="More Options"
            >
              ⋮
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">

                <Link href="/dashboard/security">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition">
                    <span className="text-xl">🔐</span>
                    <span className="font-medium">Security Dashboard</span>
                  </button>
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <Link href="/dashboard/deposit">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition">
                    <span className="text-xl">💰</span>
                    <span className="font-medium">Deposit</span>
                  </button>
                </Link>

                <Link href="/dashboard/withdraw">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition">
                    <span className="text-xl">💸</span>
                    <span className="font-medium">Withdraw</span>
                  </button>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                <Link href="/dashboard/deposit-history">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition">
                    <span className="text-xl">📜</span>
                    <span className="font-medium">Deposit History</span>
                  </button>
                </Link>

                <Link href="/dashboard/withdraw-history">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition">
                    <span className="text-xl">📋</span>
                    <span className="font-medium">Withdrawal History</span>
                  </button>
                </Link>

              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="px-3 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Logout
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        <WalletCard amount={data.walletBalance.toFixed(2)} />
        <StakeWalletCard amount={data.stakedBalance.toFixed(2)} />
      </div>

      <Stats data={data} />

      {data.stake && <StakeBox stake={data.stake} />}

      {/* MAIN BUTTONS */}
      <div className="max-w-5xl mx-auto mt-12 text-center grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Link href="/dashboard/profit-calculator">
          <button className="p-3 sm:p-4 text-sm sm:text-base rounded-xl bg-green-500 hover:bg-green-600 text-white transition w-full font-semibold shadow-lg">
            Daily Profit Calculator ➜
          </button>
        </Link>

        <Link href="/dashboard/profit-summary">
          <button className="p-4 rounded-xl bg-white/20 text-white border border-white/20 hover:bg-white/30 transition w-full">
            Profit Summary ➜
          </button>
        </Link>

        <Link href="/dashboard/stake-plan">
          <button className="p-4 rounded-xl bg-white/20 text-white border border-white/20 hover:bg-white/30 transition w-full">
            Stake Plan ➜
          </button>
        </Link>

        <Link href="/dashboard/auto-investment">
          <button className="p-4 rounded-xl bg-white/20 text-white border border-white/20 hover:bg-white/30 transition w-full">
            Auto Investment ➜
          </button>
        </Link>

        <Link href="/dashboard/stake-history">
          <button className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white border border-white/20 hover:from-orange-600 hover:to-red-600 transition w-full font-bold shadow-lg">
            📜 Stake History ➜
          </button>
        </Link>

        <Link href="/dashboard/statement">
          <button className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white border border-white/20 hover:from-blue-600 hover:to-purple-600 transition w-full font-bold shadow-lg">
            📊 Investment Statement ➜
          </button>
        </Link>

        {/* ✅ REFERRAL PROGRAM BUTTON - PROPERLY PLACED IN GRID */}
        <Link href="/dashboard/referral">
  <button className="p-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-white/20 hover:from-pink-600 hover:to-rose-600 transition w-full font-bold shadow-lg">
    🎁 Invite & Earn ➜
  </button>
</Link>

      </div>
 <StakingPlansSection />
 

    </div>
  );
}

export default DashboardPage;

// --------------------------------------------------------------------------------------------------
// REFERRAL TABLE COMPONENT
// --------------------------------------------------------------------------------------------------

const ReferralTable: FC<ReferralTableProps> = ({
  level1,
  level2,
  level3,
  activeLevel,
  setActiveLevel,
  activeReferrals,
  currentPage,
  setCurrentPage,
}) => {
  
  const totalPages = Math.ceil(activeReferrals.length / PAGINATION_LIMIT);

  const paginatedReferrals: ReferralUser[] = useMemo(() => {
    const start = (currentPage - 1) * PAGINATION_LIMIT;
    const end = start + PAGINATION_LIMIT;
    return activeReferrals.slice(start, end);
  }, [activeReferrals, currentPage]);

  const tabs = [
    { level: 1, name: "Level 1", count: level1.length, color: "text-green-400", hoverBg: "hover:bg-green-500/10" },
    { level: 2, name: "Level 2", count: level2.length, color: "text-blue-400", hoverBg: "hover:bg-blue-500/10" },
    { level: 3, name: "Level 3", count: level3.length, color: "text-purple-400", hoverBg: "hover:bg-purple-500/10" },
  ];

  const handleLevelChange = (level: number) => {
    setActiveLevel(level);
    setCurrentPage(1);
  }
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  return (
    <div className="bg-[#0f121b] p-4 sm:p-6 rounded-xl border border-gray-700/50 shadow-2xl mt-8">
      <h3 className="text-lg sm:text-2xl font-bold mb-5 text-white">
        Referral Details
      </h3>

      {/* Tabs for Levels */}
      <div className="flex mb-6 border-b border-gray-700/50 overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.level}
            onClick={() => handleLevelChange(tab.level)}
            className={`py-3 px-4 text-sm sm:text-base font-semibold transition-all duration-300 flex-shrink-0 ${tab.hoverBg} ${
              activeLevel === tab.level
                ? `border-b-4 ${tab.color} border-current text-white`
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.name} <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/10 font-bold">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeReferrals.length === 0 ? (
        <div className="text-center py-10 bg-[#141820] rounded-lg border border-gray-800 text-gray-400">
          <p className="text-xl mb-2">🤷‍♂️ No Referrals Yet in Level {activeLevel}</p>
          <p className="text-sm">Share your link to start building your network and earning commissions.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow-lg border border-gray-700">
            <table className="min-w-full table-auto bg-[#1c2230] text-white font-sans">
              <thead className="bg-[#2a3040] border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Deposits
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Staked
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Join Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedReferrals.map((user, index) => (
                  <tr key={index} className="odd:bg-[#1c2230] even:bg-[#1c2230]/70 hover:bg-[#2a3040] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-300">
                      {maskEmail(user.email)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-400">
                      ${user.totalDeposits.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-400">
                      ${user?.stakedBalance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedReferrals.map((user, index) => (
              <div
                key={index}
                className="p-4 bg-[#1c2230] rounded-xl shadow-lg border border-gray-700/50 hover:border-blue-500/50 transition-all"
              >
                <div className="flex justify-between items-center mb-2 border-b border-gray-700/50 pb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    User Email
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-200 break-all">
                    {maskEmail(user.email)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Deposited
                  </span>
                  <span className="text-base font-bold text-green-400">
                    ${user.totalDeposits.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Staked
                  </span>
                  <span className="text-base font-bold text-orange-400">
                    ${user?.stakedBalance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Joined
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 transition-colors text-sm font-semibold"
              >
                Previous
              </button>

              <span className="text-gray-300 font-medium text-xs sm:text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 transition-colors text-sm font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------------------------------
// UTILITY COMPONENTS
// --------------------------------------------------------------------------------------------------

const StakeBox: FC<{ stake: StakeData }> = ({ stake }) => {
  return (
    <div className="mt-10 max-w-4xl mx-auto p-6 rounded-3xl bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-4">Stake Plan</h2>
      <p className="text-white/80 text-lg">
        <span className="font-semibold text-white">Stake Amount:</span> ${stake.amount.toFixed(2)}
      </p>
      <p className="text-white/80 text-lg mt-2">
        <span className="font-semibold text-white">Status:</span>{' '}
        {stake.status === "locked" ? (
          <span className="text-yellow-300">Locked</span>
        ) : (
          <span className="text-green-300">Unlocked</span>
        )}
      </p>
      <p className="text-white/80 text-lg mt-2">
        <span className="font-semibold text-white">Unlock Date:</span> {new Date(stake.unlockDate).toDateString()}
      </p>
      <p className="text-white/80 text-lg mt-2">
        <span className="font-semibold text-white">Total Profit:</span> ${stake.totalProfit.toFixed(2)}
      </p>
      <p className="text-white/80 text-lg mt-2">
        <span className="font-semibold text-white">Next Auto Lock:</span> {new Date(stake.autoLockCheckDate).toDateString()}
      </p>
      {stake.status === "unlocked" && (
        <Link href="/dashboard/stake-withdraw">
          <button className="mt-5 p-3 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl text-lg">
            Withdraw Stake Balance
          </button>
        </Link>
      )}
    </div>
  );
}

const BackgroundOrbs: FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500 opacity-20 rounded-full blur-3xl -top-40 -left-32 animate-float"></div>
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-300 dark:from-purple-600 dark:to-pink-500 opacity-20 rounded-full blur-3xl top-1/3 -right-32 animate-float-slow"></div>
      <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-400 to-blue-300 dark:from-indigo-600 dark:to-blue-500 opacity-15 rounded-full blur-3xl -bottom-40 left-1/3 animate-float-reverse"></div>
    </div>
  );
}

const WalletCard: FC<{ amount: string }> = ({ amount }) => {
  return (
    <div className="relative p-8 rounded-3xl bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-30 rounded-3xl"></div>
      <div className="relative z-10">
        <p className="text-white/80 font-medium text-lg">Wallet Balance</p>
        <p className="text-4xl md:text-5xl font-extrabold text-white mt-2">${amount}</p>
        <Link href="/dashboard/deposit">
          <button className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-all">
            + Add Funds
          </button>
        </Link>
      </div>
    </div>
  );
}

const StakeWalletCard: FC<{ amount: string }> = ({ amount }) => {
  return (
    <div className="relative p-8 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/10 dark:to-red-500/10 backdrop-blur-xl border border-orange-500/30 shadow-2xl animate-fade-in">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 blur-xl opacity-20 rounded-3xl"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🔒</span>
          <p className="text-white/80 font-medium text-lg">Staked Balance</p>
        </div>
        <p className="text-4xl md:text-5xl font-extrabold text-white mt-2">${amount}</p>
        <div className="flex gap-2 mt-4">
          <Link href="/dashboard/stake">
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all">
              View Stakes
            </button>
          </Link>
          <Link href="/dashboard/stake-history">
            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm transition-all">
              History
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const Stats: FC<{ data: DashboardData }> = ({ data }) => {
  const stats = [
    { name: "Total Deposits", value: `$${data.totalDeposits.toFixed(2)}` },
    { name: "Referrals", value: data.referralCount.toString() },
    { name: "Referral Earnings", value: `$${data.referralEarnings.toFixed(2)}` },
    { name: "Level Income", value: `$${data.levelIncome.toFixed(2)}` },
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-8">
      {stats.map((s, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 text-white shadow-xl hover:scale-[1.02] transition">
          <p className="text-white/70">{s.name}</p>
          <p className="text-xl sm:text-3xl font-bold break-words">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

const Animations: FC = () => {
  return (
    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(30px, -30px); }
      }
      @keyframes float-slow {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-20px, 20px); }
      }
      @keyframes float-reverse {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(20px, -20px); }
      }
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .animate-float { animation: float 20s ease-in-out infinite; }
      .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
      .animate-float-reverse { animation: float-reverse 22s ease-in-out infinite; }
      .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
    `}</style>
  );
}
// --------------------------------------------------------------------------------------------------
// STAKING PLANS SECTION COMPONENT - SIMPLE INTEREST (NO COMPOUNDING)
// --------------------------------------------------------------------------------------------------

const StakingPlansSection = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 1,
      name: "Starter",
      icon: "🌱",
      minInvestment: 21,
      maxInvestment: 100,
      dailyReturn: 1.0,
      duration: 30,
      totalReturn: 30, // Simple: 1% × 30 days = 30%
      color: "from-green-500 to-emerald-600",
      borderColor: "border-green-500/30",
      popular: false
    },
    {
      id: 2,
      name: "Growth",
      icon: "📈",
      minInvestment: 101,
      maxInvestment: 500,
      dailyReturn: 1.0,
      duration: 60,
      totalReturn: 60, // Simple: 1% × 60 days = 60%
      color: "from-blue-500 to-cyan-600",
      borderColor: "border-blue-500/30",
      popular: true
    },
    {
      id: 3,
      name: "Premium",
      icon: "💎",
      minInvestment: 501,
      maxInvestment: 2000,
      dailyReturn: 1.0,
      duration: 90,
      totalReturn: 90, // Simple: 1% × 90 days = 90%
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-500/30",
      popular: false
    },
    {
      id: 4,
      name: "Elite",
      icon: "👑",
      minInvestment: 2001,
      maxInvestment: 10000,
      dailyReturn: 1.0,
      duration: 120,
      totalReturn: 120, // Simple: 1% × 120 days = 120%
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
      popular: false
    }
  ];

  const features = [
    { icon: "🔒", text: "Secure & Encrypted" },
    { icon: "⚡", text: "Instant Activation" },
    { icon: "💰", text: "Daily Payouts" },
    { icon: "📊", text: "Transparent Returns" }
  ];

  return (
    <div className="max-w-7xl mx-auto mt-16 mb-12 px-4">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Choose Your Staking Plan
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Select the perfect plan that matches your investment goals and start earning daily returns
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id === selectedPlan ? null : plan.id)}
            className={`relative group cursor-pointer transition-all duration-300 ${
              selectedPlan === plan.id ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                <div className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-xs font-bold text-black shadow-lg">
                  ⭐ MOST POPULAR
                </div>
              </div>
            )}

            {/* Card */}
            <div className={`relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border-2 ${plan.borderColor} shadow-xl overflow-hidden transition-all duration-300 ${
              selectedPlan === plan.id ? 'border-white/50 shadow-2xl' : ''
            }`}>
              
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-10`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon & Name */}
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{plan.icon}</div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>

                {/* Investment Range */}
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <div className="text-xs text-white/60 text-center mb-1">Investment Range</div>
                  <div className="text-center">
                    <span className="text-xl font-bold text-white">
                      ${plan.minInvestment} - ${plan.maxInvestment.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Daily Return */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {plan.dailyReturn}%
                  </div>
                  <div className="text-sm text-white/60">Daily Return (Simple Interest)</div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Duration</span>
                    <span className="text-white font-semibold">{plan.duration} Days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Total Return</span>
                    <span className="text-green-400 font-bold">{plan.totalReturn}%</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.color} text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95`}>
                  Start Earning Now
                </button>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 text-center hover:bg-white/10 hover:scale-105 transition-all duration-300"
          >
            <div className="text-3xl mb-2">{feature.icon}</div>
            <div className="text-sm text-white/80 font-medium">{feature.text}</div>
          </div>
        ))}
      </div>

      {/* Trust Section */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-white/10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Why Choose StakeVault?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-white/80">
                <span className="text-green-400 text-xl">✓</span>
                <span>Advanced security with encryption</span>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <span className="text-green-400 text-xl">✓</span>
                <span>Automated daily profit distribution</span>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <span className="text-green-400 text-xl">✓</span>
                <span>24/7 customer support available</span>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <span className="text-green-400 text-xl">✓</span>
                <span>Transparent and simple returns</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center md:text-right">
            <div className="inline-block p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/20">
              <div className="text-5xl mb-3">🏆</div>
              <div className="text-3xl font-bold text-white mb-2">
                Simple & Transparent
              </div>
              <div className="text-white/70">
                No Hidden Fees
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-2xl text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Ready to Start Your Journey? 🚀
        </h3>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Start earning daily returns with simple and transparent staking plans
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            View All Plans
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all">
            Calculate Earnings
          </button>
        </div>
      </div>
    </div>
  );
};