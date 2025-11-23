"use client";
import React, { useEffect, useMemo, useState } from "react";
import { brandingApi, type BrandingSettings } from "@/lib/api";

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BrandingSettings>({});
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await brandingApi.get();
        setData(res || {});
        setName(res?.company_name || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return data?.company_logo_url || "";
  }, [logoFile, data?.company_logo_url]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("company_name", name);
      if (logoFile) payload.append("company_logo", logoFile);
      if (clearLogo) payload.append("company_logo_clear", "true");
      const res = await brandingApi.update(payload);
      setData(res || {});
      setLogoFile(null);
      setClearLogo(false);
      setName(res?.company_name || "");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Branding</h1>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Branding</h1>

      <form onSubmit={onSubmit} className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Company Logo</label>
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <img src={logoPreview} alt="Logo preview" className="h-12 w-auto rounded" />
            </div>
          ) : (
            <div className="text-xs text-gray-500">No logo set</div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="block text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              id="clearLogo"
              type="checkbox"
              checked={clearLogo}
              onChange={(e) => setClearLogo(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="clearLogo" className="text-sm">Clear existing logo</label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
