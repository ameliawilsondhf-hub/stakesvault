"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AdminDepositsHistory() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    filterDeposits();
  }, [statusFilter, searchTerm, deposits]);

  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/admin/deposit/list", {
        credentials: "include",
        cache: "no-store"
      });
      const data = await res.json();
      console.log("API Response:", data);
      
      // Handle different response formats
      let depositsArray = [];
      if (Array.isArray(data)) {
        depositsArray = data;
      } else if (data.success && Array.isArray(data.deposits)) {
        depositsArray = data.deposits;
      } else if (data.data && Array.isArray(data.data)) {
        depositsArray = data.data;
      } else if (Array.isArray(data)) {
        depositsArray = data;
      }
      
      console.log("Processed Deposits:", depositsArray);
      setDeposits(depositsArray);
      setFilteredDeposits(depositsArray);
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeposits = () => {
    let filtered = deposits;

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(d => 
        d.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDeposits(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-700 border-green-300",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      rejected: "bg-red-100 text-red-700 border-red-300"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const handleImageClick = (imageUrl: string) => {
    // Convert relative paths to full URLs if needed
    let fullUrl = imageUrl;
    
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      // If it's a relative path, try to construct full URL
      if (imageUrl.startsWith('/')) {
        fullUrl = `${window.location.origin}${imageUrl}`;
      } else {
        fullUrl = `${window.location.origin}/${imageUrl}`;
      }
    }
    
    console.log("Opening image:", fullUrl);
    setSelectedImage(fullUrl);
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error("Failed to load image:", selectedImage);
  };

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    // Accept any file that starts with http/https or data URI
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
  };

  const totalAmount = filteredDeposits
    .filter(d => d.status === "approved")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const stats = {
    total: filteredDeposits.length,
    approved: filteredDeposits.filter(d => d.status === "approved").length,
    pending: filteredDeposits.filter(d => d.status === "pending").length,
    rejected: filteredDeposits.filter(d => d.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">💰 Deposits History</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total: {stats.total} deposits | 
                Approved Amount: <span className="text-green-600 font-semibold">${totalAmount.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/deposit">
                <button className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors">
                  Pending Deposits
                </button>
              </Link>
              <Link href="/admin">
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors">
                  ← Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-green-600 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-sm text-red-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Search by user email, name, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="rejected">❌ Rejected</option>
            </select>

            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeposits.map((deposit) => (
                  <tr key={deposit._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(deposit.userId?.name || deposit.userId?.email || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{deposit.userId?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{deposit.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-600 text-lg">
                        ${deposit.amount?.toFixed(2) || "0.00"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 font-mono">
                        {deposit.transactionId || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(deposit.status)}`}>
                        {deposit.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <p>{new Date(deposit.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(deposit.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {deposit.screenshot && isValidImageUrl(deposit.screenshot) ? (
                        <button 
                          onClick={() => handleImageClick(deposit.screenshot)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline hover:no-underline"
                          title={deposit.screenshot}
                        >
                          View 🔗
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No image</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDeposits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No deposits found</p>
              {(searchTerm || statusFilter !== "all") && (
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <button
                className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors z-10"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {imageError ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 text-center max-h-[85vh] flex items-center justify-center">
                  <div>
                    <p className="text-red-600 text-lg font-semibold mb-2">Failed to load image</p>
                    <p className="text-red-500 text-sm mb-4">The screenshot could not be displayed</p>
                    <p className="text-gray-600 text-xs break-all">{selectedImage}</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <a href={selectedImage} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Open in New Tab
                      </a>
                      <button onClick={() => setSelectedImage(null)} className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedImage}
                  alt="Payment proof"
                  className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}