"use client";

import { useState, useEffect } from "react";

interface LoginHistoryItem {
  ip: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  timestamp: string;
  suspicious: boolean;
}

interface Device {
  name: string;
  deviceId: string;
  browser: string;
  os: string;
  lastUsed: string;
  firstSeen: string;
  trusted: boolean;
  ipAddress: string;
  location: string;
}

interface SecurityAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  ip: string;
  location: string;
  device: string;
  timestamp: string;
  acknowledged: boolean;
  _id?: string;
}

interface SecurityData {
  currentIP: string;
  currentLocation: string;
  lastLogin: string;
  registrationIP: string;
  registrationLocation: string;
  accountCreated: string;
  previousIP: string | null;
  previousLocation: string | null;
  loginStats: {
    totalLogins: number;
    uniqueDevices: number;
    uniqueLocations: number;
    failedAttempts: number;
  };
  loginHistory: LoginHistoryItem[];
  devices: Device[];
  trustedDevices: Device[];
  unverifiedDevices: Device[];
  securityAlerts: SecurityAlert[];
  unacknowledgedAlerts: number;
  riskAnalysis: {
    hasMultipleDevices: boolean;
    hasLocationChanges: boolean;
    hasIPChanges: boolean;
    hasUnverifiedDevices: boolean;
    recentSuspiciousActivity: boolean;
    highRiskAlerts: number;
  };
}

export default function SecurityDashboard() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'devices' | 'alerts'>('overview');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const res = await fetch('/api/user/security-info');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const trustDevice = async (deviceId: string) => {
    try {
      const res = await fetch('/api/user/security-info', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action: 'trust' })
      });
      if (res.ok) {
        fetchSecurityData();
        alert('Device trusted successfully!');
      }
    } catch (error) {
      console.error('Error trusting device:', error);
    }
  };

  const removeDevice = async (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      try {
        const res = await fetch('/api/user/security-info', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, action: 'remove' })
        });
        if (res.ok) {
          fetchSecurityData();
          alert('Device removed successfully!');
        }
      } catch (error) {
        console.error('Error removing device:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading security data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load security data</div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-gray-400">Monitor your account security and login activity</p>
        </div>

        {/* Risk Alerts */}
        {(data.riskAnalysis.highRiskAlerts > 0 || data.riskAnalysis.recentSuspiciousActivity) && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-red-400 font-bold text-lg">Security Warning</h3>
                <p className="text-red-300 text-sm">
                  {data.riskAnalysis.highRiskAlerts > 0 && `${data.riskAnalysis.highRiskAlerts} high-risk alerts detected. `}
                  {data.riskAnalysis.recentSuspiciousActivity && 'Suspicious activity detected in recent logins.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['overview', 'history', 'devices', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {tab}
              {tab === 'alerts' && data.unacknowledgedAlerts > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {data.unacknowledgedAlerts}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Current Status */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Current Session</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">IP Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-lg">{data.currentIP}</p>
                    <button
                      onClick={() => copyToClipboard(data.currentIP)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Location</p>
                  <p className="text-white text-lg">{data.currentLocation}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Last Login</p>
                  <p className="text-white">
                    {new Date(data.lastLogin).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Account Created</p>
                  <p className="text-white">
                    {new Date(data.accountCreated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Registration Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Registration IP</p>
                  <p className="text-white font-mono">{data.registrationIP}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Registration Location</p>
                  <p className="text-white">{data.registrationLocation}</p>
                </div>
              </div>
            </div>

            {/* IP/Location Changes */}
            {(data.previousIP || data.previousLocation) && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Recent Changes</h2>
                {data.previousIP && data.previousIP !== data.currentIP && (
                  <div className="mb-3">
                    <p className="text-gray-400 text-sm">IP Changed</p>
                    <p className="text-white">
                      <span className="text-gray-500">{data.previousIP}</span>
                      {' → '}
                      <span className="text-yellow-400">{data.currentIP}</span>
                    </p>
                  </div>
                )}
                {data.previousLocation && data.previousLocation !== data.currentLocation && (
                  <div>
                    <p className="text-gray-400 text-sm">Location Changed</p>
                    <p className="text-white">
                      <span className="text-gray-500">{data.previousLocation}</span>
                      {' → '}
                      <span className="text-yellow-400">{data.currentLocation}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                <p className="text-blue-400 text-sm mb-1">Total Logins</p>
                <p className="text-white text-3xl font-bold">{data.loginStats.totalLogins}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">
                <p className="text-purple-400 text-sm mb-1">Unique Devices</p>
                <p className="text-white text-3xl font-bold">{data.loginStats.uniqueDevices}</p>
              </div>
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
                <p className="text-green-400 text-sm mb-1">Locations</p>
                <p className="text-white text-3xl font-bold">{data.loginStats.uniqueLocations}</p>
              </div>
              <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
                <p className="text-red-400 text-sm mb-1">Failed Attempts</p>
                <p className="text-white text-3xl font-bold">{data.loginStats.failedAttempts}</p>
              </div>
            </div>

          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Login History ({data.loginHistory.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data.loginHistory.map((login, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    login.suspicious
                      ? 'bg-red-900/20 border-red-700'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {login.browser === 'Chrome' ? '🌐' :
                           login.browser === 'Firefox' ? '🦊' :
                           login.browser === 'Safari' ? '🧭' : '💻'}
                        </span>
                        <p className="text-white font-semibold">{login.device}</p>
                        {login.suspicious && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                            Suspicious
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{login.location}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-500 text-sm font-mono">{login.ip}</p>
                        <button
                          onClick={() => copyToClipboard(login.ip)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">
                        {new Date(login.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(login.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            
            {/* Trusted Devices */}
            {data.trustedDevices.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  ✓ Trusted Devices ({data.trustedDevices.length})
                </h2>
                <div className="space-y-3">
                  {data.trustedDevices.map((device, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-green-900/20 border border-green-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-semibold mb-1">{device.name}</p>
                          <p className="text-gray-400 text-sm">{device.location}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Last used: {new Date(device.lastUsed).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-green-400 text-2xl">✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unverified Devices */}
            {data.unverifiedDevices.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  ⚠️ Unverified Devices ({data.unverifiedDevices.length})
                </h2>
                <div className="space-y-3">
                  {data.devices.filter(d => !d.trusted).map((device, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold mb-1">{device.name}</p>
                          <p className="text-gray-400 text-sm">{device.location}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            First seen: {new Date(device.firstSeen).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Last used: {new Date(device.lastUsed).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => trustDevice(device.deviceId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Trust
                          </button>
                          <button
                            onClick={() => removeDevice(device.deviceId)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Devices Warning */}
            {data.riskAnalysis.hasMultipleDevices && (
              <div className="bg-orange-900/20 border border-orange-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-orange-400">
                    Multiple devices detected. If you don&apos;t recognize any device, remove it immediately.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Security Alerts ({data.securityAlerts.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data.securityAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {alert.severity === 'high' ? '🚨' :
                         alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                      </span>
                      <p className="font-semibold capitalize">{alert.type.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.severity === 'high' ? 'bg-red-600' :
                      alert.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                    } text-white`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{alert.message}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Device: {alert.device}</p>
                    <p>Location: {alert.location}</p>
                    <p>IP: {alert.ip}</p>
                    <p>{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {data.securityAlerts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No security alerts</p>
                  <p className="text-green-400 text-sm mt-2">✓ Your account is secure</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}