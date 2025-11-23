"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { materialApi, type Material, inventoryApi, articleApi, type Article } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function StockOutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleSearch, setArticleSearch] = useState("");

  const [form, setForm] = useState<{
    date: string;
    material_id: number | "";
    quantity: number | "";
    batch_no: string;
    article_id: number | "";
    reference: string;
    used_shipment_number: string;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    material_id: "",
    quantity: "",
    batch_no: "",
    article_id: "",
    reference: "",
    used_shipment_number: "",
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

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const res = await articleApi.getAll({ search: articleSearch });
        setArticles(Array.isArray(res) ? res : (res as any).data || []);
      } catch {}
    };
    const t = setTimeout(loadArticles, 300);
    return () => clearTimeout(t);
  }, [articleSearch]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.material_id || !form.quantity) {
      addToast({ variant: "error", message: "Material and quantity are required" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await inventoryApi.stockOut(Number(form.material_id), {
        date: form.date || undefined,
        quantity: Number(form.quantity),
        batch_no: form.batch_no || undefined,
        article_id: form.article_id ? Number(form.article_id) : undefined,
        reference: form.reference || undefined,
        used_shipment_number: form.used_shipment_number || undefined,
        notes: form.notes || undefined,
      });
      addToast({ variant: "success", message: res?.message || "Stock-out recorded" });
      setForm((f) => ({ ...f, quantity: "", reference: "", batch_no: "" }));
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to record stock-out" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Stock Out</h1>

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
          <span className="text-sm text-gray-600 dark:text-gray-300">Used for Article</span>
          <input
            placeholder="Search article by name or code"
            value={articleSearch}
            onChange={(e) => setArticleSearch(e.target.value)}
            className="mb-2 h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <select value={form.article_id} onChange={(e) => setForm({ ...form, article_id: e.target.value ? Number(e.target.value) : "" })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="">Select article</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id as any}>
                {a.title}
              </option>
            ))}
          </select>
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
          <span className="text-sm text-gray-600 dark:text-gray-300">Quantity used</span>
          <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value === "" ? "" : Number(e.target.value) })} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Production batch/order number</span>
          <input type="text" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} placeholder="Batch/Order No" className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Reference/Invoice number</span>
          <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="REF-0001" className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Used shipment number</span>
          <input type="text" value={form.used_shipment_number} onChange={(e) => setForm({ ...form, used_shipment_number: e.target.value })} placeholder="SHIP-0001" className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push("/store/transactions")} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">
            {submitting ? "Saving..." : "Save Stock Out"}
          </button>
        </div>
      </form>
    </div>
  );
}
