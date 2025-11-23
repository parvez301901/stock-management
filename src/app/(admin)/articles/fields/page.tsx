"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { extraFieldsApi, type ExtraField } from "@/lib/api";

export default function ManageFieldsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [fields, setFields] = useState<ExtraField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Omit<ExtraField, "id">>({
    key: "",
    label: "",
    type: "text",
    required: false,
    options: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const list = await extraFieldsApi.list(token);
      setFields(list);
    } catch (e: any) {
      setError(e.message || "Failed to load fields");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      if (!form.key || !form.label) {
        setError("Key and Label are required");
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      await extraFieldsApi.create(token, form);
      setForm({ key: "", label: "", type: "text", required: false, options: null });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to create field");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this field?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      await extraFieldsApi.delete(token, id);
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Manage Extra Fields</h1>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={onCreate} className="grid items-end gap-3 rounded-lg border p-4 dark:border-gray-800 md:grid-cols-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key</label>
          <input
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            className="mt-1 h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            placeholder="e.g. subtitle"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="mt-1 h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            placeholder="e.g. Subtitle"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
            className="mt-1 h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="req"
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
          />
          <label htmlFor="req" className="text-sm text-gray-700 dark:text-gray-300">
            Required
          </label>
        </div>
        <div className="text-right">
          <button
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Field"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Required</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td className="px-6 py-4" colSpan={5}>
                  No fields created yet.
                </td>
              </tr>
            ) : (
              fields.map((f) => (
                <tr key={f.id}>
                  <td className="px-6 py-4 text-sm">{f.key}</td>
                  <td className="px-6 py-4 text-sm">{f.label}</td>
                  <td className="px-6 py-4 text-sm">{f.type}</td>
                  <td className="px-6 py-4 text-sm">{f.required ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => onDelete(f.id!)}
                      className="rounded border px-3 py-1 text-red-600 hover:bg-red-50 dark:border-gray-800"
                    >
                      Delete
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
