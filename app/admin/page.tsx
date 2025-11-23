"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyHistoryItem {
  date: string;
  deposits: number;
  withdrawals: number;
}

interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  approvedDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  totalReferral: number;
  totalLevel: number;
  totalStaked: number;
  totalWalletBalance: number;
  todayDeposits: number;
  todayWithdrawals: number;
  dailyHistory: DailyHistoryItem[];
}

const mockStats: AdminStats = {
  totalUsers: 0,
  totalDeposits: 0,
  pendingDeposits: 0,
  approvedDeposits: 0,
  totalWithdrawals: 0,
  pendingWithdrawals: 0,
  approvedWithdrawals: 0,
  totalReferral: 0,
  totalLevel: 0,
  totalStaked: 0,
  totalWalletBalance: 0,
  todayDeposits: 0,
  todayWithdrawals: 0,
  dailyHistory: [],
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats>(mockStats);
  const [error, setError] = useState<string>("");
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        setHasAccess(false);
        router.push("/admin/login");
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setHasAccess(false);
        setError("Access denied. Admin only.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setHasAccess(true);
        setError("");
      } else {
        setError(data.message || "Failed to load stats");
        setStats(mockStats);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to connect to server");
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const safe = (v: number | undefined) => Number(v ?? 0);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <Link href="/dashboard">
            <button className="bg-blue-600 px-6 py-3 rounded-lg text-white hover:bg-blue-700">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your platform</p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition">
                Back to Dashboard
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto p-6">
        {/* TODAY ACTIVITY */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex gap-2 mb-4 items-center">
            <span className="text-2xl">📅</span>
            <h2 className="text-xl font-semibold">Today's Activity</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Approved Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Today's Deposits</p>
              <p className="text-3xl font-bold text-green-600">
                ${safe(stats.todayDeposits).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Today's Withdrawals</p>
              <p className="text-3xl font-bold text-red-600">
                ${safe(stats.todayWithdrawals).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* LAST 7 DAYS CHART */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Last 7 Days History</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Approved Transactions
            </span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyHistory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Legend />

              <Line
                type="monotone"
                dataKey="deposits"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="withdrawals"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/admin/users" className="block">
            <StatCard
              title="Total Users"
              value={safe(stats.totalUsers)}
              icon="👥"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              textColor="text-blue-600"
              clickable
            />
          </Link>

          <Link href="/admin/deposit/history" className="block">
            <StatCard
              title="Total Deposits"
              value={`$${safe(stats.totalDeposits).toFixed(2)}`}
              icon="💰"
              bgColor="bg-green-50"
              borderColor="border-green-200"
              textColor="text-green-600"
              subtext="Approved"
              clickable
            />
          </Link>

          <Link href="/admin/withdraw/history" className="block">
            <StatCard
              title="Total Withdrawals"
              value={`$${safe(stats.totalWithdrawals).toFixed(2)}`}
              icon="💸"
              bgColor="bg-red-50"
              borderColor="border-red-200"
              textColor="text-red-600"
              subtext="Approved"
              clickable
            />
          </Link>

          <Link href="/admin/stakes" className="block">
            <StatCard
              title="Total Staked"
              value={`$${safe(stats.totalStaked).toFixed(2)}`}
              icon="🔒"
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
              textColor="text-purple-600"
              clickable
            />
          </Link>

          <Link href="/admin/deposit" className="block">
            <StatCard
              title="Pending Deposits"
              value={safe(stats.pendingDeposits)}
              icon="⏳"
              bgColor="bg-amber-50"
              borderColor="border-amber-200"
              textColor="text-amber-600"
              highlight={safe(stats.pendingDeposits) > 0}
              clickable
            />
          </Link>

          <Link href="/admin/withdraw" className="block">
            <StatCard
              title="Pending Withdrawals"
              value={safe(stats.pendingWithdrawals)}
              icon="⏳"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              textColor="text-orange-600"
              highlight={safe(stats.pendingWithdrawals) > 0}
              clickable
            />
          </Link>

          <Link href="/admin/referral" className="block">
            <StatCard
              title="Referral Earnings"
              value={`$${safe(stats.totalReferral).toFixed(2)}`}
              icon="🎁"
              bgColor="bg-pink-50"
              borderColor="border-pink-200"
              textColor="text-pink-600"
              clickable
            />
          </Link>

          <Link href="/admin/level-income" className="block">
            <StatCard
              title="Level Income"
              value={`$${safe(stats.totalLevel).toFixed(2)}`}
              icon="📊"
              bgColor="bg-indigo-50"
              borderColor="border-indigo-200"
              textColor="text-indigo-600"
              clickable
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  highlight?: boolean;
  subtext?: string;
  clickable?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  bgColor,
  borderColor,
  textColor,
  highlight,
  subtext,
  clickable,
}: StatCardProps) {
  return (
    <div
      className={`p-4 rounded-xl ${bgColor} border ${borderColor} ${
        highlight ? "ring-2 ring-red-400" : ""
      } transition-all ${
        clickable ? "hover:shadow-lg hover:scale-105 cursor-pointer" : "hover:shadow"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {highlight && <span className="text-red-500 animate-pulse text-xl">●</span>}
      </div>

      <p className="text-gray-600 text-xs mb-1">{title}</p>
      {subtext && <p className="text-gray-400 text-[10px]">{subtext}</p>}

      <div className="flex justify-between items-center">
        <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
        {clickable && <span className="text-gray-400 text-sm">→</span>}
      </div>
    </div>
  );
}