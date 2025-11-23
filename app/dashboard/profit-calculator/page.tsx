"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function ProfitCalculator() {
  const [wallet, setWallet] = useState(0);
  const [dailyRate] = useState(1); // FIXED 1% DAILY
  const [duration, setDuration] = useState(365 * 5); // DEFAULT 5 YEARS
  const [graphData, setGraphData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Load wallet from dashboard API
  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const res = await fetch("/api/user/dashboard", { cache: "no-store" });
    const json = await res.json();
    setWallet(json.walletBalance || 0);
  };

  // Generate graph + table data
  useEffect(() => {
    if (wallet > 0) generateData();
  }, [wallet, duration]);

  const generateData = () => {
    let P = Number(wallet);
    let r = dailyRate / 100;

    let graphArr: any[] = [];
    let tableArr: any[] = [];
    let totalProfit = 0;

    for (let i = 1; i <= duration; i++) {
      const amount = P * Math.pow(1 + r, i);
      const profit = amount - P;
      totalProfit = profit;

      // GRAPH POINTS (limit to 400 only)
      if (i % Math.floor(duration / 400) === 0) {
        graphArr.push({
          day: "Day " + i,
          amount: Number(amount.toFixed(2)),
          profit: Number(profit.toFixed(2)),
        });
      }

      // TABLE — ONLY 100 DAYS
      if (i <= 100) {
        tableArr.push({
          day: "Day " + i,
          dailyProfit: Number((P * r * Math.pow(1 + r, i - 1)).toFixed(2)),
          profit: Number(profit.toFixed(2)),
          amount: Number(amount.toFixed(2)),
        });
      }
    }

    setSummary({
      totalProfit: Number(totalProfit.toFixed(2)),
      finalAmount: Number((P + totalProfit).toFixed(2)),
      yearlyProfit: Number((P * Math.pow(1 + r, 365) - P).toFixed(2)),
      fiveYearProfit: Number((P * Math.pow(1 + r, 365 * 5) - P).toFixed(2)),
      roi: Number(((totalProfit / P) * 100).toFixed(2)),
    });

    setGraphData(graphArr);
    setTableData(tableArr);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#06080e] via-[#0f121b] to-[#161b26] text-white">

      <h1 className="text-4xl font-bold mb-6">Long-Term Profit Calculator (1% Daily Compound)</h1>

      <p className="mb-2 text-lg"><b>Wallet Balance:</b> ${wallet}</p>
      <p className="mb-2 text-lg"><b>Daily Profit:</b> {dailyRate}% (Compounded)</p>

      {/* ----- DURATION SELECTOR ----- */}
      <div className="mt-4 mb-8">
        <label className="text-white/70">Select Duration:</label>
        <select
          className="p-2 ml-3 rounded bg-white text-black"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          <option value={30}>30 Days</option>
          <option value={60}>2 Months (60 Days)</option>
          <option value={90}>3 Months (90 Days)</option>
          <option value={120}>4 Months (120 Days)</option>
          <option value={180}>6 Months (180 Days)</option>
          <option value={365}>1 Year</option>
          <option value={365 * 2}>2 Years</option>
          <option value={365 * 3}>3 Years</option>
          <option value={365 * 5}>5 Years (Recommended)</option>
        </select>
      </div>

      {/* ----- SUMMARY BOXES ----- */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12">
          <Box title="Total Profit" value={summary.totalProfit} />
          <Box title="Final Amount" value={summary.finalAmount} />
          <Box title="1 Year Profit" value={summary.yearlyProfit} />
          <Box title="5 Year Profit" value={summary.fiveYearProfit} />
        </div>
      )}

      {/* ----- LINE GRAPH ----- */}
      <h2 className="text-3xl font-bold mb-4">Growth Curve</h2>
      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-14">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="day" stroke="#ccc" hide />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#00ff90" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ----- BAR GRAPH ----- */}
      <h2 className="text-3xl font-bold mb-4">First 100 Days Profit</h2>
      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-14">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={tableData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="day" stroke="#ccc" hide />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Bar dataKey="dailyProfit" fill="#00ccff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ----- TABLE (ONLY 100 ROWS) ----- */}
      <h2 className="text-3xl font-bold mb-4">Daily Profit Table (100 Days Only)</h2>

      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 overflow-auto max-h-[500px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20 text-white/70">
              <th className="py-2">Day</th>
              <th className="py-2">Daily Profit</th>
              <th className="py-2">Total Profit</th>
              <th className="py-2">Final Amount</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="border-b border-white/10">
                <td className="py-2">{row.day}</td>
                <td className="py-2">${row.dailyProfit}</td>
                <td className="py-2">${row.profit}</td>
                <td className="py-2">${row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function Box({ title, value }: any) {
  return (
    <div className="p-4 bg-white/10 rounded-xl border border-white/20">
      <p className="text-white/70">{title}</p>
      <p className="text-2xl font-bold">${value.toLocaleString()}</p>
    </div>
  );
}
