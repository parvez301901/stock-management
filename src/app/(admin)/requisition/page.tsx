"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { requisitionApi } from "@/lib/api";

export default function RequisitionListPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<string | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await requisitionApi.list({ status: (status as any) || undefined, page });
        const data = res as any;
        setItems(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.meta?.last_page ?? 1);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load requisitions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, status, page]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Requisitions</h1>
        <Link href="/requisition/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">New Requisition</Link>
      </div>

      <div className="flex items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Article</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Requested By</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={6}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-6 py-4 text-sm" colSpan={6}>No requisitions found.</td></tr>
            ) : (
              items.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 text-sm">{r.id}</td>
                  <td className="px-6 py-4 text-sm">{r.article?.title || '-'}</td>
                  <td className="px-6 py-4 text-sm">{r.requester?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm capitalize">{r.status}</td>
                  <td className="px-6 py-4 text-sm">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-sm"><Link href={`/requisition/${r.id}`} className="text-brand-600 hover:underline">View</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800 disabled:opacity-60">Previous</button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800 disabled:opacity-60">Next</button>
      </div>
    </div>
  );
}
