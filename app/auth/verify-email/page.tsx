"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/auth-cookie";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "need-email"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const completeSignIn = async (email: string) => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setStatus("error");
        setError("Invalid or expired sign-in link. Please request a new one.");
        return;
      }

      try {
        const result = await signInWithEmailLink(
          auth,
          email,
          window.location.href,
        );
        window.localStorage.removeItem("emailForSignIn");

        const idToken = await result.user.getIdToken();

        const response = await fetch("/api/auth/firebase/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          setAuthCookie(idToken);
          setStatus("success");
          window.location.href = "/dashboard";
        } else {
          const data = await response.json();
          setStatus("error");
          setError(data.error || "Authentication failed");
        }
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        setStatus("error");
        setError(e.message || "Failed to sign in. Please try again.");
      }
    };

    const storedEmail =
      typeof window !== "undefined"
        ? window.localStorage.getItem("emailForSignIn")
        : null;

    if (storedEmail) {
      completeSignIn(storedEmail);
      return;
    }

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus("error");
      setError("Invalid or expired sign-in link. Please request a new one.");
      return;
    }

    setStatus("need-email");
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signInWithEmailLink(
        auth,
        emailInput.trim(),
        window.location.href,
      );
      window.localStorage.removeItem("emailForSignIn");

      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/firebase/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        setAuthCookie(idToken);
        setStatus("success");
        window.location.href = "/dashboard";
      } else {
        const data = await response.json();
        setError(data.error || "Authentication failed");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
        <div className="text-stone-500 font-mono text-sm">
          Signing you in...
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
        <div className="text-stone-700 font-mono text-sm">
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  if (status === "need-email") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-stone-800 hover:opacity-70"
          >
            <Image
              src="/icon.svg"
              alt="Postmetric"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="font-bold">Postmetric</span>
          </Link>
          <h1 className="mb-2 text-xl font-semibold text-stone-900">
            Confirm your email
          </h1>
          <p className="mb-6 text-sm text-stone-500">
            You opened this link on a different device. Enter the email address
            where you received the sign-in link to continue.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              className="w-full rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 font-mono focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800 disabled:opacity-50"
            />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="w-full rounded border border-stone-800 bg-stone-800 px-4 py-3 text-xs font-semibold font-mono uppercase text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-stone-800 hover:opacity-70"
        >
          <Image
            src="/icon.svg"
            alt="Postmetric"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="font-bold">Postmetric</span>
        </Link>
        <h1 className="mb-2 text-xl font-semibold text-stone-900">
          Sign-in failed
        </h1>
        <p className="mb-6 text-sm text-stone-500">{error}</p>
        <Link
          href="/login"
          className="inline-block w-full rounded border border-stone-800 bg-stone-800 px-4 py-3 text-center text-xs font-semibold font-mono uppercase text-white hover:bg-stone-700"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
