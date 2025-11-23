"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { materialApi, type Material, inventoryApi, type StockInPayload } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function StockInPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<{
    date: string;
    supplier_name: string;
    material_id: number | "";
    quantity: number | "";
    unit_price: number | "";
    reference: string;
    shipment_mode: '' | 'Air' | 'Sea' | 'Courier' | 'Hand Carry';
    shipment_reference: string;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    supplier_name: "",
    material_id: "",
    quantity: "",
    unit_price: "",
    reference: "",
    shipment_mode: "",
    shipment_reference: "",
    notes: "",
  });

  const totalCost = useMemo(() => {
    const q = Number(form.quantity || 0);
    const p = Number(form.unit_price || 0);
    if (Number.isFinite(q) && Number.isFinite(p)) return (q * p).toFixed(2);
    return "0.00";
  }, [form.quantity, form.unit_price]);

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
    if (!form.material_id || !form.quantity) {
      addToast({ variant: "error", message: "Material and quantity are required" });
      return;
    }
    try {
      setSubmitting(true);
      const payload: StockInPayload = {
        date: form.date || undefined,
        supplier_name: form.supplier_name || undefined,
        quantity: Number(form.quantity),
        unit_price: form.unit_price === "" ? undefined : Number(form.unit_price),
        reference: form.reference || undefined,
        shipment_mode: form.shipment_mode || undefined,
        shipment_reference: form.shipment_reference || undefined,
        notes: form.notes || undefined,
      };
      const res = await inventoryApi.stockIn(Number(form.material_id), payload);
      addToast({ variant: "success", message: res?.message || "Stock-in recorded" });
      // Reset minimal fields
      setForm((f) => ({ ...f, quantity: "", unit_price: "", reference: "" }));
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to record stock-in" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Stock In</h1>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Supplier name</span>
          <input
            type="text"
            value={form.supplier_name}
            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
            placeholder="e.g., ABC Traders"
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Material</span>
          <select
            value={form.material_id}
            onChange={(e) => setForm({ ...form, material_id: e.target.value ? Number(e.target.value) : "" })}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Select material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.material_code ? `${m.material_code} - ` : ""}{m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Quantity</span>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value === "" ? "" : Number(e.target.value) })}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Unit price (optional)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value === "" ? "" : Number(e.target.value) })}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Reference/Invoice number</span>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="INV-2025-0001"
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Shipment mode</span>
          <select
            value={form.shipment_mode}
            onChange={(e) => setForm({ ...form, shipment_mode: e.target.value as any })}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Select mode</option>
            <option value="Air">Air</option>
            <option value="Sea">Sea</option>
            <option value="Courier">Courier</option>
            <option value="Hand Carry">Hand Carry</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Shipment reference</span>
          <input
            type="text"
            value={form.shipment_reference}
            onChange={(e) => setForm({ ...form, shipment_reference: e.target.value })}
            placeholder="AWB/BL/Ref"
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Total cost (auto)</span>
          <div className="h-11 flex items-center rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
            {totalCost}
          </div>
        </div>

        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => router.push("/materials")}
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm dark:border-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Stock In"}
          </button>
        </div>
      </form>
    </div>
  );
}
