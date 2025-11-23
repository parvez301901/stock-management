"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { inventoryApi, type StockInPayload } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [tx, setTx] = useState<any | null>(null);

  const [form, setForm] = useState<{
    date: string;
    supplier_name: string;
    quantity: string;
    unit_price: string;
    reference: string;
    shipment_mode: '' | 'Air' | 'Sea' | 'Courier' | 'Hand Carry';
    shipment_reference: string;
    used_shipment_number: string;
    notes: string;
  }>({ date: "", supplier_name: "", quantity: "", unit_price: "", reference: "", shipment_mode: "", shipment_reference: "", used_shipment_number: "", notes: "" });

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const t = await inventoryApi.get(id);
        setTx(t);
        setForm({
          date: t?.date || "",
          supplier_name: t?.supplier_name || "",
          quantity: String(t?.quantity ?? ""),
          unit_price: t?.unit_price != null ? String(t.unit_price) : "",
          reference: t?.reference || "",
          shipment_mode: (t?.shipment_mode as any) || "",
          shipment_reference: t?.shipment_reference || "",
          used_shipment_number: t?.used_shipment_number || "",
          notes: t?.notes || "",
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load transaction");
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(id)) load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Partial<StockInPayload> & { used_shipment_number?: string } = {
        date: form.date || undefined,
        supplier_name: form.supplier_name || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit_price: form.unit_price === "" ? undefined : Number(form.unit_price),
        reference: form.reference || undefined,
        shipment_mode: form.shipment_mode || undefined,
        shipment_reference: form.shipment_reference || undefined,
        used_shipment_number: form.used_shipment_number || undefined,
        notes: form.notes || undefined,
      };
      const updated = await inventoryApi.update(id, payload);
      setTx(updated);
      addToast({ variant: "success", message: "Transaction updated" });
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Transaction #{tx?.id}</h1>
        <Link href="/store/transactions" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Material</div>
          <div className="text-sm">{tx?.material?.material_code ? `${tx.material.material_code} - ` : ""}{tx?.material?.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Type</div>
          <div className="text-sm capitalize">{tx?.type}</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Date</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Supplier name</span>
          <input type="text" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Quantity</span>
          <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Unit price</span>
          <input type="number" step="0.01" min={0} value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Reference</span>
          <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Shipment mode</span>
          <select value={form.shipment_mode} onChange={(e) => setForm({ ...form, shipment_mode: e.target.value as any })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="">Select mode</option>
            <option value="Air">Air</option>
            <option value="Sea">Sea</option>
            <option value="Courier">Courier</option>
            <option value="Hand Carry">Hand Carry</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Shipment reference</span>
          <input type="text" value={form.shipment_reference} onChange={(e) => setForm({ ...form, shipment_reference: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Used shipment number</span>
          <input type="text" value={form.used_shipment_number} onChange={(e) => setForm({ ...form, used_shipment_number: e.target.value })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <Link href="/store/transactions" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
