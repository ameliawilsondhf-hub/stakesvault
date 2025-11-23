"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WithdrawHistory() {
  const [allData, setAllData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  // filters
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [status, setStatus] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch("/api/user/dashboard", { cache: "no-store" });
    const json = await res.json();

    setAllData(json.withdrawals || []);
    setFiltered(json.withdrawals || []);
  };

  // MASTER FILTER
  useEffect(() => {
    let data = [...allData];

    // DATE FILTER
    if (selectedDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.createdAt)
          .toISOString()
          .split("T")[0];
        return itemDate === selectedDate;
      });
    }

    // MONTH FILTER
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      data = data.filter((item) => {
        const d = new Date(item.createdAt);
        return (
          d.getFullYear() === Number(year) &&
          d.getMonth() + 1 === Number(month)
        );
      });
    }

    // STATUS FILTER
    if (status) {
      data = data.filter((item) => item.status === status);
    }

    setPage(1);
    setFiltered(data);
  }, [selectedDate, selectedMonth, status, allData]);

  // PAGINATION DATA
  const startIndex = (page - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#06080e] via-[#0f121b] to-[#161b26]">

      {/* BACK BUTTON */}
      <Link href="/dashboard">
        <button className="mb-6 px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white hover:bg-white/30 transition">
          ← Back to Dashboard
        </button>
      </Link>

      <h1 className="text-4xl font-extrabold text-white mb-8">
        Withdrawal History
      </h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

        {/* DATE FILTER */}
        <div>
          <label className="text-white/70 block mb-1">Filter by Date</label>
          <input
            type="date"
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-white w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* MONTH FILTER */}
        <div>
          <label className="text-white/70 block mb-1">Filter by Month</label>
          <input
            type="month"
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-white w-full"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* STATUS FILTER */}
        <div>
          <label className="text-white/70 block mb-1">Filter by Status</label>

          <select
            className="
              p-2 rounded-lg w-full
              bg-white text-black
              dark:bg-white/20 dark:text-white
              border border-white/20
            "
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" className="text-black">All</option>
            <option value="approved" className="text-black">Approved</option>
            <option value="pending" className="text-black">Pending</option>
            <option value="rejected" className="text-black">Rejected</option>
          </select>
        </div>

      </div>

      {/* HISTORY LIST */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">

        {paginated.length === 0 ? (
          <p className="text-white/60 text-center py-6">No Records Found</p>
        ) : (
          paginated.map((item: any) => (
            <div
              key={item._id}
              className="flex justify-between items-center py-4 border-b border-white/10 last:border-none"
            >
              <div>
                <p className="text-xl text-white font-semibold">${item.amount}</p>
                <p className="text-white/60 text-sm">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  item.status === "approved"
                    ? "bg-green-400 text-black"
                    : item.status === "pending"
                    ? "bg-yellow-300 text-black"
                    : "bg-red-400 text-black"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {filtered.length > 10 && (
        <div className="flex justify-center items-center mt-6 gap-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white disabled:opacity-30"
          >
            Previous
          </button>

          <span className="text-white">{page}</span>

          <button
            disabled={startIndex + perPage >= filtered.length}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white disabled:opacity-30"
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}
