"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { inventoryApi, materialApi, type Material } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function TransactionsListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | "">("");
  const [totalPages, setTotalPages] = useState(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState<number | "">("");
  const [from, setFrom] = useState(""); // DD-MM-YYYY
  const [to, setTo] = useState("");   // DD-MM-YYYY

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    // load materials for filter
    const loadMaterials = async () => {
      try {
        const res = await materialApi.getAllPaged({ page: 1 });
        setMaterials(res.data || []);
      } catch {}
    };
    loadMaterials();

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        // convert DD-MM-YYYY to YYYY-MM-DD
        const toIso = (d: string) => {
          const parts = d.split("-");
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return undefined as any;
        };
        const res = await inventoryApi.list({
          page,
          search: search || undefined,
          type: (type as any) || undefined,
          material_id: materialId === "" ? undefined : Number(materialId),
          from: from ? toIso(from) : undefined,
          to: to ? toIso(to) : undefined,
        });
        const data = (res as any);
        setItems(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.meta?.last_page ?? 1);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [page, search, type, materialId, from, to]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">All Stock In/Out</h1>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <input
          placeholder="Search supplier, reference, material name/code"
          className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          <option value="">All</option>
          <option value="in">In</option>
          <option value="out">Out</option>
          <option value="adjust">Adjust</option>
          <option value="store_to_factory">Store to factory</option>
        </select>
        <select
          value={materialId}
          onChange={(e) => { setMaterialId(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
          className="h-11 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          <option value="">All Materials</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id as any}>{m.material_code ? `${m.material_code} - ` : ""}{m.name}</option>
          ))}
        </select>
        <input
          placeholder="From (DD-MM-YYYY)"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="h-11 w-44 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <input
          placeholder="To (DD-MM-YYYY)"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="h-11 w-44 rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Shipment Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Shipment Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Used Shipment</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-4" colSpan={10}>Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-sm" colSpan={10}>No transactions found.</td>
              </tr>
            ) : (
              items.map((t: any) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 text-sm">{t.id}</td>
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm capitalize">{t.type}</td>
                  <td className="px-6 py-4 text-sm">
                    {t.material?.material_code ? `${t.material.material_code} - ` : ""}{t.material?.name}
                  </td>
                  <td className="px-6 py-4 text-sm">{t.supplier_name || "-"}</td>
                  <td className="px-6 py-4 text-sm">{t.quantity}</td>
                  <td className="px-6 py-4 text-sm">{t.unit_price ?? "-"}</td>
                  <td className="px-6 py-4 text-sm">{t.total_cost ?? "-"}</td>
                  <td className="px-6 py-4 text-sm">{t.shipment_mode || '-'}</td>
                  <td className="px-6 py-4 text-sm">{t.shipment_reference || '-'}</td>
                  <td className="px-6 py-4 text-sm">{t.used_shipment_number || '-'}</td>
                  <td className="px-6 py-4 text-sm">{t.reference || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/store/transactions/${t.id}`} className="text-brand-600 hover:underline">View/Edit</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800 disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          disabled={page >= totalPages}
          className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}
