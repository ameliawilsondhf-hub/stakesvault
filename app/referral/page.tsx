"use client";

import { useEffect, useState } from "react";

export default function ReferralPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setUser(data?.data);
        setLoading(false);
      });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    alert("Referral code copied!");
  };

  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">My Referral Network</h1>

      {/* REFERRAL CODE BOX */}
      <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 mb-6">
        <p className="text-gray-400 text-sm mb-1">Your Referral Code</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{user.referralCode}</span>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Copy
          </button>
        </div>
      </div>

      {/* REFERRAL COUNTS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <h2 className="text-xl font-bold">L1</h2>
          <p className="text-green-400 text-2xl">{user.level1?.length || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <h2 className="text-xl font-bold">L2</h2>
          <p className="text-blue-400 text-2xl">{user.level2?.length || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <h2 className="text-xl font-bold">L3</h2>
          <p className="text-purple-400 text-2xl">{user.level3?.length || 0}</p>
        </div>
      </div>

      {/* DOWNLINE LIST */}
      <h2 className="text-2xl font-bold mb-4">Downline Users</h2>

      <div className="space-y-4">
        {user.level1?.map((u: any) => (
          <div key={u._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-lg">{u.email}</p>
            <p className="text-sm text-gray-400">Level 1</p>
          </div>
        ))}

        {user.level2?.map((u: any) => (
          <div key={u._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-lg">{u.email}</p>
            <p className="text-sm text-blue-400">Level 2</p>
          </div>
        ))}

        {user.level3?.map((u: any) => (
          <div key={u._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-lg">{u.email}</p>
            <p className="text-sm text-purple-400">Level 3</p>
          </div>
        ))}
      </div>
    </div>
  );
}
