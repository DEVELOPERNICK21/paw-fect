"use client";

import type { ContactSubmission } from "@/types";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export function ContactsTable({ initial }: { initial: ContactSubmission[] }): React.ReactElement {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function setStatus(id: string, status: ContactSubmission["status"]): Promise<void> {
    await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Contact submissions</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 dark:border-stone-700">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Subject</th>
            <th className="py-2">Status</th>
            <th className="py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr
                className="cursor-pointer border-b border-stone-100 dark:border-stone-800"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
              >
                <td className="py-2">{r.name}</td>
                <td className="py-2">{r.email}</td>
                <td className="py-2">{r.subject}</td>
                <td className="py-2">
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs dark:bg-stone-700">
                    {r.status}
                  </span>
                </td>
                <td className="py-2">{r.createdAt}</td>
              </tr>
              {openId === r.id ? (
                <tr>
                  <td colSpan={5} className="bg-stone-50 p-4 dark:bg-stone-900">
                    <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{r.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-stone-200 px-3 py-1 text-xs dark:bg-stone-700"
                        onClick={() => setStatus(r.id, "read")}
                      >
                        Mark read
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-stone-200 px-3 py-1 text-xs dark:bg-stone-700"
                        onClick={() => setStatus(r.id, "replied")}
                      >
                        Mark replied
                      </button>
                      <a
                        href={`mailto:${r.email}?subject=Re:%20${encodeURIComponent(r.subject)}`}
                        className="rounded-full bg-primary px-3 py-1 text-xs text-white"
                      >
                        Reply
                      </a>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
