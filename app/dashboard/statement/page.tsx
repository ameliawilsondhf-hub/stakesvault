"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

interface StatementData {
  user: {
    name: string;
    email: string;
    joinDate: string;
  };
  balances: {
    wallet: number;
    staked: number;
    total: number;
  };
  stats: {
    totalDeposits: number;
    totalStakes: number;
    activeStakes: number;
    completedStakes: number;
  };
  stakes: Array<{
    id: string;
    amount: number;
    lockPeriod: number;
    status: string;
    createdAt: string;
    unlockDate: string;
    earnedRewards: number;
    apy: number;
    daysRemaining: number;
    estimatedProfit: number;
    dailyProfit: number;
  }>;
  generatedAt: string;
}

export default function StatementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatementData | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/certificate/statement", {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching statement:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!data) return;
    
    setGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      const statementId = `ST-${Date.now().toString().slice(-8)}`;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('STAKEVAULT', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Investment Statement', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Statement ID: ${statementId}`, pageWidth / 2, 33, { align: 'center' });

      yPos = 50;

      // Account Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Account Information', 15, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Account Holder: ${data.user.name}`, 15, yPos);
      yPos += 6;
      doc.text(`Email: ${data.user.email}`, 15, yPos);
      yPos += 6;
      doc.text(`Member Since: ${new Date(data.user.joinDate).toLocaleDateString()}`, 15, yPos);
      yPos += 6;
      doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 15, yPos);
      yPos += 12;

      // Balance Summary Box
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3);

      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Balance Summary', 20, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);

      const col1X = 20;
      const col2X = pageWidth / 2;

      doc.text(`Wallet Balance:`, col1X, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${data.balances.wallet.toFixed(2)}`, col1X + 40, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(`Staked Balance:`, col2X, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${data.balances.staked.toFixed(2)}`, col2X + 40, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Deposits:`, col1X, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${data.stats.totalDeposits.toFixed(2)}`, col1X + 40, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(`Total Balance:`, col2X, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(`$${data.balances.total.toFixed(2)}`, col2X + 40, yPos);

      yPos += 15;

      // Stake Statistics
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Stake Overview', 15, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);

      doc.text(`Total Stakes: ${data.stats.totalStakes}`, col1X, yPos);
      doc.text(`Active: ${data.stats.activeStakes}`, col2X, yPos);
      yPos += 6;
      doc.text(`Completed: ${data.stats.completedStakes}`, col1X, yPos);
      yPos += 12;

      // Stakes Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Detailed Stake History', 15, yPos);
      yPos += 5;

      // Prepare table data
      const tableData = data.stakes.map((stake) => [
        new Date(stake.createdAt).toLocaleDateString(),
        `$${stake.amount.toFixed(2)}`,
        `${stake.lockPeriod} days`,
        new Date(stake.unlockDate).toLocaleDateString(),
        stake.status === 'active' ? `${stake.daysRemaining} days` : 'Completed',
        `$${stake.dailyProfit.toFixed(2)}`,
        `$${stake.earnedRewards.toFixed(2)}`,
        `$${stake.estimatedProfit.toFixed(2)}`,
        stake.status.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [[
          'Stake Date',
          'Amount',
          'Period',
          'Unlock Date',
          'Remaining',
          'Daily Profit',
          'Earned',
          'Estimated',
          'Status'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55],
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20, halign: 'right' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 22 },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 20, halign: 'right' },
          8: { cellWidth: 20, halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 15, right: 15 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFillColor(240, 240, 240);
      doc.rect(0, doc.internal.pageSize.getHeight() - 25, pageWidth, 25, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on ${new Date(data.generatedAt).toLocaleString()} • Statement ID: ${statementId}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );

      doc.setFontSize(7);
      doc.text(
        'This is a computer-generated statement and does not require a signature • StakeVault © 2025',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );

      // Save
      doc.save(`StakeVault_Statement_${statementId}.pdf`);
      alert('✅ Investment statement downloaded successfully!');

    } catch (error) {
      console.error('PDF error:', error);
      alert('❌ Failed to generate statement');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-2xl">Loading statement...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">❌</p>
          <p className="text-red-400 text-xl mb-6">Failed to load statement</p>
          <Link href="/dashboard">
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-white font-bold">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#0A0F2C] via-[#11172E] to-[#1b223c] text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="mb-4">
            <span className="text-6xl">📊</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Investment Statement</h1>
          <p className="text-gray-400">Complete detailed history of all your stakes</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/30">
            <p className="text-sm text-gray-400 mb-2">Wallet Balance</p>
            <p className="text-3xl font-bold text-blue-400">${data.balances.wallet.toFixed(2)}</p>
          </div>
          <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500/30">
            <p className="text-sm text-gray-400 mb-2">Staked Balance</p>
            <p className="text-3xl font-bold text-purple-400">${data.balances.staked.toFixed(2)}</p>
          </div>
          <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/30">
            <p className="text-sm text-gray-400 mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-green-400">${data.balances.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Stakes Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6">Stake History ({data.stakes.length} Total)</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-right py-3 px-2">Amount</th>
                  <th className="text-center py-3 px-2">Period</th>
                  <th className="text-left py-3 px-2">Unlock Date</th>
                  <th className="text-center py-3 px-2">Remaining</th>
                  <th className="text-right py-3 px-2">Daily Profit</th>
                  <th className="text-right py-3 px-2">Earned</th>
                  <th className="text-right py-3 px-2">Estimated</th>
                  <th className="text-center py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.stakes.map((stake, idx) => (
                  <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-2">{new Date(stake.createdAt).toLocaleDateString()}</td>
                    <td className="text-right py-3 px-2 font-bold">${stake.amount.toFixed(2)}</td>
                    <td className="text-center py-3 px-2">{stake.lockPeriod}d</td>
                    <td className="py-3 px-2">{new Date(stake.unlockDate).toLocaleDateString()}</td>
                    <td className="text-center py-3 px-2">
                      {stake.status === 'active' ? `${stake.daysRemaining}d` : '-'}
                    </td>
                    <td className="text-right py-3 px-2 text-green-400">${stake.dailyProfit.toFixed(2)}</td>
                    <td className="text-right py-3 px-2 text-blue-400">${stake.earnedRewards.toFixed(2)}</td>
                    <td className="text-right py-3 px-2 text-purple-400">${stake.estimatedProfit.toFixed(2)}</td>
                    <td className="text-center py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        stake.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {stake.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={generatePDF}
          disabled={generating}
          className={`w-full py-5 rounded-xl font-bold text-xl transition-all shadow-2xl ${
            generating
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
          }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating PDF Statement...
            </span>
          ) : (
            <span>📥 Download Complete Statement (PDF)</span>
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Detailed Investment Statement • All Stakes • Date-wise History • Professional Format
        </p>

      </div>
    </div>
  );
}