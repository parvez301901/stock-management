"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { userApi, type User } from "@/lib/api";

export default function UsersListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await userApi.getAll({ search });
        const list = Array.isArray((res as any)?.data) ? (res as any).data : (res as any);
        setUsers(Array.isArray(list) ? list : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  const onToggleActive = async (u: User) => {
    try {
      const updated = await userApi.setActive(u.id, !(u.active ?? true));
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: updated.active } : x)));
      addToast({ variant: "success", title: "Updated", message: `${u.name} is now ${updated.active ? "active" : "inactive"}` });
    } catch (e: any) {
      addToast({ variant: "error", title: "Failed", message: e?.response?.data?.message || e?.message || "Could not update user" });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Users</h1>
        <Link
          href="/users/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Add User
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          placeholder="Search users by name or email..."
          className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-4" colSpan={5}>Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-sm" colSpan={5}>No users yet.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 text-sm">{u.name}</td>
                  <td className="px-6 py-4 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-sm">{u.role ?? ""}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.active ?? true ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                      {u.active ?? true ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link href={`/users/${u.id}/edit`} className="mr-2 rounded bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600">Edit</Link>
                    <button onClick={() => onToggleActive(u)} className={`rounded px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 ${u.active ?? true ? "bg-gray-500" : "bg-green-600"}`}>
                      {u.active ?? true ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
