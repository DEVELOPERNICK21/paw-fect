"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type FormStatus = "idle" | "loading" | "ok" | "already" | "err" | "unavailable";

interface WaitlistApiError {
  error?: string;
  code?: string;
}

export function WaitlistForm({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/waitlist", { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { available?: boolean };
        if (!cancelled && data.available === false) {
          setStatus("unavailable");
        }
      } catch {
        // If health check fails, still let the user try submit.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "web" }),
      });

      const data = (await res.json().catch(() => ({}))) as WaitlistApiError & {
        alreadyRegistered?: boolean;
      };

      if (!res.ok) {
        setStatus(res.status === 503 ? "unavailable" : "err");
        setErrorMessage(
          data.error ??
            (res.status === 503
              ? "Sign-ups are temporarily unavailable. Try again later or download the app."
              : "Could not save your email. Please try again."),
        );
        return;
      }

      if (data.alreadyRegistered) {
        setStatus("already");
        return;
      }

      setEmail("");
      setStatus("ok");
    } catch {
      setStatus("err");
      setErrorMessage("Network error. Check your connection and try again.");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-sm font-medium text-primary-dark dark:text-primary" role="status">
        You&apos;re on the list — we&apos;ll email you when there&apos;s news.
      </p>
    );
  }

  if (status === "already") {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-400" role="status">
        This email is already on the waitlist.
      </p>
    );
  }

  if (status === "unavailable") {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
        {errorMessage ??
          "Waitlist sign-ups are not available on this site yet. Download the app from the links above or contact us."}
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-end"}
    >
      <div className="flex-1">
        <Input
          id="wl-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>
      <Button type="submit" disabled={status === "loading"} className={compact ? "w-full" : ""}>
        {status === "loading" ? "Saving…" : "Notify me"}
      </Button>
      {status === "err" && errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
