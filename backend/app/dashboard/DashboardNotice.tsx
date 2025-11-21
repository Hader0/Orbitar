"use client";

import { useEffect, useState } from "react";

export function DashboardNotice({ initial }: { initial?: string | null }) {
  const [msg, setMsg] = useState<string | null>(initial ?? null);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  const isError =
    msg.toLowerCase().includes("error") || msg.toLowerCase().includes("fail");

  return (
    <div
      className={`mb-4 rounded p-3 text-sm ${
        isError
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
      role="status"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}
