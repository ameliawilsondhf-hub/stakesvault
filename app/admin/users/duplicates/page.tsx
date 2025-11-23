"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DuplicateIP {
  ip: string;
  userCount: number;
  users: Array<{
    userId: string;
    name: string;
    email: string;
    loginCount: number;
    lastLogin: string;
  }>;
}

export default function DuplicateUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateIP[]>([]);
  const [totalChecked, setTotalChecked] = useState(0);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    try {
      console.log("🔍 Fetching duplicate IPs...");
      
      const res = await fetch("/api/admin/users/check-duplicates", {
        credentials: "include",
      });

      const data = await res.json();
      
      if (data.success) {
        setDuplicates(data.duplicates);
        setTotalChecked(data.totalUsersChecked);
        console.log(`✅ Found ${data.duplicates.length} duplicate IPs`);
      } else {
        alert(data.message || "Failed to check duplicates");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to load duplicate data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-2xl">Scanning for duplicates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🔍 Duplicate IP Detection
            </h1>
            <p className="text-gray-400">
              Scanned {totalChecked} users • Found {duplicates.length} suspicious IPs
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDuplicates}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-bold"
            >
              🔄 Refresh
            </button>
            <Link href="/admin/users">
              <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-white font-bold">
                ← Back
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        {duplicates.length > 0 && (
          <div className="bg-red-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">⚠️</span>
              <div>
                <h2 className="text-2xl font-bold text-red-400">
                  {duplicates.reduce((sum, d) => sum + d.userCount, 0)} Potential Duplicate Accounts Detected
                </h2>
                <p className="text-gray-300 mt-1">
                  Multiple accounts sharing the same IP addresses
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate IPs List */}
        <div className="space-y-6">
          {duplicates.map((dup, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500/50 shadow-2xl hover:border-red-500 transition-all"
            >
              {/* IP Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/20">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🌐</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white font-mono">
                      {dup.ip}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Shared by {dup.userCount} accounts
                    </p>
                  </div>
                </div>
                <span className="bg-red-500 px-5 py-2 rounded-full text-white font-bold text-lg">
                  {dup.userCount} Users
                </span>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dup.users.map((user, userIdx) => (
                  <div
                    key={userIdx}
                    className="bg-white/5 p-5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg">{user.email}</p>
                        <p className="text-gray-400 text-sm">{user.name || "No name"}</p>
                      </div>
                      <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-bold text-white">
                        #{userIdx + 1}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-400 font-bold text-lg">
                          {user.loginCount} logins
                        </p>
                        <p className="text-gray-500 text-xs">
                          Last: {new Date(user.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/admin/users/${user.userId}`}>
                        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-bold">
                          View →
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* No Duplicates Found */}
        {duplicates.length === 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">
              No Duplicate IPs Found!
            </h2>
            <p className="text-gray-400 text-lg">
              All {totalChecked} users have unique IP addresses
            </p>
          </div>
        )}

      </div>
    </div>
  );
}