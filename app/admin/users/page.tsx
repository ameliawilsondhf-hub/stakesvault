"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  password?: string;
  phone?: string;
  balance?: number;
  totalWithdrawals?: number;
  referredUsers?: string[];
  isVerified?: boolean;
  banReason?: string;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  
  // 🔥 NEW FIELDS - Add these
  securityAlerts?: Array<{
    type: string;
    message: string;
    severity: string;
    ip: string;
    location: string;
    device: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  
  loginStats?: {
    totalLogins: number;
    failedAttempts: number;
    lastFailedLogin?: string;
    uniqueDevices: number;
    uniqueLocations: number;
  };
  
  securityLogs?: Array<{
    type: string;
    ip: string;
    device: string;
    location: string;
    risk: number;
    date: string;
  }>;
  
  loginHistory?: Array<{
    ip: string;
    location: string;
    device: string;
      date: string;  // ✅ This is already correct

    browser: string;
    os: string;
    timestamp: string;
    suspicious: boolean;
  }>;
  
  devices?: Array<{
    name: string;
    deviceId: string;
    browser: string;
    os: string;
    lastUsed: string;
    firstSeen: string;
    trusted: boolean;
    ipAddress: string;
    location: string;
  }>;
  
  kycStatus?: string;
  kycDocuments?: string[];
  walletAddress?: string;
  transactions?: number;
  role?: string;
  bannedAt?: string;
}

