"use client";

import { useState } from "react";

export function NewsletterSubscription() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Check your email to confirm.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-row gap-0 w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@youremail.com"
          required
          disabled={status === "loading"}
          className="flex-1 px-4 py-3 border border-stone-200 rounded-l-lg text-sm placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-800 focus:border-stone-800 font-mono bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-6 py-3 rounded-r-lg text-xs hover:bg-stone-700 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "SUBSCRIBING..." : "SUBSCRIBE"}
        </button>
      </form>

      {message && (
        <div
          className={`text-sm font-mono mt-3 ${
            status === "success"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : "text-stone-500"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
