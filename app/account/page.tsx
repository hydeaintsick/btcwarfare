"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/balance");
  }, [router]);

  return (
    <div className="text-center py-8">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}

