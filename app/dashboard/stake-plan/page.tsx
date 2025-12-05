"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      let name, attempts = 0;
      do {
        name = NAMES[Math.floor(Math.random() * NAMES.length)];
        attempts++;
      } while (usedNames.has(name) && attempts < 10);
      
      if (usedNames.size > 25) usedNames.clear();
      usedNames.add(name);
      
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const amount = [100, 250, 500, 750, 1000, 1500, 2500, 3500, 5000][Math.floor(Math.random() * 9)];
      const days = [30, 60, 90, 180, 365][Math.floor(Math.random() * 5)];
      
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

      setTimeout(() => {
        setLiveNotifications(prev => 
          prev.map(n => n.id === newNotif.id ? { ...n, state: 'exiting' } : n)
        );
      }, 2500);

      setTimeout(() => {
        setLiveNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 2700);
    };

    setTimeout(() => generateNotification(), 500);
    setTimeout(() => generateNotification(), 1500);
    setTimeout(() => generateNotification(), 2500);
    
    const interval = setInterval(() => {
      generateNotification();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user stakes
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
          setStakes([]);
        }
      } catch (error) {
        setStakes([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    };

    fetchStakes();

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Generate daily preview with SIMPLE INTEREST
  const calculatePreview = () => {
    if (!amount || Number(amount) <= 0) return [];
    let arr = [];
    const principal = Number(amount);
    const dailyRate = 0.01;

    for (let day = 1; day <= selectedDays; day++) {
      const totalProfit = principal * dailyRate * day;
      const total = principal + totalProfit;
      
      arr.push({
        day,
        profit: totalProfit.toFixed(2),
        total: total.toFixed(2),
      });
    }
    return arr;
  };

  useEffect(() => {
    setDailyData(calculatePreview());
  }, [amount, selectedDays]);

  // Create stake
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
          <div className="text-white text-xl md:text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  const allPlans = [
    { days: 30, gain: "30%", icon: "🥉", category: "Short-term" },
    { days: 60, gain: "60%", icon: "🥈", category: "Short-term" },
    { days: 90, gain: "90%", icon: "🥇", category: "Short-term" },
    { days: 120, gain: "120%", icon: "💎", category: "Medium-term" },
    { days: 180, gain: "180%", icon: "💠", category: "Medium-term" },
    { days: 270, gain: "270%", icon: "⭐", category: "Medium-term" },
    { days: 365, gain: "365%", icon: "🏆", category: "1 Year", badge: "1Y" },
    { days: 730, gain: "730%", icon: "👑", category: "2 Years", badge: "2Y" },
    { days: 1095, gain: "1,095%", icon: "💰", category: "3 Years", badge: "3Y" },
    { days: 1460, gain: "1,460%", icon: "🚀", category: "4 Years", badge: "4Y" },
    { days: 1825, gain: "1,825%", icon: "🌟", category: "5 Years", badge: "5Y" },
  ];

  return (
    <div className="min-h-screen px-3 py-4 md:p-6 text-white bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] relative overflow-hidden">
      
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-500/10 rounded-full blur-3xl -top-32 md:-top-48 -left-32 md:-left-48 animate-float"></div>
        <div className="absolute w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-purple-500/10 rounded-full blur-3xl top-1/2 -right-32 md:-right-48 animate-float-slow"></div>
        <div className="absolute w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-pink-500/10 rounded-full blur-3xl -bottom-32 md:-bottom-48 left-1/4 md:left-1/3 animate-float-reverse"></div>
      </div>

      <div className="relative z-10 pb-32">
        
        {/* BACK BUTTON - Mobile Optimized */}
        <div className="max-w-6xl mx-auto mb-4 md:mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg md:rounded-xl text-white transition-all hover:scale-105 shadow-lg backdrop-blur-xl text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Back</span>
          </button>
        </div>
        
        {/* HEADER - Mobile Optimized */}
        <div className="text-center mb-8 md:mb-12 px-2">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 md:mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            💎 Premium Stake Plans
          </h1>
          <p className="text-gray-400 text-sm md:text-lg">Grow your wealth with 1% daily returns</p>
          <p className="text-yellow-400 text-xs md:text-sm mt-1 md:mt-2">✨ Up to 5 Years - Maximum Returns!</p>
        </div>

        {/* ✅ SECURITY & FEATURES - Professional Trust Indicators */}
        <div className="max-w-6xl mx-auto mb-6 md:mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 backdrop-blur-xl border border-green-500/30 rounded-lg md:rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">🔒</div>
              <div className="text-xs md:text-sm font-bold text-green-400">SSL Secured</div>
              <div className="text-[10px] md:text-xs text-gray-400">Bank-level Encryption</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 backdrop-blur-xl border border-blue-500/30 rounded-lg md:rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">⚡</div>
              <div className="text-xs md:text-sm font-bold text-blue-400">Instant</div>
              <div className="text-[10px] md:text-xs text-gray-400">Fast Withdrawals</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 backdrop-blur-xl border border-purple-500/30 rounded-lg md:rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">💎</div>
              <div className="text-xs md:text-sm font-bold text-purple-400">Reliable</div>
              <div className="text-[10px] md:text-xs text-gray-400">24/7 Support</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-700/30 backdrop-blur-xl border border-yellow-500/30 rounded-lg md:rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">🎁</div>
              <div className="text-xs md:text-sm font-bold text-yellow-400">Rewards</div>
              <div className="text-[10px] md:text-xs text-gray-400">Referral Bonuses</div>
            </div>
          </div>
        </div>

        {/* STAKE PLANS - Mobile Optimized */}
        <div className="max-w-7xl mx-auto mb-6 md:mb-10">
          
          {/* Short-term Plans */}
          <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-blue-400 px-2">⚡ Short-term (1-3 months)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8 px-2">
            {allPlans.slice(0, 3).map((plan) => (
              <div
                key={plan.days}
                onClick={() => setSelectedDays(plan.days)}
                className={`cursor-pointer p-4 md:p-8 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 hover:scale-105
                  ${selectedDays === plan.days
                    ? "bg-gradient-to-br from-blue-600/40 to-purple-600/40 border-blue-400 shadow-2xl shadow-blue-500/50"
                    : "bg-white/5 border-white/20 hover:border-blue-400/50"
                  }
                  backdrop-blur-xl text-center group`}
              >
                <div className="text-3xl md:text-5xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">{plan.icon}</div>
                <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{plan.days} Days</p>
                <p className="text-sm md:text-lg text-green-400 font-bold mb-1">Gain: {plan.gain}</p>
                <p className="text-xs md:text-sm opacity-70">1% Daily (Simple)</p>
                {selectedDays === plan.days && (
                  <div className="mt-2 md:mt-3 px-2 md:px-3 py-1 bg-blue-500 rounded-full text-[10px] md:text-xs font-bold inline-block">
                    SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Medium-term Plans */}
          <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-purple-400 px-2">💎 Medium-term (4-9 months)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8 px-2">
            {allPlans.slice(3, 6).map((plan) => (
              <div
                key={plan.days}
                onClick={() => setSelectedDays(plan.days)}
                className={`cursor-pointer p-4 md:p-8 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 hover:scale-105
                  ${selectedDays === plan.days
                    ? "bg-gradient-to-br from-purple-600/40 to-pink-600/40 border-purple-400 shadow-2xl shadow-purple-500/50"
                    : "bg-white/5 border-white/20 hover:border-purple-400/50"
                  }
                  backdrop-blur-xl text-center group`}
              >
                <div className="text-3xl md:text-5xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">{plan.icon}</div>
                <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{plan.days} Days</p>
                <p className="text-sm md:text-lg text-green-400 font-bold mb-1">Gain: {plan.gain}</p>
                <p className="text-xs md:text-sm opacity-70">1% Daily (Simple)</p>
                {selectedDays === plan.days && (
                  <div className="mt-2 md:mt-3 px-2 md:px-3 py-1 bg-purple-500 rounded-full text-[10px] md:text-xs font-bold inline-block">
                    SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Long-term Plans */}
          <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-yellow-400 px-2">🌟 Long-term (1-5 Years)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6 mb-6 md:mb-8 px-2">
            {allPlans.slice(6).map((plan) => (
              <div
                key={plan.days}
                onClick={() => setSelectedDays(plan.days)}
                className={`cursor-pointer p-3 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 hover:scale-105
                  ${selectedDays === plan.days
                    ? "bg-gradient-to-br from-yellow-600/40 to-orange-600/40 border-yellow-400 shadow-2xl shadow-yellow-500/50"
                    : "bg-white/5 border-white/20 hover:border-yellow-400/50"
                  }
                  backdrop-blur-xl text-center group relative`}
              >
                {plan.badge && (
                  <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div className="text-2xl md:text-4xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">{plan.icon}</div>
                <p className="text-sm md:text-xl font-bold mb-1">{plan.category}</p>
                <p className="text-[10px] md:text-sm text-gray-400 mb-1 md:mb-2">{plan.days} Days</p>
                <p className="text-xs md:text-lg text-green-400 font-bold mb-1">+{plan.gain}</p>
                <p className="text-[10px] md:text-xs opacity-70">1% Daily</p>
                {selectedDays === plan.days && (
                  <div className="mt-2 md:mt-3 px-2 md:px-3 py-0.5 md:py-1 bg-yellow-500 rounded-full text-[10px] md:text-xs font-bold inline-block">
                    SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AMOUNT INPUT - Mobile Optimized */}
        <div className="max-w-2xl mx-auto px-2 mb-6 md:mb-10">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-4 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-xl shadow-2xl">
            <label className="text-base md:text-xl font-bold mb-2 md:mb-3 block">💰 Enter Stake Amount</label>
            <input
              type="number"
              className="w-full p-3 md:p-4 rounded-xl text-white bg-white/10 border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 outline-none text-lg md:text-xl font-bold transition-all"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {amount && Number(amount) > 0 && (
              <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-gradient-to-br from-green-900/40 to-green-700/40 p-3 md:p-4 rounded-xl border border-green-500/30">
                    <p className="text-xs md:text-sm text-gray-300">Initial Amount</p>
                    <p className="text-lg md:text-2xl font-bold text-green-400">${amount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-700/40 p-3 md:p-4 rounded-xl border border-blue-500/30">
                    <p className="text-xs md:text-sm text-gray-300">Final Amount</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-400">
                      ${dailyData.length > 0 ? dailyData[dailyData.length - 1].total : 0}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-3 md:p-4 rounded-xl border border-purple-500/30">
                  <p className="text-xs md:text-sm text-gray-300">Total Profit (Simple Interest)</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-400">
                    ${dailyData.length > 0 
                      ? (Number(dailyData[dailyData.length - 1].total) - Number(amount)).toFixed(2)
                      : 0}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                    {selectedDays} days × 1% daily = {selectedDays}% total gain
                  </p>
                </div>

                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 p-3 md:p-4 rounded-xl text-white font-bold text-base md:text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  🚀 Start Staking Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ KEY FEATURES - Honest Benefits */}
        <div className="max-w-6xl mx-auto mb-6 md:mb-10 px-2">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-4 md:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Why StakeVault?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 backdrop-blur-xl border border-green-500/30 rounded-xl md:rounded-2xl p-3 md:p-6 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-4xl mb-1 md:mb-3">🔒</div>
              <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-green-400">Secure</h3>
              <p className="text-[10px] md:text-sm text-gray-400">Advanced encryption</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 backdrop-blur-xl border border-blue-500/30 rounded-xl md:rounded-2xl p-3 md:p-6 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-4xl mb-1 md:mb-3">⚡</div>
              <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-blue-400">Fast</h3>
              <p className="text-[10px] md:text-sm text-gray-400">Quick processing</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 backdrop-blur-xl border border-purple-500/30 rounded-xl md:rounded-2xl p-3 md:p-6 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-4xl mb-1 md:mb-3">💡</div>
              <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-purple-400">Simple</h3>
              <p className="text-[10px] md:text-sm text-gray-400">Easy to use</p>
            </div>
            
            <div className="bg-gradient-to-br from-pink-900/30 to-pink-700/30 backdrop-blur-xl border border-pink-500/30 rounded-xl md:rounded-2xl p-3 md:p-6 text-center hover:scale-105 transition-all">
              <div className="text-2xl md:text-4xl mb-1 md:mb-3">🎁</div>
              <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-pink-400">Rewards</h3>
              <p className="text-[10px] md:text-sm text-gray-400">Referral program</p>
            </div>
          </div>
        </div>

      </div>

      {/* ✅ LIVE ACTIVITY - PROFESSIONAL DESIGN (Bottom Right Corner) */}
      <div className="fixed bottom-3 right-3 md:bottom-4 md:right-4 z-50 w-[260px] md:w-[300px]">
        <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-xs md:text-sm font-bold text-white">Live Activity</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Real-time</span>
            </div>
          </div>
          
          {/* Activity List */}
          <div className="max-h-[280px] md:max-h-[350px] overflow-y-auto custom-scrollbar">
            {liveNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs">
                <div className="mb-2">📊</div>
                <div>Waiting for activity...</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30">
                {liveNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 transition-all hover:bg-white/5
                      ${notif.state === 'entering' ? 'animate-slide-in-notification' : ''}
                      ${notif.state === 'exiting' ? 'animate-slide-out-notification opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {/* Flag */}
                      <div className="flex-shrink-0 text-lg md:text-xl mt-0.5">
                        {notif.country}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {notif.name}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-green-400">
                              ${notif.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-500">staked</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-medium">
                            {notif.days}d
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL - Mobile Optimized */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 md:p-10 rounded-2xl md:rounded-3xl border-2 border-white/20 max-w-md w-full text-center shadow-2xl animate-scale-in">
            <div className="text-4xl md:text-6xl mb-3 md:mb-4">🎯</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Confirm Stake</h2>

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="bg-white/10 p-3 md:p-4 rounded-xl">
                <p className="text-gray-400 text-xs md:text-sm">Amount</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">${amount}</p>
              </div>
              <div className="bg-white/10 p-3 md:p-4 rounded-xl">
                <p className="text-gray-400 text-xs md:text-sm">Lock Period</p>
                <p className="text-xl md:text-2xl font-bold">{selectedDays} Days</p>
                {selectedDays >= 365 && (
                  <p className="text-xs md:text-sm text-yellow-400 mt-1">
                    ({(selectedDays / 365).toFixed(1)} Year{selectedDays >= 730 ? 's' : ''})
                  </p>
                )}
              </div>
              <div className="bg-white/10 p-3 md:p-4 rounded-xl">
                <p className="text-gray-400 text-xs md:text-sm">Expected Return</p>
                <p className="text-xl md:text-2xl font-bold text-purple-400">
                  ${dailyData.length > 0 ? dailyData[dailyData.length - 1].total : 0}
                </p>
                <p className="text-[10px] md:text-xs text-gray-400 mt-1">
                  +{selectedDays}% gain (Simple Interest)
                </p>
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 bg-red-600 hover:bg-red-700 p-3 md:p-4 rounded-xl font-bold text-sm md:text-lg transition-all hover:scale-105"
              >
                ❌ Cancel
              </button>
              <button
                onClick={createStake}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 p-3 md:p-4 rounded-xl font-bold text-sm md:text-lg transition-all hover:scale-105 shadow-lg"
              >
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
            transform: translateX(30px) scale(0.95);
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

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.7);
        }
      `}</style>
    </div>
  );
}