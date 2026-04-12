"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

const subjects = [
  "General inquiry",
  "App support",
  "Press",
  "Partnerships",
  "Feedback",
];

export function ContactForm(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    await res.json();
    setLoading(false);
    if (!res.ok) {
      setError("Could not send — check fields (message min 20 characters).");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
        Thanks — we received your message and will get back soon.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input id="c-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        id="c-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div>
        <label htmlFor="c-subject" className="mb-1 block text-sm font-medium">
          Subject
        </label>
        <select
          id="c-subject"
          className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 dark:border-stone-600 dark:bg-stone-900"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-1 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="c-msg"
          required
          minLength={20}
          rows={5}
          className="w-full rounded-2xl border border-stone-200 p-4 dark:border-stone-600 dark:bg-stone-900"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
