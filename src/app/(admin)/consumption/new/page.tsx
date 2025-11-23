"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { consumptionApi, type ConsumptionItemInput, materialApi, type Material } from "@/lib/api";

export default function NewConsumptionPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [articleCode, setArticleCode] = useState("");
  const [articleName, setArticleName] = useState("");
  const [articleColor, setArticleColor] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Array<{ material_name: string; quantity: number | ""; unit: string; source: string }>>([
    { material_name: "", quantity: "", unit: "", source: "" },
  ]);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [openSuggestIndex, setOpenSuggestIndex] = useState<number | null>(null);
  const [queryByIndex, setQueryByIndex] = useState<Record<number, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      // find the active query (first open index)
      const idx = openSuggestIndex;
      if (idx === null) return;
      const q = queryByIndex[idx] || "";
      if (q.length < 2) return;
      try {
        const res = await materialApi.getAllPaged({ page: 1, search: q });
        setMaterials(res.data || []);
      } catch {}
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [openSuggestIndex, queryByIndex]);

  if (!isAuthenticated) return null;

  const addRow = () => setRows((prev) => [...prev, { material_name: "", quantity: "", unit: "", source: "" }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!articleCode || !articleName) {
        addToast({ variant: "error", message: "Article code and name are required" });
        return;
      }
      const items: ConsumptionItemInput[] = rows
        .filter((r) => r.material_name && r.quantity)
        .map((r) => ({
          material_name: r.material_name,
          quantity: Number(r.quantity),
          unit: r.unit || undefined,
          source: r.source || undefined,
        }));
      if (items.length === 0) {
        addToast({ variant: "error", message: "Add at least one material row" });
        return;
      }
      // Use FormData when files attached
      if (file1 || file2) {
        const fd = new FormData();
        fd.append('article_code', articleCode);
        fd.append('article_name', articleName);
        if (articleColor) fd.append('article_color', articleColor);
        if (notes) fd.append('notes', notes);
        items.forEach((it, idx) => {
          fd.append(`items[${idx}][material_name]`, it.material_name);
          fd.append(`items[${idx}][quantity]`, String(it.quantity));
          if (it.unit) fd.append(`items[${idx}][unit]`, it.unit);
          if (it.source) fd.append(`items[${idx}][source]`, it.source);
        });
        if (file1) fd.append('file1', file1);
        if (file2) fd.append('file2', file2);
        await consumptionApi.create(fd);
      } else {
        await consumptionApi.create({
          article_code: articleCode,
          article_name: articleName,
          article_color: articleColor || undefined,
          notes: notes || undefined,
          items,
        });
      }
      addToast({ variant: "success", message: "Consumption list created" });
      setArticleCode("");
      setArticleName("");
      setArticleColor("");
      setNotes("");
      setRows([{ material_name: "", quantity: "", unit: "", source: "" }]);
      setFile1(null);
      setFile2(null);
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to create" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">New Consumption</h1>
        <Link href="/consumption" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Article Code</span>
            <input value={articleCode} onChange={(e) => setArticleCode(e.target.value)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Article Name</span>
            <input value={articleName} onChange={(e) => setArticleName(e.target.value)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Article Color</span>
            <input value={articleColor} onChange={(e) => setArticleColor(e.target.value)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Related file #1 (Excel/Doc/PDF)</span>
            <input type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.pdf" onChange={(e) => setFile1(e.target.files?.[0] || null)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Related file #2 (Excel/Doc/PDF)</span>
            <input type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.pdf" onChange={(e) => setFile2(e.target.files?.[0] || null)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Material Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-2 relative">
                      <input
                        value={row.material_name}
                        onFocus={() => setOpenSuggestIndex(idx)}
                        onBlur={() => setTimeout(() => setOpenSuggestIndex((cur) => (cur === idx ? null : cur)), 150)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, material_name: val } : r)));
                          setQueryByIndex((prev) => ({ ...prev, [idx]: val }));
                          if (!openSuggestIndex) setOpenSuggestIndex(idx);
                        }}
                        placeholder="Type to search..."
                        className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                      {openSuggestIndex === idx && (queryByIndex[idx]?.length || 0) >= 2 && (
                        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-lg border bg-white text-sm shadow-lg dark:border-gray-800 dark:bg-gray-900">
                          {materials.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500">No matches</div>
                          ) : (
                            materials.map((m) => {
                              const label = (m.material_code ? `${m.material_code} - ` : '') + m.name;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, material_name: label } : r)));
                                    setOpenSuggestIndex(null);
                                  }}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                  <span>{label}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-2">
                      <input type="number" min={1} value={row.quantity} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value === "" ? "" : Number(e.target.value) } : r))} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-6 py-2">
                      <input value={row.unit} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r))} placeholder="pcs, kg" className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                    </td>
                    <td className="px-6 py-2">
                      <input value={row.source} onChange={(e) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, source: e.target.value } : r))} placeholder="e.g., store" className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
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
          <Link href="/consumption" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</Link>
          <button disabled={submitting} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">{submitting ? "Saving..." : "Create Consumption"}</button>
        </div>
      </form>
    </div>
  );
}
