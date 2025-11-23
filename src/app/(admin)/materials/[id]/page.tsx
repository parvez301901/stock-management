"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { materialApi, type Material, inventoryApi } from "@/lib/api";

function toDisplayDate(iso?: string) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

export default function MaterialViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const m = await materialApi.getById(id);
        if (!m) {
          addToast({ variant: "error", message: "Material not found" });
          router.push("/materials");
          return;
        }
        setMaterial(m);
      } catch (e: any) {
        addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to load material" });
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(id)) load();
  }, [id, addToast, router]);

  useEffect(() => {
    const loadTx = async () => {
      try {
        setTxLoading(true);
        setTxError("");
        const res = await inventoryApi.list({ page, material_id: id });
        const data = res as any;
        setTransactions(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.meta?.last_page ?? 1);
      } catch (e: any) {
        setTxError(e?.response?.data?.message || e?.message || "Failed to load transactions");
      } finally {
        setTxLoading(false);
      }
    };
    if (Number.isFinite(id)) loadTx();
  }, [id, page]);

  if (!isAuthenticated) return null;
  if (loading) return <div>Loading...</div>;
  if (!material) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Material</h1>
        <div className="flex gap-2">
          <Link href={`/materials/${material.id}/edit`} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Edit</Link>
          <Link href="/materials" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
        </div>
      </div>

      {/* Compact card */}
      <div className="rounded-lg border p-4 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          {material.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.image_url} alt={material.name} className="h-16 w-16 rounded object-cover" />
          ) : (
            <span className="inline-block h-16 w-16 rounded bg-gray-200" />
          )}
          <div>
            <div className="font-medium">{material.name}</div>
            {material.material_code && <div className="text-xs text-gray-500">{material.material_code}</div>}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Country</div>
          <div className="text-sm">{material.country_of_origin || '-'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Quantity</div>
            <div className="text-sm">{material.quantity ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Standard Qty</div>
            <div className="text-sm">{material.standard_quantity ?? '-'}</div>
          </div>
        </div>
      </div>

      {/* Inline transaction history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Transaction History</h2>
          <Link href={{ pathname: "/store/transactions", query: { material_id: material.id } }} className="text-sm text-brand-600 hover:underline">Open full list</Link>
        </div>
        {txError && (
          <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">{txError}</div>
        )}
        <div className="overflow-hidden rounded-lg border dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Shipment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Shipment Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Used Shipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {txLoading ? (
                <tr><td className="px-6 py-4" colSpan={5}>Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td className="px-6 py-4 text-sm" colSpan={5}>No transactions found.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm">{toDisplayDate(t.date)}</td>
                    <td className="px-6 py-4 text-sm capitalize">{t.type}</td>
                    <td className="px-6 py-4 text-sm">{t.quantity}</td>
                    <td className="px-6 py-4 text-sm">{t.shipment_mode || '-'}</td>
                    <td className="px-6 py-4 text-sm">{t.shipment_reference || '-'}</td>
                    <td className="px-6 py-4 text-sm">{t.used_shipment_number || '-'}</td>
                    <td className="px-6 py-4 text-sm">{t.reference || '-'}</td>
                    <td className="px-6 py-4 text-sm"><Link href={`/store/transactions/${t.id}`} className="text-brand-600 hover:underline">View/Edit</Link></td>
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
    </div>
  );
}
