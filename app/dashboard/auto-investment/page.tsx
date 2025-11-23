"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AutoInvestPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    lockPeriod: 30,
    minAmount: 100,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/auto-invest/get");
      const result = await res.json();
      if (result.success) {
        setSettings(result.data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/auto-invest/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      const result = await res.json();

      if (result.success) {
        alert("✅ Settings saved successfully!");
      } else {
        alert("❌ Error: " + (result.message || "Failed to save settings"));
      }
    } catch (error) {
      alert("❌ Network error. Please try again.");
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] flex items-center justify-center">
        <div className="text-white text-2xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🔄 Auto Investment Settings
          </h1>
          <p className="text-gray-400">Automatically reinvest your unlocked stakes</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          
          {/* Enable/Disable Toggle */}
          <div className="mb-8 pb-8 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Enable Auto Investment</h2>
                <p className="text-gray-400">
                  Automatically create a new stake when your current stake unlocks
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative w-20 h-10 rounded-full transition-all ${
                  settings.enabled ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full transition-transform ${
                    settings.enabled ? "transform translate-x-10" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Settings (only show if enabled) */}
          {settings.enabled && (
            <div className="space-y-6">
              
              {/* Lock Period */}
              <div>
                <label className="block text-lg font-bold mb-3">
                  Lock Period (Days)
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Choose how long to lock your auto-reinvested stakes
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setSettings({ ...settings, lockPeriod: days })}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        settings.lockPeriod === days
                          ? "bg-blue-600 text-white border-2 border-blue-400"
                          : "bg-white/5 text-gray-300 border-2 border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-3xl mb-2">
                        {days === 30 ? "🥉" : days === 60 ? "🥈" : "🥇"}
                      </div>
                      <div className="text-xl">{days} Days</div>
                      <div className="text-sm text-gray-400 mt-1">
                        APY: {((Math.pow(1.01, days) - 1) * 100).toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Amount */}
              <div>
                <label className="block text-lg font-bold mb-3">
                  Minimum Amount ($)
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Only auto-invest if unlocked stake amount is at least this value
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settings.minAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value === '') {
                      setSettings({ ...settings, minAmount: 0 });
                    } else {
                      setSettings({ ...settings, minAmount: Number(value) });
                    }
                  }}
                  onBlur={() => {
                    if (settings.minAmount < 10) {
                      setSettings({ ...settings, minAmount: 10 });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white text-xl font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Minimum: $10
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">ℹ️</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">How it works:</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• When your stake unlocks, it will automatically create a new stake</li>
                      <li>• The new stake uses the settings you configured above</li>
                      <li>• Original amount + earned rewards will be reinvested</li>
                      <li>• You can disable this feature anytime</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Disabled State Info */}
          {!settings.enabled && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <p className="text-6xl mb-4">💤</p>
              <p className="text-gray-400 text-lg">
                Auto Investment is currently disabled. Enable it to automatically reinvest your unlocked stakes.
              </p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={updateSettings}
            disabled={saving}
            className={`mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              saving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-2xl"
            }`}
          >
            {saving ? "Saving..." : "💾 Save Settings"}
          </button>

        </div>

        {/* Current Stakes Info */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4">📊 Your Stakes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Link href="/dashboard/stake">
              <button className="w-full p-4 bg-white/10 rounded-lg hover:bg-white/20 transition text-left">
                <span className="block text-gray-400 mb-1">Active Stakes</span>
                <span className="text-2xl font-bold">View →</span>
              </button>
            </Link>
            <Link href="/dashboard/stake-history">
              <button className="w-full p-4 bg-white/10 rounded-lg hover:bg-white/20 transition text-left">
                <span className="block text-gray-400 mb-1">Stake History</span>
                <span className="text-2xl font-bold">View →</span>
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}