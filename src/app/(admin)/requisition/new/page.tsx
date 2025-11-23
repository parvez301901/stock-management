"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { articleApi, materialApi, type Article, type Material } from "@/lib/api";
import { requisitionApi, type RequisitionItemInput } from "@/lib/api";

export default function NewRequisitionPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [articleSearch, setArticleSearch] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [articleId, setArticleId] = useState<number | "">("");
  const [items, setItems] = useState<Array<{ material_id: number | ""; qty: number | ""; unit: string; notes: string }>>([
    { material_id: "", qty: "", unit: "", notes: "" },
  ]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadMaterials = async () => {
      try {
        const res = await materialApi.getAllPaged({ page: 1 });
        setMaterials(res.data || []);
      } catch {}
    };
    loadMaterials();
  }, [isAuthenticated]);

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

  const addRow = () => setItems((prev) => [...prev, { material_id: "", qty: "", unit: "", notes: "" }]);
  const removeRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        article_id: articleId === "" ? undefined : Number(articleId),
        notes: notes || undefined,
        items: items
          .filter((it) => it.material_id && it.qty)
          .map<RequisitionItemInput & { unit?: string }>((it) => ({
            material_id: Number(it.material_id),
            qty: Number(it.qty),
            unit: it.unit || undefined,
            notes: it.notes || undefined,
          })),
      };
      if (!payload.items.length) {
        addToast({ variant: "error", message: "Add at least one material row" });
        return;
      }
      await requisitionApi.create(payload);
      addToast({ variant: "success", message: "Requisition submitted" });
      setArticleId("");
      setItems([{ material_id: "", qty: "", unit: "", notes: "" }]);
      setNotes("");
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to submit" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">New Requisition</h1>
        <Link href="/requisition" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Article (optional)</span>
            <input
              placeholder="Search article by name or code"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="mb-2 h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <select value={articleId} onChange={(e) => setArticleId(e.target.value ? Number(e.target.value) : "")} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="">Select article</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id as any}>{a.title}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Materials</h2>
            <button type="button" onClick={addRow} className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-800">Add Row</button>
          </div>
          <div className="overflow-hidden rounded-lg border dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-2">
                      <select value={row.material_id} onChange={(e) => setItems((prev) => prev.map((r, i) => i === idx ? { ...r, material_id: e.target.value ? Number(e.target.value) : "" } : r))} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                        <option value="">Select material</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id as any}>{m.material_code ? `${m.material_code} - ` : ""}{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-2">
                      <input type="number" min={1} value={row.qty} onChange={(e) => setItems((prev) => prev.map((r, i) => i === idx ? { ...r, qty: e.target.value === "" ? "" : Number(e.target.value) } : r))} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-6 py-2">
                      <input type="text" placeholder="e.g., pcs, kg" value={row.unit} onChange={(e) => setItems((prev) => prev.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r))} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-6 py-2">
                      <input type="text" value={row.notes} onChange={(e) => setItems((prev) => prev.map((r, i) => i === idx ? { ...r, notes: e.target.value } : r))} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-6 py-2">
                      <button type="button" onClick={() => removeRow(idx)} className="text-error-600 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Notes</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/requisition" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</Link>
          <button disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">{submitting ? "Submitting..." : "Submit Requisition"}</button>
        </div>
      </form>
    </div>
  );
}
