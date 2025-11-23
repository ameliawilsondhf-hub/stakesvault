"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [depositAddress, setDepositAddress] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/get")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setDepositAddress(data.settings.depositAddress);
          setQrImage(data.settings.qrImage);
        }
      });
  }, []);

  const saveSettings = async () => {
    setLoading(true);

    const form = new FormData();
    form.append("depositAddress", depositAddress);

    if (newImage) form.append("qrImage", newImage);

    const res = await fetch("/api/settings/update", {
      method: "POST",
      body: form,
    });

    const json = await res.json();

    setLoading(false);

    if (json.success) {
      alert("Settings updated successfully!");
      window.location.reload();
    } else {
      alert("Error: " + json.error);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-[#0d1117] text-white">
      <h1 className="text-4xl font-bold mb-8">⚙️ Admin Settings</h1>

      <div className="max-w-2xl bg-white/10 p-8 rounded-xl border border-white/20">

        {/* Deposit Address */}
        <label className="block text-lg mb-2">Deposit Wallet Address (TRC20)</label>
        <input
          type="text"
          value={depositAddress}
          onChange={(e) => setDepositAddress(e.target.value)}
          className="w-full p-3 rounded bg-white/20 outline-none mb-5"
        />

        {/* QR Preview */}
        <label className="block text-lg mb-2">QR Image</label>
        {qrImage && (
          <img
            src={qrImage}
            alt="QR"
            className="w-40 h-40 object-cover rounded mb-4 border"
          />
        )}

        {/* Upload New QR */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewImage(e.target.files?.[0] || null)}
          className="mb-5"
        />

        <button
          onClick={saveSettings}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
