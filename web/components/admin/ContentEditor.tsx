"use client";

import type { SiteContentMarketing } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ContentEditor({
  initial,
}: {
  initial: SiteContentMarketing;
}): React.ReactElement {
  const [content, setContent] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(): Promise<void> {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setLoading(false);
    if (!res.ok) {
      setStatus("Save failed");
      return;
    }
    setStatus("Saved");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Site content</h1>
      <div>
        <Input
          id="heroHeadline"
          label="Hero headline"
          value={content.heroHeadline}
          onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="heroSubline" className="mb-1 block text-sm font-medium">
          Hero subline
        </label>
        <textarea
          id="heroSubline"
          className="w-full rounded-2xl border border-stone-200 p-4 dark:border-stone-600 dark:bg-stone-900"
          rows={4}
          value={content.heroSubline}
          onChange={(e) => setContent({ ...content, heroSubline: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="appStoreUrl"
          label="App Store URL"
          value={content.appStoreUrl}
          onChange={(e) => setContent({ ...content, appStoreUrl: e.target.value })}
        />
        <Input
          id="playStoreUrl"
          label="Play Store URL"
          value={content.playStoreUrl}
          onChange={(e) => setContent({ ...content, playStoreUrl: e.target.value })}
        />
      </div>
      <Input
        id="privacyLastUpdated"
        label="Privacy last updated (ISO date)"
        value={content.privacyLastUpdated}
        onChange={(e) => setContent({ ...content, privacyLastUpdated: e.target.value })}
      />
      <Button type="button" onClick={() => save()} disabled={loading}>
        {loading ? "Saving…" : "Save"}
      </Button>
      {status ? <p className="text-sm text-stone-600">{status}</p> : null}
    </div>
  );
}
