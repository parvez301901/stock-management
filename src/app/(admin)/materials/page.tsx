"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { materialApi, type Material } from "@/lib/api";

export default function MaterialsListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await materialApi.getAllPaged({ search });
        setMaterials(res.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    // Basic client fallback filter including extra fields string matching
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => {
      const base = `${m.name} ${m.country_of_origin || ""}`.toLowerCase();
      const extras = m.extra_fields ? Object.values(m.extra_fields).join(" ").toLowerCase() : "";
      return base.includes(q) || extras.includes(q);
    });
  }, [materials, search]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Materials</h1>
        <Link
          href="/materials/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Add material
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          placeholder="Search by name, country or extra fields..."
          className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link href="/materials/fields" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Fields</Link>
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name / Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Standard Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Extra Fields</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-4" colSpan={4}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-sm" colSpan={6}>No materials found.</td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className={m.standard_quantity && m.quantity !== undefined && m.quantity !== null && m.quantity < m.standard_quantity ? "bg-orange-50 dark:bg-orange-500/10" : ""}>
                  <td className="px-6 py-4 text-sm">
                    {m.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <span className="inline-block h-10 w-10 rounded bg-gray-200" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <Link href={`/materials/${m.id}`} className="text-brand-600 hover:underline">{m.name}</Link>
                      {m.material_code && (
                        <span className="text-xs text-gray-500">{m.material_code}</span>
                      )}
                      {(m as any).latest_shipment_mode || (m as any).latest_shipment_reference ? (
                        <span className="text-xs text-gray-500">
                          {(m as any).latest_shipment_mode || '-'}
                          {((m as any).latest_shipment_reference ? ` • ${(m as any).latest_shipment_reference}` : '')}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{m.country_of_origin}</td>
                  <td className="px-6 py-4 text-sm">{m.quantity ?? 0}</td>
                  <td className="px-6 py-4 text-sm">{m.standard_quantity ?? "-"}</td>
                  <td className="px-6 py-4 text-sm truncate max-w-[420px]">
                    {m.extra_fields && Object.keys(m.extra_fields).length > 0
                      ? Object.entries(m.extra_fields).map(([key, value], index, arr) => (
                          <span key={key}>
                            {key}: {String(value)}
                            {index < arr.length - 1 ? ", " : ""}
                          </span>
                        ))
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link href={`/materials/${m.id}`} className="text-brand-600 hover:underline">View</Link>
                      <Link href={`/materials/${m.id}/edit`} className="text-brand-600 hover:underline">Edit</Link>
                    </div>
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
