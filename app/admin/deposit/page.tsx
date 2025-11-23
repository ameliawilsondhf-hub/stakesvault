"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function AdminDepositPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/deposit/list", { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setDeposits(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const approveDeposit = async (id: string) => {
    setDeposits((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: "approved" } : d))
    );

    await fetch("/api/admin/deposit/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ depositId: id }),
    });

    loadData();
  };

  const rejectDeposit = async (id: string) => {
    setDeposits((prev) =>
      prev.map((d) => (d._id === id ? { ...d, status: "rejected" } : d))
    );

    await fetch("/api/admin/deposit/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ depositId: id }),
    });

    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[450px] h-[450px] bg-blue-500/20 blur-3xl rounded-full -top-40 -left-32 animate-float"></div>
        <div className="absolute w-[550px] h-[550px] bg-purple-500/20 blur-3xl rounded-full top-1/3 -right-40 animate-float-slow"></div>
        <div className="absolute w-[400px] h-[400px] bg-pink-500/20 blur-3xl rounded-full bottom-10 left-1/3 animate-float-reverse"></div>
      </div>

      <div className="relative z-10">

        <div className="bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg mb-8 backdrop-blur-xl">
          <h1 className="text-4xl text-white font-bold flex items-center gap-3">
            💰 Deposit Requests
          </h1>
          <p className="text-gray-300">Manage all user deposits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="statBox bg-green-600/25 border border-green-500/40">
            <p className="text-green-300 text-sm">Pending</p>
            <p className="text-4xl font-bold">
              {deposits.filter((d) => d.status === "pending").length}
            </p>
          </div>

          <div className="statBox bg-blue-600/25 border border-blue-500/40">
            <p className="text-blue-300 text-sm">Approved</p>
            <p className="text-4xl font-bold">
              {deposits.filter((d) => d.status === "approved").length}
            </p>
          </div>

          <div className="statBox bg-red-600/25 border border-red-500/40">
            <p className="text-red-300 text-sm">Rejected</p>
            <p className="text-4xl font-bold">
              {deposits.filter((d) => d.status === "rejected").length}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-white/10 border-b border-white/20 p-4 text-white font-bold">
            Total: {deposits.length}
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-white">

              <thead className="sticky top-0 bg-white/10 backdrop-blur-xl">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Screenshot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {deposits.map((d: any) => (
                  <tr
                    key={d._id}
                    className="border-b border-white/10 hover:bg-white/10 transition-all duration-300 animate-fadeIn"
                  >

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                          {(d.userId?.name || d.userId?.email || "U")
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{d.userId?.name}</p>
                          <p className="text-gray-400 text-sm">{d.userId?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-green-400 font-bold text-xl">
                      ${d.amount}
                    </td>

                    {/* 🔥 FIXED SCREENSHOT PATH */}
                    <td className="p-4">
                      {d.screenshot ? (
                        <button
onClick={() => setSelectedImage(d.screenshot)}
                          className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`
                          px-4 py-2 rounded-full text-sm font-bold
                          ${
                            d.status === "pending"
                              ? "bg-yellow-600/20 text-yellow-300"
                              : d.status === "approved"
                              ? "bg-green-600/20 text-green-300"
                              : "bg-red-600/20 text-red-300"
                          }
                        `}
                      >
                        {d.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 text-gray-300 text-sm">
                      {new Date(d.createdAt).toLocaleDateString()} <br />
                      <span className="text-gray-500 text-xs">
                        {new Date(d.createdAt).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => approveDeposit(d._id)}
                          disabled={d.status === "approved"}
                          className="actionBtn bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectDeposit(d._id)}
                          disabled={d.status === "rejected"}
                          className="actionBtn bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🔥 FIXED IMAGE VIEWER WITH ERROR HANDLING */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 cursor-pointer p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="text-white mb-4 text-sm bg-black/50 px-4 py-2 rounded-lg">
              Click anywhere to close
            </div>
            <img
              src={selectedImage}
              alt="Deposit Screenshot"
              className="max-w-[95%] max-h-[85%] rounded-2xl shadow-2xl transform animate-zoomIn"
              onError={(e) => {
                console.error("❌ Image failed to load:", selectedImage);
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='20'%3EImage Not Found%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="text-gray-400 mt-4 text-xs">
              {selectedImage}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float-slow {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-25px, 25px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0); }
          50% { transform: translate(20px, 25px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes zoomIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 28s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 24s ease-in-out infinite; }
        .animate-zoomIn { animation: zoomIn 0.25s ease-out; }

        .statBox {
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }

        .actionBtn {
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: bold;
          transition: 0.2s;
        }
      `}</style>
    </div>
  );
}