"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          console.log("❌ Admin session expired – redirecting");
          router.replace("/admin/login");
        }
      } catch (err) {
        console.log("❌ Admin session check failed");
        router.replace("/admin/login");
      }
    };

    syncAuth();

    const interval = setInterval(syncAuth, 15000); // ✅ har 15 sec check
    return () => clearInterval(interval);
  }, [router]);

  return <>{children}</>;
}
