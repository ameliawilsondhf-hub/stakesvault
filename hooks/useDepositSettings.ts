import { useState, useEffect } from "react";

interface DepositSettings {
  depositAddress: string;
  qrImage: string;
  minDeposit: number;
  network: string;
}

export function useDepositSettings() {
  const [settings, setSettings] = useState<DepositSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const response = await fetch("/api/settings/get");
        const data = await response.json();

        if (data.success) {
          setSettings(data.settings);
          setError(null);
        } else {
          setError(data.message || "Failed to fetch settings");
        }
      } catch (err: any) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading, error };
}