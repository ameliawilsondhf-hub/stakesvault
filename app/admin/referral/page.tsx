"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminReferralHistory() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("earnings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [searchTerm, sortBy, users]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper function to get total referral count
  const getTotalReferrals = (user: any) => {
    const referred = user.referredUsers?.length || 0;
    const l1 = user.level1?.length || 0;
    const l2 = user.level2?.length || 0;
    const l3 = user.level3?.length || 0;
    
    // Return the maximum of both calculations
    return Math.max(referred, l1 + l2 + l3);
  };

  const filterAndSort = () => {
    let filtered = users;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "earnings") {
      filtered = [...filtered].sort((a, b) => (b.referralEarnings || 0) - (a.referralEarnings || 0));
    } else if (sortBy === "referrals") {
      filtered = [...filtered].sort((a, b) => getTotalReferrals(b) - getTotalReferrals(a));
    }

    setFilteredUsers(filtered);
  };

  // ✅ Fixed calculations
  const totalEarnings = filteredUsers.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);
  const totalReferrals = filteredUsers.reduce((sum, u) => sum + getTotalReferrals(u), 0);
  const activeUsers = filteredUsers.filter(u => (u.referralEarnings || 0) > 0 || getTotalReferrals(u) > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">🎁 Referral Earnings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total Earnings: <span className="text-pink-600 font-semibold">${totalEarnings.toFixed(2)}</span> | 
                Total Referrals: <span className="font-semibold">{totalReferrals}</span>
              </p>
            </div>
            <Link href="/admin">
              <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">💰</span>
              <p className="text-sm text-gray-500">Total Earnings</p>
            </div>
            <p className="text-3xl font-bold text-pink-600">${totalEarnings.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👥</span>
              <p className="text-sm text-gray-500">Total Referrals</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{totalReferrals}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="earnings">Sort by Earnings (High to Low)</option>
              <option value="referrals">Sort by Referrals (High to Low)</option>
            </select>

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-pink-600 font-semibold text-sm">
                            {(user.name || user.email || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "No Name"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                        {user.referralCode || "N/A"}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {/* ✅ Fixed: Shows level1 + level2 + level3 count */}
                      <p className="text-lg font-semibold text-blue-600">
                        {getTotalReferrals(user)}
                      </p>
                      <p className="text-xs text-gray-400">
                        L1: {user.level1?.length || 0} | L2: {user.level2?.length || 0} | L3: {user.level3?.length || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-pink-600">
                        ${(user.referralEarnings || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-indigo-600">
                        ${(user.levelIncome || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No referral data found</p>
              {searchTerm && (
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}