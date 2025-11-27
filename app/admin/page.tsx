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
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingDown,
  Lock,
  Gift,
  BarChart3,
  Search,
  LogOut,
  Menu,
  X,
  Calendar,
  Clock,
} from "lucide-react";

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
  dailyHistory: Array<{ date: string; deposits: number; withdrawals: number }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>(mockStats);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
        }
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/search-users?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin", active: true },
    { icon: Users, label: "All Users", href: "/admin/users" },
    { icon: DollarSign, label: "Deposits", href: "/admin/deposit", badge: stats.pendingDeposits },
    { icon: TrendingDown, label: "Withdrawals", href: "/admin/withdraw", badge: stats.pendingWithdrawals },
    { icon: Lock, label: "Stakes", href: "/admin/stakes" },
    { icon: Gift, label: "Referrals", href: "/admin/referral" },
    { icon: BarChart3, label: "Level Income", href: "/admin/level-income" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-blue-400">Admin Panel</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition cursor-pointer ${
                  item.active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:ml-64">
        
        {/* TOP BAR */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-t border-gray-700 p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-400 mb-3">Found {searchResults.length} user(s)</p>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <Link key={user._id} href={`/admin/users/${user._id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-400 font-semibold">${user.walletBalance?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Wallet</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-6">
          
          {/* Today's Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Today's Deposits</h3>
              </div>
              <p className="text-3xl font-bold">${stats.todayDeposits?.toFixed(2) || '0.00'}</p>
              <p className="text-green-100 text-sm mt-1">Approved only</p>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Today's Withdrawals</h3>
              </div>
              <p className="text-3xl font-bold">${stats.todayWithdrawals?.toFixed(2) || '0.00'}</p>
              <p className="text-red-100 text-sm mt-1">Approved only</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={Users}
              color="blue"
              href="/admin/users"
            />
            <StatCard
              title="Total Deposits"
              value={`$${stats.totalDeposits?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              color="green"
              href="/admin/deposit/history"
            />
            <StatCard
              title="Total Withdrawals"
              value={`$${stats.totalWithdrawals?.toFixed(2) || '0.00'}`}
              icon={TrendingDown}
              color="red"
              href="/admin/withdraw/history"
            />
            <StatCard
              title="Total Staked"
              value={`$${stats.totalStaked?.toFixed(2) || '0.00'}`}
              icon={Lock}
              color="purple"
              href="/admin/stakes"
            />
            <StatCard
              title="Pending Deposits"
              value={stats.pendingDeposits || 0}
              icon={Clock}
              color="yellow"
              href="/admin/deposit"
              badge={stats.pendingDeposits > 0}
            />
            <StatCard
              title="Pending Withdrawals"
              value={stats.pendingWithdrawals || 0}
              icon={Clock}
              color="orange"
              href="/admin/withdraw"
              badge={stats.pendingWithdrawals > 0}
            />
            <StatCard
              title="Referral Earnings"
              value={`$${stats.totalReferral?.toFixed(2) || '0.00'}`}
              icon={Gift}
              color="pink"
              href="/admin/referral"
            />
            <StatCard
              title="Level Income"
              value={`$${stats.totalLevel?.toFixed(2) || '0.00'}`}
              icon={BarChart3}
              color="indigo"
              href="/admin/level-income"
            />
          </div>

          {/* Chart */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Last 7 Days Activity</h2>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                Approved Transactions
              </span>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                  <Line
                    type="monotone"
                    dataKey="deposits"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10B981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="withdrawals"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  href?: string;
  badge?: boolean;
}

function StatCard({ title, value, icon: Icon, color, href, badge }: StatCardProps) {
  const colors: any = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    red: 'from-red-600 to-red-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
    orange: 'from-orange-600 to-orange-700',
    pink: 'from-pink-600 to-pink-700',
    indigo: 'from-indigo-600 to-indigo-700',
  };

  const card = (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${badge ? 'ring-2 ring-red-400 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
        {badge && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}