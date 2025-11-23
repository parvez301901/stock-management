"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { requisitionApi } from "@/lib/api";

export default function RequisitionDetailPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await requisitionApi.show(id);
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load requisition");
    } finally {
      setLoading(false);
    }
  };

  // Compute low stock warnings
  const shortages = useMemo(() => {
    const items: Array<{ id: number; name: string; code?: string | null; need: number; have: number }> = [];
    if (!data?.items) return items;
    for (const it of data.items) {
      const have = Number(it.material?.quantity ?? 0);
      const need = Number(it.qty ?? 0);
      if (need > have) {
        items.push({
          id: it.material?.id,
          name: it.material?.name,
          code: it.material?.material_code ?? null,
          need,
          have,
        } as any);
      }
    }
    return items;
  }, [data]);

  const onApprove = () => {
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (Number.isFinite(id)) load();
  }, [id]);

  const canAct = data?.status === "pending";

  const actuallyApprove = async () => {
    try {
      setSaving(true);
      await requisitionApi.approve(id, { approval_note: approvalNote || undefined });
      addToast({ variant: "success", message: "Requisition approved and stock reduced" });
      await load();
      setConfirmOpen(false);
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to approve" });
    } finally {
      setSaving(false);
    }
  };

  const onReject = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Reject this requisition?')) return;
    try {
      setSaving(true);
      await requisitionApi.reject(id);
      addToast({ variant: "success", message: "Requisition rejected" });
      await load();
    } catch (e: any) {
      addToast({ variant: "error", message: e?.response?.data?.message || e?.message || "Failed to reject" });
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
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Requisition #{data?.id}</h1>
        <div className="flex items-center gap-3">
          <Link href="/requisition" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
          {canAct && (
            <>
              <button disabled={saving} onClick={onReject} className="rounded-lg border px-4 py-2 text-sm text-error-600 dark:border-gray-800">Reject</button>
              <button disabled={saving} onClick={onApprove} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">Approve</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500">Status</div>
          <div className="text-sm capitalize">{data?.status}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Article</div>
          <div className="text-sm">{data?.article?.title || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Requested By</div>
          <div className="text-sm">{data?.requester?.name || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Created</div>
          <div className="text-sm">{data?.created_at ? new Date(data.created_at).toLocaleString() : '-'}</div>
        </div>
        <div className="md:col-span-3">
          <div className="text-xs text-gray-500">Notes</div>
          <div className="text-sm whitespace-pre-wrap">{data?.notes || '-'}</div>
        </div>
        {data?.approval_note && (
          <div className="md:col-span-3">
            <div className="text-xs text-gray-500">Approval Note</div>
            <div className="text-sm whitespace-pre-wrap">{data?.approval_note}</div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 font-medium">Items</div>
        <div className="overflow-hidden rounded-lg border dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {(data?.items || []).map((it: any) => (
                <tr key={it.id}>
                  <td className="px-6 py-3 text-sm">{it.material?.material_code ? `${it.material.material_code} - ` : ""}{it.material?.name}</td>
                  <td className="px-6 py-3 text-sm">{it.qty}</td>
                  <td className="px-6 py-3 text-sm">{it.unit || '-'}</td>
                  <td className="px-6 py-3 text-sm">{it.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 text-lg font-semibold">Confirm Approval</div>
            {shortages.length > 0 && (
              <div className="mb-4 rounded border border-warning-300 bg-warning-50 p-3 text-sm text-warning-800 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-300">
                The following items exceed current stock:
                <ul className="mt-2 list-disc pl-5">
                  {shortages.map((s) => (
                    <li key={s.id}>{s.code ? `${s.code} - ` : ""}{s.name}: need {s.need}, have {s.have}</li>
                  ))}
                </ul>
              </div>
            )}
            <label className="mb-4 flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Approval note (optional)</span>
              <textarea rows={3} value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</button>
              <button disabled={saving} onClick={actuallyApprove} className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60">{saving ? 'Approving...' : 'Approve'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