export default function AllUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });

      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    setModalLoading(true);
    setShowUserModal(true);
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        credentials: "include",
      });

      const data = await res.json();

      console.log("API Response:", data); // Debug log

      if (data.success && data.user) {
        setSelectedUser(data.user);
      } else {
        alert("❌ " + (data.message || "User not found"));
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("❌ Failed to fetch user details");
      setShowUserModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? "unban" : "ban";
    
    if (!currentlyBanned) {
      const reason = prompt("⚠️ Enter ban reason (required):\n\nExamples:\n- Multiple accounts detected\n- Suspicious activity\n- Terms violation");
      
      if (!reason || reason.trim() === "") {
        alert("❌ Ban reason is required!");
        return;
      }

      if (!confirm(`Are you sure you want to ban this user?\n\nReason: ${reason}`)) {
        return;
      }

      setProcessingId(userId);

      try {
        const res = await fetch("/api/admin/users/ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId,
            ban: true,
            reason: reason.trim(),
          }),
        });

        const data = await res.json();

        if (data.success) {
          alert(`✅ ${data.message}`);
          
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user._id === userId 
                ? { ...user, isBanned: true } 
                : user
            )
          );
          
        } else {
          alert(`❌ ${data.message || "Failed to ban user"}`);
        }
      } catch (error) {
        console.error("❌ Ban error:", error);
        alert("❌ Network error. Please try again.");
      } finally {
        setProcessingId(null);
      }

    } else {
      if (!confirm("Are you sure you want to unban this user?")) {
        return;
      }

      setProcessingId(userId);

      try {
        const res = await fetch("/api/admin/users/ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId,
            ban: false,
            reason: "",
          }),
        });

        const data = await res.json();

        if (data.success) {
          alert(`✅ ${data.message}`);
          
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user._id === userId 
                ? { ...user, isBanned: false } 
                : user
            )
          );
          
        } else {
          alert(`❌ ${data.message || "Failed to unban user"}`);
        }
      } catch (error) {
        console.error("❌ Unban error:", error);
        alert("❌ Network error. Please try again.");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">👥 All Users</h1>
            <p className="text-gray-400">Total: {users.length} users</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/users/duplicates">
              <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-bold flex items-center gap-2">
                <span>🔍</span>
                Check Duplicates
              </button>
            </Link>
            <Link href="/admin">
              <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-white font-bold">
                ← Back to Admin
              </button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border ${
                user.isBanned ? 'border-red-500' : 'border-white/20'
              } shadow-xl hover:bg-white/20 transition-all`}
            >
              <div className="flex items-center justify-between">
                
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{user.email}</h3>
                    {user.isAdmin && (
                      <span className="bg-yellow-500 px-3 py-1 rounded-full text-xs font-bold text-black">
                        ADMIN
                      </span>
                    )}
                    {user.isBanned && (
                      <span className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold text-white">
                        BANNED
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Name:</p>
                      <p className="text-white font-semibold">{user.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Wallet:</p>
                      <p className="text-green-400 font-semibold">${user.walletBalance?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Deposits:</p>
                      <p className="text-blue-400 font-semibold">${user.totalDeposits?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Referral Code:</p>
                      <p className="text-purple-400 font-semibold">{user.referralCode || "N/A"}</p>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs mt-2">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewUser(user._id)}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-bold transition-all"
                  >
                    View
                  </button>
                  
                  {!user.isAdmin && (
                    <button
                      onClick={() => handleBanUser(user._id, user.isBanned || false)}
                      disabled={processingId === user._id}
                      className={`px-6 py-3 rounded-lg font-bold transition-all ${
                        user.isBanned
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white ${processingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {processingId === user._id ? '...' : user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No users found</p>
          </div>
        )}

      </div>

      {/* USER DETAILS MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1119] rounded-2xl shadow-2xl w-full max-w-5xl my-8">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Complete User Details</h2>
                  <p className="text-blue-100 text-sm mt-1">Full account information and activity</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setActiveTab("overview");
                    setShowPassword(false);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {modalLoading ? (
              <div className="p-20 text-center">
                <div className="text-gray-400 text-xl">Loading user details...</div>
              </div>
            ) : selectedUser ? (
              <>
                {/* Tabs */}
                <div className="border-b dark:border-gray-800 bg-gray-50 dark:bg-[#0a0e14] px-6">
                  <div className="flex gap-2 overflow-x-auto">
                    {["overview", "security", "activity", "financial", "technical"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-semibold capitalize whitespace-nowrap transition-all ${
                          activeTab === tab
                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  
                  {/* OVERVIEW TAB */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className="flex items-center gap-4 pb-6 border-b dark:border-gray-800">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                          {selectedUser.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedUser.name || "N/A"}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedUser.isVerified 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {selectedUser.isVerified ? '✓ Verified' : '✗ Not Verified'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedUser.isBanned 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {selectedUser.isBanned ? '🚫 Banned' : '✓ Active'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {(selectedUser.role || 'user').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-400 mb-1">Wallet Balance</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${(selectedUser.walletBalance || selectedUser.balance || 0).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Deposits</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${(selectedUser.totalDeposits || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                          <p className="text-sm text-purple-700 dark:text-purple-400 mb-1">Referrals</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {selectedUser.referredUsers?.length || 0}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-400 mb-1">Transactions</p>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {selectedUser.transactions || 0}
                          </p>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Basic Information</h4>
                        
                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">User ID</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-900 dark:text-white">
                              {selectedUser._id}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(selectedUser._id)}
                              className="text-blue-600 hover:text-blue-700 text-xs"
                            >
                              📋
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">Email</span>
                          <span className="text-gray-900 dark:text-white">{selectedUser.email}</span>
                        </div>

                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">Phone</span>
                          <span className="text-gray-900 dark:text-white">{selectedUser.phone || "Not provided"}</span>
                        </div>

                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">Referral Code</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {selectedUser.referralCode || "N/A"}
                            </span>
                            {selectedUser.referralCode && (
                              <button 
                                onClick={() => copyToClipboard(selectedUser.referralCode!)}
                                className="text-blue-600 hover:text-blue-700 text-xs"
                              >
                                📋
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">Joined</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between py-3 border-b dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400">KYC Status</span>
                          <span className={`font-semibold ${
                            selectedUser.kycStatus === 'verified'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {(selectedUser.kycStatus || 'pending').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Ban Info */}
                      {selectedUser.isBanned && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Ban Details</h4>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            <strong>Reason:</strong> {selectedUser.banReason || "No reason provided"}
                          </p>
                          {selectedUser.bannedAt && (
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                              <strong>Banned on:</strong> {new Date(selectedUser.bannedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECURITY TAB */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Security Information</h4>

                      {/* Security Alerts */}
                      {selectedUser.securityAlerts && selectedUser.securityAlerts.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                          <h5 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                            <span>⚠️</span>
                            Security Alerts ({selectedUser.securityAlerts.filter((a: any) => !a.acknowledged).length} unread)
                          </h5>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedUser.securityAlerts.slice(0, 10).map((alert: any, index: number) => (
                              <div key={index} className={`p-3 rounded-lg border ${
                                alert.acknowledged 
                                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                                  : 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                              }`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className={`font-semibold text-sm ${
                                      alert.acknowledged 
                                        ? 'text-gray-700 dark:text-gray-400' 
                                        : 'text-red-700 dark:text-red-400'
                                    }`}>
                                      {alert.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      {alert.location} • {alert.ip} • {new Date(alert.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    alert.severity === 'high' ? 'bg-red-600 text-white' :
                                    alert.severity === 'medium' ? 'bg-orange-500 text-white' :
                                    'bg-yellow-500 text-white'
                                  }`}>
                                    {alert.severity.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Login Statistics */}
                      {selectedUser.loginStats && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
                          <h5 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">📊 Login Statistics</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Total Logins</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedUser.loginStats.totalLogins || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Unique Devices</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedUser.loginStats.uniqueDevices || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Unique Locations</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedUser.loginStats.uniqueLocations || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Failed Attempts</p>
                              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {selectedUser.loginStats.failedAttempts || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Password */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Password Hash</span>
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg font-mono text-xs break-all">
                          {showPassword ? (selectedUser.password || "Not available") : "••••••••••••••••••••••••••••"}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          ⚠️ This is a bcrypt hashed password (encrypted)
                        </p>
                      </div>

                      {/* 2FA Status */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Extra layer of security for account
                            </p>
                          </div>
                          <span className={`px-4 py-2 rounded-lg font-semibold ${
                            selectedUser.twoFactorEnabled
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {selectedUser.twoFactorEnabled ? "Enabled ✓" : "Disabled ✗"}
                          </span>
                        </div>
                      </div>

                      {/* Trusted Devices */}
                      {selectedUser.devices && selectedUser.devices.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Trusted Devices ({selectedUser.devices.length})</h5>
                          <div className="space-y-2">
                            {selectedUser.devices.map((device: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className="text-2xl">
                                      {device.os?.includes("iOS") || device.os?.includes("iPhone") ? "📱" : 
                                       device.os?.includes("Android") ? "📱" :
                                       device.os?.includes("Windows") ? "💻" : 
                                       device.os?.includes("Mac") ? "🖥️" : "🖥️"}
                                    </span>
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 dark:text-white">{device.name}</p>
                                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">Browser</p>
                                          <p className="text-gray-900 dark:text-white font-semibold">{device.browser || "N/A"}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">OS</p>
                                          <p className="text-gray-900 dark:text-white font-semibold">{device.os || "N/A"}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">IP Address</p>
                                          <p className="text-gray-900 dark:text-white font-mono">{device.ipAddress || "N/A"}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 dark:text-gray-400">Location</p>
                                          <p className="text-gray-900 dark:text-white">{device.location || "N/A"}</p>
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Last used: {new Date(device.lastUsed).toLocaleString()}
                                      </p>
                                      {device.firstSeen && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          First seen: {new Date(device.firstSeen).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    device.trusted
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    {device.trusted ? "Trusted" : "Untrusted"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Security Logs */}
                      {selectedUser.securityLogs && selectedUser.securityLogs.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">🔐 Security Logs</h5>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedUser.securityLogs.slice(0, 10).map((log: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{log.type}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {log.device} • {log.ip} • {log.location}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(log.date).toLocaleString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    log.risk >= 3 ? 'bg-red-600 text-white' :
                                    log.risk === 2 ? 'bg-orange-500 text-white' :
                                    'bg-yellow-500 text-white'
                                  }`}>
                                    Risk: {log.risk}/3
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KYC Documents */}
                      {selectedUser.kycDocuments && selectedUser.kycDocuments.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">KYC Documents</h5>
                          <div className="space-y-2">
                            {selectedUser.kycDocuments.map((doc: string, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">📄</span>
                                  <span className="text-sm text-gray-900 dark:text-white">{doc}</span>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIVITY TAB */}
                  {activeTab === "activity" && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Activity & Login History</h4>

                      {/* Current Location */}
                      {selectedUser.ipAddress && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🌍</span>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">Current Location</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Last known IP and location</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">IP Address</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                  {selectedUser.ipAddress}
                                </p>
                                <button 
                                  onClick={() => copyToClipboard(selectedUser.ipAddress!)}
                                  className="text-blue-600 hover:text-blue-700 text-xs"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Location</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedUser.city && selectedUser.country 
                                  ? `${selectedUser.city}, ${selectedUser.country}`
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Last Login */}
                      {selectedUser.lastLogin && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Login</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {new Date(selectedUser.lastLogin).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Login History */}
                      {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                        <div>
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Login History</h5>
                          <div className="space-y-2">
                            {selectedUser.loginHistory.map((login, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">🔐</span>
                                    <div>
                                      <p className="font-semibold text-gray-900 dark:text-white">{login.device}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {login.location}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="font-mono text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                                          {login.ip}
                                        </span>
                                        <button 
                                          onClick={() => copyToClipboard(login.ip)}
                                          className="text-blue-600 hover:text-blue-700 text-xs"
                                        >
                                          📋
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(login.date).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                          No login history available
                        </div>
                      )}
                    </div>
                  )}

                  {/* FINANCIAL TAB */}
                  {activeTab === "financial" && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Financial Information</h4>

                      {/* Balances */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-400 mb-2">💰 Current Balance</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ${(selectedUser.walletBalance || selectedUser.balance || 0).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">📥 Total Deposits</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            ${(selectedUser.totalDeposits || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">📤 Total Withdrawals</p>
                          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            ${(selectedUser.totalWithdrawals || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Wallet Address */}
                      {selectedUser.walletAddress && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Crypto Wallet Address</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white break-all">
                              {selectedUser.walletAddress}
                            </p>
                            <button 
                              onClick={() => copyToClipboard(selectedUser.walletAddress!)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Transaction Stats */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                              {selectedUser.transactions || 0}
                            </p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                            View All Transactions
                          </button>
                        </div>
                      </div>

                      {/* Referral Earnings */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-purple-700 dark:text-purple-400 mb-2">🎁 Referral Information</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Referral Code</p>
                            <p className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {selectedUser.referralCode || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Referrals</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {selectedUser.referredUsers?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TECHNICAL TAB */}
                  {activeTab === "technical" && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Technical Details</h4>

                      {/* System Info */}
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Database ID</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {selectedUser._id}
                            </p>
                            <button 
                              onClick={() => copyToClipboard(selectedUser._id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              📋
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Created</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedUser.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ({Math.floor((Date.now() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role & Permissions</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {(selectedUser.role || 'user').toUpperCase()}
                            </span>
                            {selectedUser.isAdmin && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Status</p>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedUser.isVerified
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {selectedUser.isVerified ? "VERIFIED" : "UNVERIFIED"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedUser.isBanned
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {selectedUser.isBanned ? "BANNED" : "ACTIVE"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Staked Balance</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${(selectedUser.stakedBalance || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-b-2xl flex gap-3">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                      setActiveTab("overview");
                      setShowPassword(false);
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-xl font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-20 text-center">
                <div className="text-gray-400 text-xl">User not found</div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}