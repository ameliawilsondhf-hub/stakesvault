"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    router.push("/auth/login");
  };

  if (loading)
    return <p className="text-white text-center mt-10">Checking login...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded-lg text-white"
        >
          Logout
        </button>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl">
        <p><b>Email:</b> {user.email}</p>
        <p><b>Referral:</b> {user.referral || "N/A"}</p>
        <p><b>User ID:</b> {user._id}</p>
      </div>
    </main>
  );
}
