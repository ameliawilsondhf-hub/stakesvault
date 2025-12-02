"use client";

import { useEffect, useState } from "react";
import { Loader2, Eye, CheckCircle, XCircle, Clock, DollarSign, User, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Deposit {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  amount: number;
  screenshot: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export default function AdminDepositPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/deposit/list", { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
        credentials: "include" // ✅ ADDED FOR CONSISTENCY
      });
      
      if (!res.ok) {
        console.error("Failed to fetch deposits");
        setDeposits([]);
        return;
      }

      const data = await res.json();
      
      if (Array.isArray(data)) {
        setDeposits(data);
      } else if (data?.deposits && Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      } else {
        console.error("Invalid data format:", data);
        setDeposits([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const approveDeposit = async (id: string) => {
    if (processing) return;
    
    const confirmed = confirm("Are you sure you want to approve this deposit?");
    if (!confirmed) return;

    setProcessing(id);
    
    try {
      // ✅✅✅ CRITICAL FIX: Added credentials: "include"
      const res = await fetch("/api/admin/deposit/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ THIS WAS MISSING - NOW FIXED
        body: JSON.stringify({ requestId: id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDeposits((prev) =>
          prev.map((d) => (d._id === id ? { ...d, status: "approved" as const } : d))
        );
        alert("✅ Deposit approved successfully!");
      } else {
        alert(data.message || "Failed to approve deposit");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Error approving deposit. Please try again.");
    } finally {
      setProcessing(null);
      loadData();
    }
  };

  const rejectDeposit = async (id: string) => {
    if (processing) return;
    
    const reason = prompt(
      "Please provide a detailed reason for rejecting this deposit:\n\n" +
      "Common reasons:\n" +
      "• Screenshot is unclear or blurry\n" +
      "• Transaction amount does not match\n" +
      "• Transaction ID is not visible\n" +
      "• Wrong wallet address shown\n\n" +
      "Enter your reason:"
    );

    if (!reason || reason.trim().length === 0) {
      alert("⚠️ Rejection reason is required!");
      return;
    }

    if (reason.trim().length < 10) {
      alert("⚠️ Please provide a more detailed reason (at least 10 characters)");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to reject this deposit?\n\n` +
      `Reason:\n"${reason}"\n\n` +
      `The user will receive an email with this reason.`
    );
    
    if (!confirmed) return;

    setProcessing(id);

    try {
      // ✅✅✅ CRITICAL FIX: Added credentials: "include"
      const res = await fetch("/api/admin/deposit/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ THIS WAS MISSING - NOW FIXED
        body: JSON.stringify({ 
          requestId: id,
          reason: reason.trim()
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDeposits((prev) =>
          prev.map((d) => (d._id === id ? { ...d, status: "rejected" as const } : d))
        );
        alert("✅ Deposit rejected successfully!\n\n📧 Email notification sent to user.");
      } else {
        alert(data.message || "Failed to reject deposit");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Error rejecting deposit. Please try again.");
    } finally {
      setProcessing(null);
      loadData();
    }
  };

  const pendingCount = deposits.filter(d => d.status === "pending").length;
  const approvedCount = deposits.filter(d => d.status === "approved").length;
  const rejectedCount = deposits.filter(d => d.status === "rejected").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                Deposit Requests
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage all user deposit requests</p>
            </div>
            <Link href="/admin">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" />
              {pendingCount > 0 && (
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <p className="text-yellow-100 text-sm mb-1">Pending</p>
            <p className="text-4xl font-bold">{pendingCount}</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-green-100 text-sm mb-1">Approved</p>
            <p className="text-4xl font-bold">{approvedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-red-100 text-sm mb-1">Rejected</p>
            <p className="text-4xl font-bold">{rejectedCount}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              All Deposits ({deposits.length})
            </h2>
          </div>

          {deposits.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No deposits found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Proof
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {deposits.map((deposit) => (
                    <tr
                      key={deposit._id}
                      className="hover:bg-gray-700/30 transition"
                    >
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                            {deposit.userId?.name?.charAt(0).toUpperCase() || 
                             deposit.userId?.email?.charAt(0).toUpperCase() || 
                             "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {deposit.userId?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-400">
                              {deposit.userId?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-green-400">
                          ${deposit.amount.toFixed(2)}
                        </span>
                      </td>

                      {/* Screenshot */}
                      <td className="px-6 py-4">
                        {deposit.screenshot ? (
                          <button
                            onClick={() => setSelectedImage(deposit.screenshot)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                            deposit.status === "pending"
                              ? "bg-yellow-600/20 text-yellow-300 border border-yellow-500/30"
                              : deposit.status === "approved"
                              ? "bg-green-600/20 text-green-300 border border-green-500/30"
                              : "bg-red-600/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {deposit.status === "pending" && <Clock className="w-4 h-4" />}
                          {deposit.status === "approved" && <CheckCircle className="w-4 h-4" />}
                          {deposit.status === "rejected" && <XCircle className="w-4 h-4" />}
                          {deposit.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-300">
                            {new Date(deposit.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(deposit.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => approveDeposit(deposit._id)}
                            disabled={deposit.status !== "pending" || processing === deposit._id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {processing === deposit._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>

                          <button
                            onClick={() => rejectDeposit(deposit._id)}
                            disabled={deposit.status !== "pending" || processing === deposit._id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {processing === deposit._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl w-full">
            <div className="text-white text-center mb-4 bg-black/50 px-4 py-2 rounded-lg inline-block">
              Click anywhere to close
            </div>
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="max-w-full max-h-[80vh] mx-auto rounded-xl shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='18'%3EImage Not Found%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}