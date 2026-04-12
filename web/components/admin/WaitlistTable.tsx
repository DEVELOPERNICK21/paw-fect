"use client";

import type { WaitlistEntry } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function WaitlistTable({ initial }: { initial: WaitlistEntry[] }): React.ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(initial);

  async function reload(): Promise<void> {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/admin/waitlist${q}`);
    const data = (await res.json()) as { entries: WaitlistEntry[] };
    setRows(data.entries);
  }

  async function remove(id: string): Promise<void> {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
    router.refresh();
    setRows((r) => r.filter((x) => x.id !== id));
  }

  function exportCsv(): void {
    const header = "email,createdAt,source\n";
    const body = rows.map((r) => `${r.email},${r.createdAt},${r.source}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Waitlist</h1>
      <div className="mt-6 flex flex-wrap gap-4">
        <Input
          id="search"
          label="Search email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-end gap-2">
          <Button type="button" variant="secondary" onClick={() => reload()}>
            Search
          </Button>
          <Button type="button" variant="secondary" onClick={() => exportCsv()}>
            Export CSV
          </Button>
        </div>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 dark:border-stone-700">
            <th className="py-2">Email</th>
            <th className="py-2">Date</th>
            <th className="py-2">Source</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
              <td className="py-2">{r.email}</td>
              <td className="py-2">{r.createdAt}</td>
              <td className="py-2">{r.source}</td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  className="text-red-600 hover:underline"
                  onClick={() => remove(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
