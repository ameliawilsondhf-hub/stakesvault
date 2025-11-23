"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  walletBalance: number;
  stakedBalance: number;
  totalDeposits: number;
  referralCode: string;
  createdAt: string;
  isAdmin: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  loginIPs?: Array<{
    ip: string;
    lastLogin: string;
    count: number;
  }>;
  registrationIP?: string;
  referralEarnings?: number;
  levelIncome?: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string);
    }
  }, [params.id]);

  const fetchUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      alert("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">❌ User not found</p>
          <Link href="/admin/users">
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white">
              ← Back to Users
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">👤 User Details</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
          <Link href="/admin/users">
            <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-white font-bold">
              ← Back to Users
            </button>
          </Link>
        </div>

        {/* Ban Alert */}
        {user.isBanned && (
          <div className="bg-red-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500 shadow-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🚫</span>
              <h2 className="text-2xl font-bold text-red-400">BANNED USER</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Ban Reason:</p>
                <p className="text-white text-lg font-semibold">{user.banReason || "No reason provided"}</p>
              </div>
              {user.bannedAt && (
                <div>
                  <p className="text-gray-400 text-sm">Banned At:</p>
                  <p className="text-white">{new Date(user.bannedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Name" value={user.name || "N/A"} />
            <InfoField label="Email" value={user.email} />
            <InfoField label="Referral Code" value={user.referralCode || "N/A"} />
            <InfoField label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoField label="Wallet Balance" value={`$${user.walletBalance?.toFixed(2) || "0.00"}`} color="green" />
            <InfoField label="Staked Balance" value={`$${user.stakedBalance?.toFixed(2) || "0.00"}`} color="purple" />
            <InfoField label="Total Deposits" value={`$${user.totalDeposits?.toFixed(2) || "0.00"}`} color="blue" />
            <InfoField label="Referral Earnings" value={`$${user.referralEarnings?.toFixed(2) || "0.00"}`} color="yellow" />
          </div>
        </div>

        {/* IP Address History */}
        {user.loginIPs && user.loginIPs.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🌐</span>
              <h2 className="text-2xl font-bold text-white">IP Address History</h2>
              <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-bold">
                {user.loginIPs.length} IPs
              </span>
            </div>
            
            <div className="space-y-3">
              {user.loginIPs
                .sort((a, b) => b.count - a.count)
                .map((ipData, idx) => (
                  <div key={idx} className="bg-white/5 p-5 rounded-xl flex justify-between items-center hover:bg-white/10 transition-all">
                    <div className="flex-1">
                      <p className="text-white font-mono text-lg font-bold">{ipData.ip}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Last login: {new Date(ipData.lastLogin).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-3xl">{ipData.count}</p>
                      <p className="text-gray-400 text-sm">logins</p>
                    </div>
                  </div>
                ))}
            </div>

            {user.registrationIP && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-gray-400 text-sm mb-2">🎯 Registration IP:</p>
                <p className="text-white font-mono text-lg font-bold">{user.registrationIP}</p>
              </div>
            )}
          </div>
        )}

        {/* No IP Data */}
        {(!user.loginIPs || user.loginIPs.length === 0) && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-6">
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">📍 No IP tracking data available</p>
              <p className="text-gray-500 text-sm mt-2">User needs to login again to track IP</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Info Field Component
 * Displays labeled information with optional color coding
 */
function InfoField({ label, value, color = "white" }: {
  label: string;
  value: string;
  color?: "white" | "green" | "purple" | "blue" | "yellow";
}) {
  const colors = {
    white: "text-white",
    green: "text-green-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}