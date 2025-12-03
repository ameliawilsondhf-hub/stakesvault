"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [depositAddress, setDepositAddress] = useState("");
  const [minDeposit, setMinDeposit] = useState("20");
  const [network, setNetwork] = useState("USDT TRC20 (Tron)");
  const [qrImage, setQrImage] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/get");
      const data = await res.json();
      
      if (data.success && data.settings) {
        setDepositAddress(data.settings.depositAddress || "");
        setQrImage(data.settings.qrImage || "");
        setMinDeposit(data.settings.minDeposit?.toString() || "20");
        setNetwork(data.settings.network || "USDT TRC20 (Tron)");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (!depositAddress.trim()) {
      alert("Deposit address is required!");
      return;
    }

    if (parseFloat(minDeposit) < 1) {
      alert("Minimum deposit must be at least 1 USDT");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("depositAddress", depositAddress);
      form.append("minDeposit", minDeposit);
      form.append("network", network);

      if (newImage) {
        form.append("qrImage", newImage);
      }

      const res = await fetch("/api/settings/update", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (json.success) {
        alert("✅ Settings updated successfully!");
        window.location.reload();
      } else {
        alert("❌ Error: " + (json.error || "Failed to update"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-10 bg-[#0d1117] text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">⚙️ Admin Settings</h1>

        <div className="bg-white/10 p-6 md:p-8 rounded-xl border border-white/20 space-y-6">
          
          {/* Deposit Address */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Deposit Wallet Address (TRC20)
            </label>
            <input
              type="text"
              value={depositAddress}
              onChange={(e) => setDepositAddress(e.target.value)}
              placeholder="Enter TRC20 wallet address"
              className="w-full p-3 rounded-lg bg-white/20 outline-none border border-white/10 focus:border-blue-500 transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              This address will be displayed to users for deposits
            </p>
          </div>

          {/* Network */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Network
            </label>
            <input
              type="text"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="e.g., USDT TRC20 (Tron)"
              className="w-full p-3 rounded-lg bg-white/20 outline-none border border-white/10 focus:border-blue-500 transition"
            />
          </div>

          {/* Minimum Deposit */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Minimum Deposit Amount (USDT)
            </label>
            <input
              type="number"
              value={minDeposit}
              onChange={(e) => setMinDeposit(e.target.value)}
              min="1"
              step="1"
              className="w-full p-3 rounded-lg bg-white/20 outline-none border border-white/10 focus:border-blue-500 transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Users must deposit at least this amount
            </p>
          </div>

          {/* QR Code Section */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              QR Code Image
            </label>

            {/* Current QR Preview */}
            {(qrImage || previewUrl) && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  {previewUrl ? "New Image Preview:" : "Current QR Code:"}
                </p>
                <div className="relative inline-block">
                  <img
                    src={previewUrl || qrImage}
                    alt="QR Code"
                    className="w-48 h-48 object-cover rounded-lg border-2 border-white/20 bg-white"
                  />
                  {previewUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      NEW
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload New QR */}
            <div className="border-2 border-dashed border-white/30 rounded-lg p-6 hover:border-blue-500 transition">
              <label className="flex flex-col items-center cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-300 mb-1">
                  {newImage ? newImage.name : "Click to upload new QR code"}
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG (Max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {newImage && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>New image selected: {newImage.name}</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "💾 Save Settings"
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            <strong>ℹ️ Note:</strong> Changes will be reflected immediately on the deposit page after saving.
          </p>
        </div>
      </div>
    </div>
  );
}