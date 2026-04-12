"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm({ callbackUrl }: { callbackUrl: string }): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 dark:bg-stone-950">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 dark:border-stone-700 dark:bg-stone-900">
        <h1 className="text-center text-2xl font-bold text-stone-900 dark:text-stone-50">Pawfect Admin</h1>
        <p className="mt-2 text-center text-sm text-stone-500">Sign in to manage the marketing site.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
