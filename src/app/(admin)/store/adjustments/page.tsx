"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { materialApi, type Material, inventoryApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function AdjustmentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<{
    date: string;
    material_id: number | "";
    quantity: number | "";
    direction: "increase" | "decrease";
    reason: "damaged" | "lost" | "expired" | "correction" | "";
    reference: string;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    material_id: "",
    quantity: "",
    direction: "increase",
    reason: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await materialApi.getAllPaged({ page: 1 });
        setMaterials(res.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.material_id || !form.quantity || !form.reason) {
      addToast({ variant: "error", message: "Material, quantity and reason are required" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await inventoryApi.adjust(Number(form.material_id), {
        date: form.date || undefined,
        quantity: Number(form.quantity),
        direction: form.direction,
        reason: form.reason as any,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      addToast({ variant: "success", message: res?.message || "Adjustment recorded" });
      setForm((f) => ({ ...f, quantity: "", reference: "" }));
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to record adjustment" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Adjustments</h1>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Date</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Material</span>
          <select value={form.material_id} onChange={(e) => setForm({ ...form, material_id: e.target.value ? Number(e.target.value) : "" })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="">Select material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.material_code ? `${m.material_code} - ` : ""}{m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Quantity (+/-)</span>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as any })} className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
            <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value === "" ? "" : Number(e.target.value) })} className="col-span-2 h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Reason</span>
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as any })} className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="">Select reason</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
            <option value="expired">Expired</option>
            <option value="correction">Error Correction</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Reference</span>
          <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push("/store/transactions")} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">
            {submitting ? "Saving..." : "Save Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}
