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
  const [processingAlerts, setProcessingAlerts] = useState<Set<string>>(new Set());

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

  const acknowledgeAlert = async (alertId: string) => {
    setProcessingAlerts(prev => new Set(prev).add(alertId));
    try {
      const res = await fetch('/api/user/security-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'acknowledge' })
      });
      if (res.ok) {
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setProcessingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    setProcessingAlerts(prev => new Set(prev).add(alertId));
    try {
      const res = await fetch('/api/user/security-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'dismiss' })
      });
      if (res.ok) {
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    } finally {
      setProcessingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const clearAllAcknowledged = async () => {
    if (confirm('Clear all acknowledged alerts?')) {
      try {
        const res = await fetch('/api/user/security-info', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_all' })
        });
        if (res.ok) {
          await fetchSecurityData();
        }
      } catch (error) {
        console.error('Error clearing alerts:', error);
      }
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading security data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg">Failed to load security data</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string, acknowledged: boolean) => {
    const opacity = acknowledged ? '5' : '10';
    const borderOpacity = acknowledged ? '20' : '30';
    
    switch (severity) {
      case 'high': return `bg-red-500/${opacity} border-red-500/${borderOpacity} text-red-400`;
      case 'medium': return `bg-amber-500/${opacity} border-amber-500/${borderOpacity} text-amber-400`;
      case 'low': return `bg-blue-500/${opacity} border-blue-500/${borderOpacity} text-blue-400`;
      default: return `bg-slate-500/${opacity} border-slate-500/${borderOpacity} text-slate-400`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
              🔐
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Security</h1>
              <p className="text-xs text-slate-400">Monitor your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* Critical Alerts */}
        {(data.riskAnalysis.highRiskAlerts > 0 || data.riskAnalysis.recentSuspiciousActivity) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-red-400 font-semibold text-sm mb-1">Security Warning</h3>
                <p className="text-red-300/80 text-xs leading-relaxed">
                  {data.riskAnalysis.highRiskAlerts > 0 && `${data.riskAnalysis.highRiskAlerts} high-risk alerts detected. `}
                  {data.riskAnalysis.recentSuspiciousActivity && 'Suspicious activity detected.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['overview', 'history', 'devices', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-xl font-medium capitalize whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-900/50 text-slate-400 active:scale-95'
              }`}
            >
              {tab}
              {tab === 'alerts' && data.unacknowledgedAlerts > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {data.unacknowledgedAlerts}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Current Session */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg">📱</span>
                </div>
                <h2 className="text-lg font-semibold text-white">Current Session</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-xs mb-1.5">IP Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-sm flex-1 truncate">{data.currentIP}</p>
                    <button
                      onClick={() => copyToClipboard(data.currentIP)}
                      className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 active:scale-95 transition-transform flex-shrink-0"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-500 text-xs mb-1.5">Location</p>
                  <p className="text-white text-sm">{data.currentLocation}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-500 text-xs mb-1.5">Last Login</p>
                    <p className="text-slate-300 text-xs">
                      {new Date(data.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1.5">Account Age</p>
                    <p className="text-slate-300 text-xs">
                      {new Date(data.accountCreated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔑</span>
                  <p className="text-blue-400 text-xs font-medium">Total Logins</p>
                </div>
                <p className="text-white text-2xl font-bold">{data.loginStats.totalLogins}</p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💻</span>
                  <p className="text-purple-400 text-xs font-medium">Devices</p>
                </div>
                <p className="text-white text-2xl font-bold">{data.loginStats.uniqueDevices}</p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌍</span>
                  <p className="text-green-400 text-xs font-medium">Locations</p>
                </div>
                <p className="text-white text-2xl font-bold">{data.loginStats.uniqueLocations}</p>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">❌</span>
                  <p className="text-red-400 text-xs font-medium">Failed</p>
                </div>
                <p className="text-white text-2xl font-bold">{data.loginStats.failedAttempts}</p>
              </div>
            </div>

            {/* Changes Alert */}
            {(data.previousIP || data.previousLocation) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-amber-400 font-semibold text-sm">Recent Changes</h3>
                </div>
                {data.previousIP && data.previousIP !== data.currentIP && (
                  <div className="mb-2">
                    <p className="text-slate-400 text-xs mb-1">IP Changed</p>
                    <p className="text-white text-xs font-mono">
                      <span className="text-slate-500">{data.previousIP}</span>
                      {' → '}
                      <span className="text-amber-400">{data.currentIP}</span>
                    </p>
                  </div>
                )}
                {data.previousLocation && data.previousLocation !== data.currentLocation && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Location Changed</p>
                    <p className="text-white text-xs">
                      <span className="text-slate-500">{data.previousLocation}</span>
                      {' → '}
                      <span className="text-amber-400">{data.currentLocation}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-white font-semibold">Login History</h2>
              <span className="text-slate-500 text-xs">{data.loginHistory.length} records</span>
            </div>
            
            {data.loginHistory.map((login, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-4 border ${
                  login.suspicious
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    login.suspicious ? 'bg-red-500/20' : 'bg-slate-800'
                  }`}>
                    <span className="text-lg">
                      {login.browser === 'Chrome' ? '🌐' :
                       login.browser === 'Firefox' ? '🦊' :
                       login.browser === 'Safari' ? '🧭' : '💻'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm truncate">{login.device}</p>
                      {login.suspicious && (
                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full flex-shrink-0">
                          Suspicious
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{login.location}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500 text-xs font-mono truncate">{login.ip}</p>
                      <button
                        onClick={() => copyToClipboard(login.ip)}
                        className="text-blue-400 text-xs flex-shrink-0"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-400 text-xs">
                      {new Date(login.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(login.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            
            {/* Trusted Devices */}
            {data.trustedDevices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-lg">✓</span>
                  <h2 className="text-white font-semibold">Trusted Devices</h2>
                  <span className="text-slate-500 text-xs">({data.trustedDevices.length})</span>
                </div>
                
                <div className="space-y-3">
                  {data.trustedDevices.map((device, idx) => (
                    <div
                      key={idx}
                      className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">✓</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm mb-1 truncate">{device.name}</p>
                          <p className="text-slate-400 text-xs mb-1">{device.location}</p>
                          <p className="text-slate-500 text-xs">
                            Last: {new Date(device.lastUsed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unverified Devices */}
            {data.unverifiedDevices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-lg">⚠️</span>
                  <h2 className="text-white font-semibold">Unverified Devices</h2>
                  <span className="text-slate-500 text-xs">({data.unverifiedDevices.length})</span>
                </div>
                
                <div className="space-y-3">
                  {data.devices.filter(d => !d.trusted).map((device, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">⚠️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm mb-1 truncate">{device.name}</p>
                          <p className="text-slate-400 text-xs mb-1">{device.location}</p>
                          <p className="text-slate-500 text-xs">
                            First: {new Date(device.firstSeen).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => trustDevice(device.deviceId)}
                          className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-transform"
                        >
                          ✓ Trust
                        </button>
                        <button
                          onClick={() => removeDevice(device.deviceId)}
                          className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-transform"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Devices Warning */}
            {data.riskAnalysis.hasMultipleDevices && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-orange-400 text-xs leading-relaxed">
                    Multiple devices detected. If you don&apos;t recognize any device, remove it immediately.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-white font-semibold">Security Alerts</h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">{data.securityAlerts.length} alerts</span>
                {data.securityAlerts.some(a => a.acknowledged) && (
                  <button
                    onClick={clearAllAcknowledged}
                    className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            {data.securityAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-4 border ${getSeverityColor(alert.severity, alert.acknowledged)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">
                      {alert.acknowledged ? '✓' :
                       alert.severity === 'high' ? '🚨' :
                       alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`font-semibold text-sm capitalize truncate ${
                        alert.acknowledged ? 'line-through' : ''
                      }`}>
                        {alert.type.replace(/_/g, ' ')}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                        alert.severity === 'high' ? 'bg-red-500 text-white' :
                        alert.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-xs mb-3 leading-relaxed opacity-90">{alert.message}</p>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-xs opacity-70">📱 {alert.device}</p>
                      <p className="text-xs opacity-70">📍 {alert.location}</p>
                      <p className="text-xs opacity-70 font-mono">{alert.ip}</p>
                    </div>

                    {/* Alert Actions */}
                    {!alert.acknowledged && alert._id && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => acknowledgeAlert(alert._id!)}
                          disabled={processingAlerts.has(alert._id!)}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium text-xs active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {processingAlerts.has(alert._id!) ? '...' : '✓ Acknowledge'}
                        </button>
                        <button
                          onClick={() => dismissAlert(alert._id!)}
                          disabled={processingAlerts.has(alert._id!)}
                          className="flex-1 bg-slate-700 text-white py-2 rounded-lg font-medium text-xs active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {processingAlerts.has(alert._id!) ? '...' : '✕ Dismiss'}
                        </button>
                      </div>
                    )}

                    {alert.acknowledged && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-slate-500">✓ Acknowledged</span>
                        {alert._id && (
                          <button
                            onClick={() => dismissAlert(alert._id!)}
                            disabled={processingAlerts.has(alert._id!)}
                            className="ml-auto text-xs text-slate-400 hover:text-slate-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {data.securityAlerts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-slate-400 text-sm mb-1">No security alerts</p>
                <p className="text-green-400 text-xs">Your account is secure</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}