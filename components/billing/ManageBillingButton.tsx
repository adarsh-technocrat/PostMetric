"use client";

import { useState, useEffect } from "react";

export function ManageBillingButton() {
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setCanManage(d.canManageBilling));
  }, []);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  };

  if (!canManage) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-stone-600 hover:text-stone-800 underline"
    >
      {loading ? "Opening…" : "Manage subscription"}
    </button>
  );
}
