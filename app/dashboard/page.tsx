"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dashboard data
  const [data, setData] = useState({
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
<Link href="/dashboard/security">
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
    🔐 Security Dashboard
  </button>
</Link>
  // UI states
  const [dark, setDark] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDarkMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setDark(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDark = () => setDark(!dark);

  // Check authentication
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.log("🚫 Not authenticated - redirecting to login");
        router.push("/auth/login");
      }
    }
  }, [status, router]);

  // Load dashboard data
  async function loadData() {
    try {
      console.log("📡 Fetching dashboard data...");
      setLoading(true);
      
      const res = await fetch("/api/user/dashboard", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", res.status);

      if (res.status === 401) {
        console.log("🚫 Unauthorized - redirecting to login");
        localStorage.removeItem("userId");
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log("✅ Dashboard data loaded:", result);

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
    level1: result.level1 || [],
    level2: result.level2 || [],
    level3: result.level3 || [],
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.message || "Failed to load data");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" || localStorage.getItem("userId")) {
      loadData();
    }
  }, [status]);

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
      
      localStorage.removeItem("userId");
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("userId");
      window.location.href = "/auth/login";
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
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#06080e] dark:via-[#0f121b] dark:to-[#161b26] relative overflow-hidden p-6 transition-all">

        <BackgroundOrbs />

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10 relative z-20">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Dashboard
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

            <button
              onClick={toggleDark}
              className="w-12 h-12 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-lg border border-white/10 hover:scale-110 transition flex items-center justify-center text-2xl"
              title="Toggle Theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>

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
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Logout
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          <WalletCard amount={data.walletBalance} />
          <StakeWalletCard amount={data.stakedBalance} />
        </div>

        <Stats data={data} />

        {data.stake && <StakeBox stake={data.stake} />}

        {/* MAIN BUTTONS */}
        <div className="max-w-5xl mx-auto mt-12 text-center grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Link href="/dashboard/profit-calculator">
            <button className="p-4 rounded-xl bg-green-500 text-white border border-white/20 hover:bg-green-600 transition w-full">
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

          {/* ✅ NEW: INVESTMENT STATEMENT */}
          <Link href="/dashboard/statement">
            <button className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white border border-white/20 hover:from-blue-600 hover:to-purple-600 transition w-full font-bold shadow-lg">
              📊 Investment Statement ➜
            </button>
          </Link>

        </div> 
        {/* ------------------ REFERRAL SECTION ------------------ */}

<div className="mt-10 bg-[#141820] p-6 rounded-2xl">

  <h2 className="text-3xl font-bold mb-4">Invite & Earn</h2>

  <p className="text-gray-400 mb-4">
    Share your referral link and earn commissions from 3 levels.
  </p>

  {/* Referral Link */}
  <div className="flex items-center bg-gray-900 p-3 rounded-xl mb-6">
    <input
      value={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${data.referralCode}`}
      readOnly
      className="w-full bg-transparent outline-none text-white"
    />
    <button
      className="ml-2 bg-blue-600 px-4 py-1 rounded-lg"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/auth/register?ref=${data.referralCode}`
        );
        alert("Referral Link Copied!");
      }}
    >
      Copy
    </button>
  </div>

  {/* Level Stats */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

    <div className="p-5 bg-[#1c2230] rounded-xl text-center">
      <h3 className="text-xl font-semibold mb-2">Level 1 Invites</h3>
      <p className="text-3xl font-bold text-green-400">
        {data.level1?.length || 0}
      </p>
    </div>

    <div className="p-5 bg-[#1c2230] rounded-xl text-center">
      <h3 className="text-xl font-semibold mb-2">Level 2 Invites</h3>
      <p className="text-3xl font-bold text-blue-400">
        {data.level2?.length || 0}
      </p>
    </div>

    <div className="p-5 bg-[#1c2230] rounded-xl text-center">
      <h3 className="text-xl font-semibold mb-2">Level 3 Invites</h3>
      <p className="text-3xl font-bold text-purple-400">
        {data.level3?.length || 0}
      </p>
    </div>

  </div>

  {/* Earnings Summary */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

    <div className="p-5 bg-[#1c2230] rounded-xl text-center">
      <h3 className="text-xl font-semibold mb-2">Referral Earnings</h3>
      <p className="text-3xl font-bold text-yellow-400">
        ${data.referralEarnings || 0}
      </p>
    </div>

    <div className="p-5 bg-[#1c2230] rounded-xl text-center">
      <h3 className="text-xl font-semibold mb-2">Level Income</h3>
      <p className="text-3xl font-bold text-orange-400">
        ${data.levelIncome || 0}
      </p>
    </div>

  </div>

  {/* Referral Benefits */}
  <div className="bg-gradient-to-br from-[#1a2234] to-[#111827] p-6 rounded-2xl mt-8 shadow-xl">
    <h2 className="text-2xl font-bold mb-4">Referral Benefits</h2>

    <ul className="space-y-3 text-gray-300 text-lg">
      <li>✔ Earn commissions on 3 levels</li>
      <li>✔ Level 1: 10% commission</li>
      <li>✔ Level 2: 5% commission</li>
      <li>✔ Level 3: 2% commission</li>
      <li>✔ Unlimited invites</li>
      <li>✔ Earnings added automatically to your wallet</li>
    </ul>
  </div>

</div>

        

        <Animations />

      </div>
    </div>
  );
}

function StakeBox({ stake }: any) {
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

function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500 opacity-20 rounded-full blur-3xl -top-40 -left-32 animate-float"></div>
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-300 dark:from-purple-600 dark:to-pink-500 opacity-20 rounded-full blur-3xl top-1/3 -right-32 animate-float-slow"></div>
      <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-400 to-blue-300 dark:from-indigo-600 dark:to-blue-500 opacity-15 rounded-full blur-3xl -bottom-40 left-1/3 animate-float-reverse"></div>
    </div>
  );
}

function WalletCard({ amount }: any) {
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

function StakeWalletCard({ amount }: any) {
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

function Stats({ data }: any) {
  const stats = [
    { name: "Total Deposits", value: `$${data.totalDeposits}` },
    { name: "Referrals", value: data.referralCount },
    { name: "Referral Earnings", value: `$${data.referralEarnings}` },
    { name: "Level Income", value: `$${data.levelIncome}` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-8">
      {stats.map((s, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 text-white shadow-xl hover:scale-[1.02] transition">
          <p className="text-white/70">{s.name}</p>
          <p className="text-3xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function Animations() {
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