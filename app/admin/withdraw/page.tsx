"use client";

import { useEffect, useState } from "react";

export default function AdminWithdrawPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  // AUTO REFRESH
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/withdraw/list", { cache: "no-store" });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
      setLoading(false);
    } catch (e) {
      console.error("LOAD ERROR:", e);
      setRequests([]);
      setLoading(false);
    }
  };

  const approveReq = async (id: string) => {
    if (processing) return;

    const confirmed = confirm(
      "Are you sure you want to approve this withdrawal?\n\n" +
      "⚠️ Make sure you have sent the payment to the user's wallet address before approving!"
    );
    
    if (!confirmed) return;

    setProcessing(id);

    // Optimistic UI update
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "approved" } : r));

    try {
      const res = await fetch("/api/admin/withdraw/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawId: id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("✅ Withdrawal approved successfully!\n\n📧 Email notification sent to user.");
      } else {
        alert(`❌ ${data.message || "Failed to approve withdrawal"}`);
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("❌ Network error - please try again");
    }

    setProcessing(null);
    loadData();
  };

  const rejectReq = async (id: string) => {
    if (processing) return;

    // Step 1: Reason prompt with templates
    const reason = prompt(
      "Please provide a detailed reason for rejecting this withdrawal:\n\n" +
      "Common reasons:\n" +
      "• Invalid wallet address format\n" +
      "• Wallet address does not match TRC20 standard\n" +
      "• Insufficient account verification\n" +
      "• Suspected fraudulent activity\n" +
      "• Minimum withdrawal amount not met\n\n" +
      "Enter your reason:"
    );

    // Step 2: Validation
    if (!reason || reason.trim().length === 0) {
      alert("⚠️ Rejection reason is required!");
      return;
    }

    if (reason.trim().length < 10) {
      alert("⚠️ Please provide a more detailed reason (at least 10 characters)");
      return;
    }

    // Step 3: Confirmation with preview
    const confirmed = confirm(
      `Are you sure you want to reject this withdrawal?\n\n` +
      `Reason:\n"${reason}"\n\n` +
      `💰 The withdrawal amount will be REFUNDED to the user's wallet balance.\n` +
      `📧 The user will receive an email with this reason.`
    );
    
    if (!confirmed) return;

    setProcessing(id);

    // Optimistic UI update
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "rejected" } : r));

    try {
      const res = await fetch("/api/admin/withdraw/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          withdrawId: id,
          reason: reason.trim()
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(
          "✅ Withdrawal rejected successfully!\n\n" +
          `💰 Amount refunded: $${data.data?.amount || 'N/A'}\n` +
          `📧 Email notification sent to user with rejection reason.`
        );
      } else {
        alert(`❌ ${data.message || "Failed to reject withdrawal"}`);
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("❌ Network error - please try again");
    }

    setProcessing(null);
    loadData();
  };

  // LOADING UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8 relative overflow-hidden">
      {/* HEADER */}
      <div className="relative z-10">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 shadow-xl mb-8 backdrop-blur-xl">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            💸 Withdraw Requests
          </h1>
          <p className="text-gray-300">Manage all user withdrawals</p>
        </div>

        {/* TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-white/10 border-b border-white/20 p-4 text-white font-bold">
            📋 Total Requests: {requests.length}
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-white">
              <thead className="sticky top-0 bg-white/10 backdrop-blur-xl z-10">
                <tr className="border-b border-white/20">
                  <th className="p-4">User</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Wallet Address</th>
                  <th className="p-4">QR Image</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map(r => (
                  <tr key={r._id} className="border-b border-white/10 hover:bg-white/5">

                    {/* USER */}
                    <td className="p-4">
                      <p className="font-semibold">{r.userId?.name || "Unknown"}</p>
                      <p className="text-gray-400 text-sm">{r.userId?.email}</p>
                    </td>

                    {/* AMOUNT */}
                    <td className="p-4 text-green-400 font-bold text-xl">
                      ${r.amount}
                    </td>

                    {/* WALLET */}
                    <td className="p-4 text-sm text-gray-300 font-mono break-all max-w-xs">
                      {r.walletAddress || "Not provided"}
                    </td>

                    {/* QR IMAGE PREVIEW */}
                    <td className="p-4">
                      {r.qrImage ? (
                        <img
                          src={r.qrImage}
                          onClick={() => setSelectedQR(r.qrImage)}
                          className="w-16 h-16 rounded-lg object-cover cursor-pointer border shadow hover:scale-110 transition"
                        />
                      ) : (
                        <span className="text-gray-500 italic">No QR</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border
                        ${
                          r.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : r.status === "approved"
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }
                      `}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => approveReq(r._id)}
                          disabled={r.status !== "pending" || processing === r._id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {processing === r._id ? "..." : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectReq(r._id)}
                          disabled={r.status !== "pending" || processing === r._id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {processing === r._id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EMPTY STATE */}
        {requests.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-xl">No withdrawal requests found</p>
          </div>
        )}
      </div>

      {/* QR IMAGE MODAL */}
      {selectedQR && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedQR(null)}
        >
          <div className="relative bg-white/10 p-4 rounded-xl border border-white/20 shadow-2xl max-w-3xl w-full">
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-red-600 rounded-full text-white hover:bg-red-700 transition"
              onClick={() => setSelectedQR(null)}
            >
              ✕
            </button>

            <img
              src={selectedQR}
              className="w-full max-h-[80vh] object-contain rounded-lg"
              alt="QR Code"
            />
          </div>
        </div>
      )}

    </div>
  );
}