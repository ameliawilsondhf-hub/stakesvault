"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Worldwide names for live notifications
const NAMES = [
  "John Smith", "Emma Chen", "Mohammed Ali", "Priya Sharma", "Carlos Rodriguez",
  "Yuki Tanaka", "Sarah Johnson", "Ahmed Hassan", "Maria Garcia", "Raj Kumar",
  "David Kim", "Sophie Martin", "Wei Zhang", "Isabella Rossi", "Michael Brown",
  "Fatima Abdullah", "Lucas Silva", "Mei Lin", "Omar Khan", "Anna Kowalski",
  "James Wilson", "Aisha Patel", "Chen Wei", "Laura Martinez", "Arjun Singh",
  "Maya Cohen", "Ali Reza", "Nina Petrov", "Jose Santos", "Leila Hassan"
];

const COUNTRIES = ["🇺🇸", "🇨🇳", "🇮🇳", "🇧🇷", "🇬🇧", "🇯🇵", "🇩🇪", "🇫🇷", "🇦🇪", "🇰🇷"];

export default function StakePlanPage() {
  const [selectedDays, setSelectedDays] = useState(30);
  const [amount, setAmount] = useState("");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);

  // Live stake notifications with 3-second cycle
  useEffect(() => {
    const usedNames = new Set<string>();
    
    const generateNotification = () => {
      // Get unique name
      let name, attempts = 0;
      do {
        name = NAMES[Math.floor(Math.random() * NAMES.length)];
        attempts++;
      } while (usedNames.has(name) && attempts < 10);
      
      if (usedNames.size > 25) usedNames.clear();
      usedNames.add(name);
      
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const amount = [100, 250, 500, 750, 1000, 1500, 2500, 3500, 5000][Math.floor(Math.random() * 9)];
      const days = [30, 60, 90][Math.floor(Math.random() * 3)];
      
      const newNotif = {
        id: Date.now() + Math.random(),
        name,
        country,
        amount,
        days,
        timestamp: new Date().toLocaleTimeString(),
        state: 'entering'
      };

      setLiveNotifications(prev => {
        const updated = [newNotif, ...prev];
        return updated.slice(0, 8);
      });

      // Auto-remove after 2.7 seconds
      setTimeout(() => {
        setLiveNotifications(prev => 
          prev.map(n => n.id === newNotif.id ? { ...n, state: 'exiting' } : n)
        );
      }, 2500);

      setTimeout(() => {
        setLiveNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 2700);
    };

    // Initial notifications
    setTimeout(() => generateNotification(), 500);
    setTimeout(() => generateNotification(), 1500);
    setTimeout(() => generateNotification(), 2500);
    
    // Generate every 3 seconds
    const interval = setInterval(() => {
      generateNotification();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user stakes with proper error handling
  useEffect(() => {
    const fetchStakes = async () => {
      try {
        const res = await fetch("/api/stake/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setStakes(data.stakes || []);
        } else {
          console.log("API returned error, using empty stakes");
          setStakes([]);
        }
      } catch (error) {
        console.log("Failed to fetch stakes, using empty array", error);
        setStakes([]);
      } finally {
        // Always stop loading after 1 second max
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    };

    fetchStakes();

    // Backup: Force stop loading after 2 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Generate daily preview
  const calculatePreview = () => {
    if (!amount || Number(amount) <= 0) return [];
    let arr = [];
    let principal = Number(amount);

    for (let day = 1; day <= selectedDays; day++) {
      const profit = principal * 0.01;
      principal += profit;
      arr.push({
        day,
        profit: profit.toFixed(2),
        total: principal.toFixed(2),
      });
    }
    return arr;
  };

  useEffect(() => {
    setDailyData(calculatePreview());
  }, [amount, selectedDays]);

  // Create stake with proper error handling
  const createStake = async () => {
    try {
      const res = await fetch("/api/stake/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: Number(amount),
          days: selectedDays,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Stake created successfully!");
        setConfirmOpen(false);
        // Refresh stakes
        window.location.reload();
      } else {
        alert("❌ Error: " + (data.message || "Failed to create stake"));
      }
    } catch (error) {
      alert("❌ Network error. Please check your connection and try again.");
      console.error("Stake creation error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] relative overflow-hidden">
      
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl top-1/2 -right-48 animate-float-slow"></div>
        <div className="absolute w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl -bottom-48 left-1/3 animate-float-reverse"></div>
      </div>

      <div className="relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            💎 Premium Stake Plans
          </h1>
          <p className="text-gray-400 text-lg">Grow your wealth with daily compounding returns</p>
        </div>

        {/* LIVE NOTIFICATIONS - PREMIUM FOREX STYLE */}
        <div className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-green-900/30 to-blue-900/30 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-bold text-green-400">🔥 Live Stakes - Real-time Activity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
            {liveNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:border-green-500/50 transition-all
                  ${notif.state === 'entering' ? 'animate-slide-in-notification' : ''}
                  ${notif.state === 'exiting' ? 'animate-slide-out-notification' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{notif.country}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{notif.name}</p>
                    <p className="text-xs text-gray-400">{notif.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">${notif.amount}</span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                    {notif.days}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STAKE PLAN SELECTION */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { days: 30, apy: "34.8%", icon: "🥉" },
            { days: 60, apy: "81.7%", icon: "🥈" },
            { days: 90, apy: "143.3%", icon: "🥇" }
          ].map((plan) => (
            <div
              key={plan.days}
              onClick={() => setSelectedDays(plan.days)}
              className={`cursor-pointer p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105
                ${selectedDays === plan.days
                  ? "bg-gradient-to-br from-blue-600/40 to-purple-600/40 border-blue-400 shadow-2xl shadow-blue-500/50"
                  : "bg-white/5 border-white/20 hover:border-blue-400/50"
                }
                backdrop-blur-xl text-center group`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{plan.icon}</div>
              <p className="text-3xl font-bold mb-2">{plan.days} Days</p>
              <p className="text-lg text-green-400 font-bold mb-1">APY: {plan.apy}</p>
              <p className="text-sm opacity-70">Daily 1% Compounding</p>
              {selectedDays === plan.days && (
                <div className="mt-3 px-3 py-1 bg-blue-500 rounded-full text-xs font-bold inline-block">
                  SELECTED
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AMOUNT INPUT + STATS */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
            <label className="text-xl font-bold mb-3 block">💰 Enter Stake Amount</label>
            <input
              type="number"
              className="w-full p-4 rounded-xl text-white bg-white/10 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 outline-none text-xl font-bold transition-all"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {amount && Number(amount) > 0 && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-900/40 to-green-700/40 p-4 rounded-xl border border-green-500/30">
                    <p className="text-sm text-gray-300">Initial Amount</p>
                    <p className="text-2xl font-bold text-green-400">${amount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-700/40 p-4 rounded-xl border border-blue-500/30">
                    <p className="text-sm text-gray-300">Final Amount</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ${dailyData.length > 0 ? dailyData[dailyData.length - 1].total : 0}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-4 rounded-xl border border-purple-500/30">
                  <p className="text-sm text-gray-300">Total Profit</p>
                  <p className="text-3xl font-bold text-purple-400">
                    ${dailyData.length > 0 
                      ? (Number(dailyData[dailyData.length - 1].total) - Number(amount)).toFixed(2)
                      : 0}
                  </p>
                </div>

                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 p-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  🚀 Start Staking Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CHART */}
        {dailyData.length > 0 && (
          <div className="mt-12 max-w-6xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              📈 Growth Projection
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="url(#colorGradient)" 
                  strokeWidth={4}
                  dot={{ fill: '#4ade80', r: 4 }}
                />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* YOUR STAKES */}
        <div className="mt-16 max-w-6xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl">
          <h2 className="text-3xl mb-6 font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            💼 Your Active Stakes
          </h2>

          {stakes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No stakes yet. Start your first stake above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="p-4 text-left font-bold">Amount</th>
                    <th className="p-4 text-left font-bold">Start Date</th>
                    <th className="p-4 text-left font-bold">Unlock Date</th>
                    <th className="p-4 text-left font-bold">Profit</th>
                    <th className="p-4 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stakes.map((s: any) => (
                    <tr key={s._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-green-400">${s.amount}</td>
                      <td className="p-4">{new Date(s.startDate).toLocaleDateString()}</td>
                      <td className="p-4">{new Date(s.unlockDate).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-purple-400">${s.totalProfit || 0}</td>
                      <td className="p-4 text-center">
                        {s.status === "locked" ? (
                          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm font-bold">
                            🔒 Locked
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-bold">
                            ✅ Unlocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CONFIRM MODAL */}
        {confirmOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 rounded-3xl border-2 border-white/20 max-w-md w-full text-center shadow-2xl animate-scale-in">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold mb-6">Confirm Stake</h2>

              <div className="space-y-4 mb-8">
                <div className="bg-white/10 p-4 rounded-xl">
                  <p className="text-gray-400 text-sm">Amount</p>
                  <p className="text-3xl font-bold text-green-400">${amount}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl">
                  <p className="text-gray-400 text-sm">Lock Period</p>
                  <p className="text-2xl font-bold">{selectedDays} Days</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl">
                  <p className="text-gray-400 text-sm">Expected Return</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${dailyData.length > 0 ? dailyData[dailyData.length - 1].total : 0}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 p-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={createStake}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg"
                >
                  ✅ Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes slide-in-notification {
          0% {
            opacity: 0;
            transform: translateX(-30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slide-out-notification {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 22s ease-in-out infinite; }
        .animate-slide-in-notification { animation: slide-in-notification 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-out-notification { animation: slide-out-notification 0.3s cubic-bezier(0.7, 0, 0.84, 0); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}