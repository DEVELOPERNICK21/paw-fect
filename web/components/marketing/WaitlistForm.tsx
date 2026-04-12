"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export function WaitlistForm(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "web" }),
    });
    setLoading(false);
    if (!res.ok) {
      setStatus("err");
      return;
    }
    setStatus("ok");
  }

  if (status === "ok") {
    return <p className="text-sm text-stone-600 dark:text-stone-400">You’re on the list.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          id="wl-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "…" : "Notify me"}
      </Button>
      {status === "err" ? <p className="text-sm text-red-600">Could not save.</p> : null}
    </form>
  );
}
