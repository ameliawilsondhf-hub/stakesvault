"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminWithdrawalsHistory() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [statusFilter, searchTerm, withdrawals]);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdraw/list", {
        credentials: "include",
        cache: "no-store"
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setWithdrawals(data);
        setFilteredWithdrawals(data);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = withdrawals;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(w => 
        w.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-700 border-green-300",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      rejected: "bg-red-100 text-red-700 border-red-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const totalAmount = filteredWithdrawals
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const stats = {
    total: filteredWithdrawals.length,
    approved: filteredWithdrawals.filter(w => w.status === "approved").length,
    pending: filteredWithdrawals.filter(w => w.status === "pending").length,
    rejected: filteredWithdrawals.filter(w => w.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
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
              <h1 className="text-2xl font-semibold text-gray-900">💸 Withdrawals History</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total: {stats.total} withdrawals | 
                Approved Amount: <span className="text-red-600 font-semibold">${totalAmount.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/withdraw">
                <button className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors">
                  Pending Withdrawals
                </button>
              </Link>
              <Link href="/admin">
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors">
                  ← Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Withdrawals</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-green-600 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-sm text-red-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
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
                placeholder="Search by user email, name, or wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="rejected">❌ Rejected</option>
            </select>

            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold text-sm">
                            {(withdrawal.userId?.name || withdrawal.userId?.email || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{withdrawal.userId?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{withdrawal.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-red-600 text-lg">
                        ${withdrawal.amount?.toFixed(2) || "0.00"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 font-mono break-all max-w-xs">
                        {withdrawal.walletAddress || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <p>{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(withdrawal.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.qrImage ? (
                        <button 
                          onClick={() => setSelectedQR(withdrawal.qrImage)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                        >
                          View QR 🔗
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No QR</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No withdrawals found</p>
              {(searchTerm || statusFilter !== "all") && (
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters
                </p>
              )}
            </div>
          )}
        </div>

        {/* QR Code Preview Modal */}
        {selectedQR && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedQR(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh]">
              <button
                className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors"
                onClick={() => setSelectedQR(null)}
              >
                ✕
              </button>
              <img
                src={selectedQR}
                alt="QR Code"
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}