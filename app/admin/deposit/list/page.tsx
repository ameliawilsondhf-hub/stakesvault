"use client";

import { useEffect, useState } from "react";

export default function DepositListPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load deposits
  const loadDeposits = async () => {
    try {
      const res = await fetch("/api/admin/deposit/list");
      const data = await res.json();
      setDeposits(data);
    } catch (e) {
      console.log("Error loading deposits:", e);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  // Approve
  const approveDeposit = async (id: string) => {
    setLoading(true);
    await fetch("/api/admin/deposit/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    setLoading(false);
    loadDeposits();
  };

  // Reject
  const rejectDeposit = async (id: string) => {
    setLoading(true);
    await fetch("/api/admin/deposit/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    setLoading(false);
    loadDeposits();
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Deposit List</h1>

      {loading && <p className="text-yellow-400 mb-4">Processing...</p>}

      <table className="w-full border border-gray-700">
        <thead>
          <tr className="bg-gray-900">
            <th className="p-3 border border-gray-700">User</th>
            <th className="p-3 border border-gray-700">Amount</th>
            <th className="p-3 border border-gray-700">Proof</th>
            <th className="p-3 border border-gray-700">Status</th>
            <th className="p-3 border border-gray-700">Actions</th>
          </tr>
        </thead>

        <tbody>
          {deposits.length === 0 && (
            <tr>
              <td className="text-center p-5" colSpan={5}>
                No deposits found
              </td>
            </tr>
          )}

          {deposits.map((dep) => (
            <tr key={dep._id} className="text-center">
              <td className="p-3 border border-gray-700">
                {dep.userId?.name || dep.userId?.email || dep.userId}
              </td>

              <td className="p-3 border border-gray-700">${dep.amount}</td>

              {/* PROOF / SCREENSHOT COLUMN */}
              <td className="p-3 border border-gray-700">
                {dep.screenshot ? (
                  <button
                    onClick={() =>
                      setPreviewImage(`/uploads/${dep.screenshot}`)
                    }
                    className="text-blue-400 underline"
                  >
                    View Proof
                  </button>
                ) : (
                  <span className="text-gray-500">No Proof</span>
                )}
              </td>

              <td className="p-3 border border-gray-700">{dep.status}</td>

              <td className="p-3 border border-gray-700 flex gap-3 justify-center">
                {dep.status === "pending" ? (
                  <>
                    <button
                      onClick={() => approveDeposit(dep._id)}
                      className="bg-green-600 px-3 py-1 rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => rejectDeposit(dep._id)}
                      className="bg-red-600 px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400">Processed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL FOR IMAGE PREVIEW */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-4 rounded-lg relative max-w-[95vw] max-h-[95vh]">
            {/* Close Button */}
            <button
              className="absolute top-1 right-2 text-white text-3xl"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>

            {/* Image */}
            <img
              src={previewImage}
              alt="Proof"
              className="max-w-full max-h-[90vh] rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
