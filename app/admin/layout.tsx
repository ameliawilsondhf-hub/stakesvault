"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ✅ IMPORTANT: Login page par auth check bilkul mat chalao
    if (pathname === "/admin/login") return;

    const syncAuth = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          console.log("❌ Admin session expired – redirecting to login");
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
  }, [router, pathname]);

  return <>{children}</>;
}
