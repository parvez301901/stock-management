"use client";

import React, { useEffect, useState } from "react";
import { notificationsApi, type NotificationItem } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [role, setRole] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await notificationsApi.list({ page, unread: filter === "unread", role: role || undefined });
      const data = res as any;
      setItems(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(data?.meta?.last_page ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page, filter, role]);

  if (!isAuthenticated) return null;

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to mark read" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Notifications</h1>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => { setFilter(e.target.value as any); setPage(1); }} className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <input
            placeholder="Role (e.g., store_manager, admin)"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
      </div>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={5}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-6 py-4 text-sm" colSpan={5}>No notifications found.</td></tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} className={n.read_at ? "opacity-70" : ""}>
                  <td className="px-6 py-4 text-sm">{n.message}</td>
                  <td className="px-6 py-4 text-sm">{n.role}</td>
                  <td className="px-6 py-4 text-sm">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</td>
                  <td className="px-6 py-4 text-sm">{n.read_at ? "Read" : "Unread"}</td>
                  <td className="px-6 py-4 text-sm">
                    {!n.read_at && (
                      <button onClick={() => markRead(n.id)} className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-800">Mark Read</button>
                    )}
                  </td>
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
