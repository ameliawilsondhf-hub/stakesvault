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
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function ProfitCalculator() {
  const [amount, setAmount] = useState(1000);
  const [duration, setDuration] = useState(90);
  const [dailyRate] = useState(1); // 1% daily
  const [result, setResult] = useState<any>(null);
  const [graphData, setGraphData] = useState<any[]>([]);

  // Calculate when amount or duration changes
  useEffect(() => {
    calculateProfit();
  }, [amount, duration]);

  const calculateProfit = () => {
    if (!amount || amount <= 0) return;

    const principal = Number(amount);
    const days = Number(duration);
    const rate = dailyRate / 100;

    // Simple Interest Calculation
    const dailyProfit = principal * rate;
    const totalProfit = dailyProfit * days;
    const finalAmount = principal + totalProfit;
    const roi = (totalProfit / principal) * 100;

    // Generate graph data
    const graphArr: any[] = [];
    const step = Math.max(1, Math.floor(days / 50)); // Max 50 points

    for (let i = 0; i <= days; i += step) {
      const profit = dailyProfit * i;
      graphArr.push({
        day: i,
        amount: principal + profit,
        profit: profit,
      });
    }

    // Ensure last day is included
    if (graphArr[graphArr.length - 1].day !== days) {
      graphArr.push({
        day: days,
        amount: finalAmount,
        profit: totalProfit,
      });
    }

    setResult({
      principal,
      dailyProfit,
      totalProfit,
      finalAmount,
      roi,
      days,
    });

    setGraphData(graphArr);
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000, 50000];
  const quickDurations = [
    { value: 30, label: "30 Days" },
    { value: 60, label: "60 Days" },
    { value: 90, label: "90 Days" },
    { value: 120, label: "120 Days" },
    { value: 180, label: "6 Months" },
    { value: 270, label: "9 Months" },
    { value: 365, label: "1 Year" },
    { value: 730, label: "2 Years" },
    { value: 1095, label: "3 Years" },
    { value: 1460, label: "4 Years" },
    { value: 1825, label: "5 Years" },
  ];

  // Pie chart data
  const pieData = result ? [
    { name: "Principal", value: result.principal, color: "#3b82f6" },
    { name: "Profit", value: result.totalProfit, color: "#22c55e" },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] text-white">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            💰 Profit Calculator
          </h1>
          <p className="text-white/70 text-lg">Calculate your earnings with 1% daily simple interest</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Amount Input Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <label className="block text-white/70 text-sm font-medium mb-3">
              💵 Enter Investment Amount
            </label>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/50">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-2xl font-bold text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="1000"
                min="1"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-4">
              <p className="text-xs text-white/50 mb-2">Quick Select:</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === amt
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Input Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <label className="block text-white/70 text-sm font-medium mb-3">
              ⏱️ Select Time Period
            </label>
            
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
            >
              {quickDurations.map((dur) => (
                <option key={dur.value} value={dur.value} className="bg-[#1b223c] text-white">
                  {dur.label}
                </option>
              ))}
            </select>

            {/* Duration Info */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Duration:</span>
                <span className="text-white font-semibold">{duration} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Daily Rate:</span>
                <span className="text-green-400 font-semibold">{dailyRate}% (Simple)</span>
              </div>
              {duration >= 365 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Years:</span>
                  <span className="text-purple-400 font-semibold">{(duration / 365).toFixed(1)} years</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <>
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/30 rounded-2xl p-6 md:p-8 mb-8 shadow-2xl">
              <div className="text-center">
                <p className="text-white/70 text-sm md:text-base mb-2">Your Total Profit After {result.days} Days</p>
                <div className="text-5xl md:text-7xl font-extrabold text-green-400 mb-4">
                  ${result.totalProfit.toLocaleString()}
                </div>
                <div className="inline-block bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-6 py-3">
                  <p className="text-white/70 text-sm">Final Amount: <span className="text-white font-bold text-xl">${result.finalAmount.toLocaleString()}</span></p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Principal"
                value={`$${result.principal.toLocaleString()}`}
                icon="💵"
                color="from-blue-600 to-cyan-600"
              />
              <StatCard
                title="Daily Profit"
                value={`$${result.dailyProfit.toFixed(2)}`}
                icon="📈"
                color="from-green-600 to-emerald-600"
              />
              <StatCard
                title="Total Profit"
                value={`$${result.totalProfit.toLocaleString()}`}
                icon="💰"
                color="from-purple-600 to-pink-600"
              />
              <StatCard
                title="ROI"
                value={`${result.roi.toFixed(0)}%`}
                icon="🎯"
                color="from-yellow-600 to-orange-600"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Line Chart - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Growth Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255,255,255,0.5)"
                      label={{ value: 'Days', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      dot={false}
                      name="Total Amount"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={false}
                      strokeDasharray="5 5"
                      name="Profit Only"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🥧</span>
                  Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-white/70">Principal</span>
                    </div>
                    <span className="text-sm font-bold">{((result.principal / result.finalAmount) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-white/70">Profit</span>
                    </div>
                    <span className="text-sm font-bold">{((result.totalProfit / result.finalAmount) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Detailed Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Investment Amount" value={`$${result.principal.toLocaleString()}`} />
                <DetailRow label="Time Period" value={`${result.days} days`} />
                <DetailRow label="Daily Interest Rate" value="1% (Simple)" />
                <DetailRow label="Daily Profit" value={`$${result.dailyProfit.toFixed(2)}`} color="text-green-400" />
                <DetailRow label="Total Interest Earned" value={`$${result.totalProfit.toLocaleString()}`} color="text-green-400" />
                <DetailRow label="Final Amount" value={`$${result.finalAmount.toLocaleString()}`} color="text-blue-400" bold />
                <DetailRow label="Return on Investment" value={`${result.roi.toFixed(2)}%`} color="text-yellow-400" />
                <DetailRow label="Interest Type" value="Simple Interest" />
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                How Simple Interest Works
              </h4>
              <ul className="space-y-2 text-white/80 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><b>Consistent earnings:</b> You earn ${result.dailyProfit.toFixed(2)} every single day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><b>Easy calculation:</b> Total profit = Daily profit × Number of days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><b>Linear growth:</b> Your profit grows steadily in a straight line</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><b>Predictable returns:</b> No surprises, you know exactly what you'll earn</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-lg border border-white/20`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-xs md:text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value, color = "text-white", bold = false }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10">
      <span className="text-white/70 text-sm">{label}:</span>
      <span className={`${color} text-sm md:text-base ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}