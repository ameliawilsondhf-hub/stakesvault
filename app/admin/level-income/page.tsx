"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  Search, 
  ArrowLeft, 
  DollarSign,
  Award,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Eye
} from "lucide-react";

interface TeamUser {
  _id: string;
  name: string;
  email: string;
  income: number;
}

interface UserLevelIncome {
  _id: string;
  name: string;
  email: string;
  level1Income: number;
  level2Income: number;
  level3Income: number;
  referralEarnings: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1Users?: TeamUser[];
  level2Users?: TeamUser[];
  level3Users?: TeamUser[];
  levelIncome: number;
  totalEarnings: number;
  createdAt: string;
}

export default function AdminLevelIncomeHistory() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserLevelIncome[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserLevelIncome[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
const [selectedUserForModal, setSelectedUserForModal] = useState<UserLevelIncome | null>(null);
  const [searchL1, setSearchL1] = useState("");
  const [searchL2, setSearchL2] = useState("");
  const [searchL3, setSearchL3] = useState("");

  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchLevelIncomeData();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to page 1 on search
  }, [searchTerm, users]);

  const fetchLevelIncomeData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError("");

    try {
      const res = await fetch("/api/admin/level-income-full", {
        credentials: "include",
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.users)) {
        const normalized = data.users.map((u: any) => ({
          _id: u.user._id,
          name: u.user.name,
          email: u.user.email,
          level1Income: u.level1Income || 0,
          level2Income: u.level2Income || 0,
          level3Income: u.level3Income || 0,
          referralEarnings: u.referralEarnings || 0,
          levelIncome: (u.level1Income || 0) + (u.level2Income || 0) + (u.level3Income || 0),
          totalEarnings: u.totalEarnings || 0,
          level1Count: u.level1Count || 0,
          level2Count: u.level2Count || 0,
          level3Count: u.level3Count || 0,
          level1Users: u.level1Users || [],
          level2Users: u.level2Users || [],
          level3Users: u.level3Users || [],
          createdAt: new Date().toISOString()
        }));

        const filtered = normalized.sort((a: any, b: any) => b.totalEarnings - a.totalEarnings);
        setUsers(filtered);
        setFilteredUsers(filtered);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err: any) {
      console.error("Error fetching level income data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Rank", "Name", "Email",
      "L1 Income", "L2 Income", "L3 Income",
      "Level Income", "Referral Earnings", "Total Earnings",
      "L1 Count", "L2 Count", "L3 Count", "Team Size"
    ];
    
    const rows = filteredUsers.map((user, index) => {
      const teamSize = (user.level1Count || 0) + (user.level2Count || 0) + (user.level3Count || 0);
      return [
        index + 1,
        user.name || "N/A",
        user.email,
        (user.level1Income || 0).toFixed(2),
        (user.level2Income || 0).toFixed(2),
        (user.level3Income || 0).toFixed(2),
        (user.levelIncome || 0).toFixed(2),
        (user.referralEarnings || 0).toFixed(2),
        (user.totalEarnings || 0).toFixed(2),
        user.level1Count || 0,
        user.level2Count || 0,
        user.level3Count || 0,
        teamSize
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `level-income-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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

  const totalLevelIncome = filteredUsers.reduce((sum, u) => sum + (u.levelIncome || 0), 0);
  const totalReferralEarnings = filteredUsers.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);
  const activeUsers = filteredUsers.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 mt-6 text-lg font-medium">Loading Level Income Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => fetchLevelIncomeData()}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Level Income History</h1>
              </div>
              <p className="text-sm text-gray-500">
                Showing {filteredUsers.length} users • 
                Total: <span className="text-indigo-600 font-semibold">${(totalLevelIncome + totalReferralEarnings).toFixed(2)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchLevelIncomeData(true)}
                disabled={refreshing}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <Award className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-indigo-100 text-sm font-medium mb-1">Total Level Income</p>
            <p className="text-3xl font-bold">${totalLevelIncome.toFixed(2)}</p>
            <p className="text-indigo-200 text-xs mt-2">↑ From level bonuses</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <Users className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-pink-100 text-sm font-medium mb-1">Referral Earnings</p>
            <p className="text-3xl font-bold">${totalReferralEarnings.toFixed(2)}</p>
            <p className="text-pink-200 text-xs mt-2">↑ From direct referrals</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Active Users</p>
            <p className="text-3xl font-bold">{activeUsers}</p>
            <p className="text-green-200 text-xs mt-2">With earnings history</p>
          </div>
        </div>

        {/* Search and Export */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">L1 Income</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">L2 Income</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">L3 Income</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Level Income</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Referral Earnings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Earnings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team Size</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentUsers.map((user, index) => {
                  const actualRank = startIndex + index + 1;
                  const getRankColor = () => {
                    if (actualRank === 1) return "from-yellow-400 to-yellow-500";
                    if (actualRank === 2) return "from-gray-300 to-gray-400";
                    if (actualRank === 3) return "from-orange-400 to-orange-500";
                    return "from-indigo-500 to-purple-600";
                  };

                  return (
                    <>
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedUserForModal(user)}

                      >
                        <td className="px-6 py-4">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor()} rounded-xl flex items-center justify-center shadow-md`}>
                            <span className="text-white font-bold text-sm">#{actualRank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                              <span className="text-indigo-600 font-bold text-lg">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name || "No Name"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">${(user.level1Income || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-pink-600">${(user.level2Income || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-orange-600">${(user.level3Income || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-indigo-600 font-bold">${(user.levelIncome || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-pink-600 font-bold">${(user.referralEarnings || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-green-600 font-bold">${(user.totalEarnings || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {(user.level1Count || 0) + (user.level2Count || 0) + (user.level3Count || 0)}
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-500 mb-1">
                {searchTerm ? "No users match your search criteria" : "No level income data available yet"}
              </p>
            </div>
          )}
        </div>

        {/* Ultra Pro Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left: Items per page selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-black">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-black font-medium">
                  Showing <span className="text-black font-bold">{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</span> of <span className="text-black font-bold">{filteredUsers.length}</span>
                </span>
              </div>

              {/* Right: Page navigation */}
              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                  className="p-2.5 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous Page"
                  className="p-2.5 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex gap-1.5">
                  {getPageNumbers().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && goToPage(page)}
                      disabled={page === '...'}
                      className={`min-w-[42px] px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        page === currentPage
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : page === '...'
                          ? 'cursor-default text-gray-400'
                          : 'border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Mobile: Current page indicator */}
                <div className="sm:hidden px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">
                  {currentPage} / {totalPages}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                  className="p-2.5 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                  className="p-2.5 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-700"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom: Quick stats */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Page:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">{currentPage}</span>
                <span className="text-gray-600">of</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold">{totalPages}</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-gray-600">
                Total Records: <span className="font-bold text-blue-600">{filteredUsers.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {selectedUserForModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-xl">
                    {(selectedUserForModal.name || selectedUserForModal.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedUserForModal.name || "No Name"}</h2>
                  <p className="text-indigo-100 text-sm">{selectedUserForModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Stats */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Level Income</p>
                  <p className="text-lg font-bold text-indigo-600">${(selectedUserForModal.levelIncome || 0).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Referral Earnings</p>
                  <p className="text-lg font-bold text-pink-600">${(selectedUserForModal.referralEarnings || 0).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-lg font-bold text-green-600">${(selectedUserForModal.totalEarnings || 0).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Team Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(selectedUserForModal.level1Count || 0) + (selectedUserForModal.level2Count || 0) + (selectedUserForModal.level3Count || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Direct Referrals</p>
                  <p className="text-lg font-bold text-gray-900">{selectedUserForModal.level1Count || 0}</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable */}

    <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


               {/* Level 1 */}
               
<div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border-2 border-indigo-200 flex flex-col h-full">

  <input
    type="text"
    placeholder="Search Level 1 user..."
    value={searchL1}
    onChange={(e) => setSearchL1(e.target.value)}
   className="w-full mb-3 px-3 py-2 border border-indigo-300 rounded-lg text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-indigo-400"

  />

  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">1</span>
    </div>
    <div>
      <h3 className="font-bold text-indigo-900">Level 1 Users</h3>
      <p className="text-xs text-indigo-700">
        {selectedUserForModal.level1Count || 0} members
      </p>
    </div>
  </div>

  <div className="space-y-2 max-h-[400px] overflow-y-auto">
    {selectedUserForModal.level1Users
      ?.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchL1.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchL1.toLowerCase())
      )
      .map((u) => (
        <div
          key={u._id}
          className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-semibold text-gray-900 truncate">
            {u.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{u.email}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">Income:</span>
            <span className="text-sm font-bold text-indigo-600">
              ${Number(u.income || 0).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
  </div>
</div>
{/* ✅ LEVEL 2 */}
<div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border-2 border-pink-200 flex flex-col h-full">

  <input
    type="text"
    placeholder="Search Level 2 user..."
    value={searchL2}
    onChange={(e) => setSearchL2(e.target.value)}
className="w-full mb-3 px-3 py-2 border border-indigo-300 rounded-lg text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-indigo-400"

  />

  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">2</span>
    </div>
    <div>
      <h3 className="font-bold text-pink-900">Level 2 Users</h3>
      <p className="text-xs text-pink-700">
        {selectedUserForModal.level2Count || 0} members
      </p>
    </div>
  </div>

  <div className="space-y-2 max-h-[400px] overflow-y-auto">
    {selectedUserForModal.level2Users &&
    selectedUserForModal.level2Users.length > 0 ? (
      selectedUserForModal.level2Users
        .filter(
          (u) =>
            u.name?.toLowerCase().includes(searchL2.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchL2.toLowerCase())
        )
        .map((u) => (
          <div
            key={u._id}
            className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-semibold text-gray-900 truncate">
              {u.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">Income:</span>
              <span className="text-sm font-bold text-pink-600">
                ${Number(u.income || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))
    ) : (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-pink-300 mx-auto mb-2" />
        <p className="text-sm text-pink-600">No users yet</p>
      </div>
    )}
  </div>
</div>
{/* ✅ LEVEL 3 */}
<div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200 flex flex-col h-full">

  <input
    type="text"
    placeholder="Search Level 3 user..."
    value={searchL3}
    onChange={(e) => setSearchL3(e.target.value)}
className="w-full mb-3 px-3 py-2 border border-indigo-300 rounded-lg text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-indigo-400"

  />

  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">3</span>
    </div>
    <div>
      <h3 className="font-bold text-orange-900">Level 3 Users</h3>
      <p className="text-xs text-orange-700">
        {selectedUserForModal.level3Count || 0} members
      </p>
    </div>
  </div>

  <div className="space-y-2 max-h-[400px] overflow-y-auto flex-1">

    {selectedUserForModal.level3Users &&
    selectedUserForModal.level3Users.length > 0 ? (
      selectedUserForModal.level3Users.map((u) => (
        <div
          key={u._id}
          className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-semibold text-gray-900 truncate">
            {u.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{u.email}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">Income:</span>
            <span className="text-sm font-bold text-orange-600">
              ${Number(u.income || 0).toFixed(2)}
            </span>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-orange-300 mx-auto mb-2" />
        <p className="text-sm text-orange-600">No users yet</p>
      </div>
    )}
  </div>
</div>
</div>   {/* ✅ grid grid-cols-1 lg:grid-cols-3 close */}
</div>   {/* ✅ Modal Body - Scrollable close */}


            {/* Modal Footer */}
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}