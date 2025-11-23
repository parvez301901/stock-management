"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { materialApi, type Material } from "@/lib/api";

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState<string | "">("");
  const [country, setCountry] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [standardQuantity, setStandardQuantity] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraFields, setExtraFields] = useState<Record<string, string | number | boolean | Date>>({});

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const m = await materialApi.getById(id);
        if (!m) {
          addToast({ variant: "error", title: "Not found", message: "Material not found" });
          router.push("/materials");
          return;
        }
        setMaterial(m);
        setName(m.name);
        setCode(m.material_code ?? "");
        setCountry(m.country_of_origin || "");
        setQuantity(m.quantity != null ? String(m.quantity) : "");
        setStandardQuantity(m.standard_quantity != null ? String(m.standard_quantity) : "");
        setExtraFields(m.extra_fields || {});
        setImagePreview(m.image_url || null);
      } catch (e: any) {
        addToast({ variant: "error", title: "Error", message: e?.response?.data?.message || e?.message || "Failed to load material" });
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(id)) load();
  }, [id, addToast, router]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const onAddExtraField = () => {
    const key = prompt("Enter field key (e.g., color)")?.trim();
    if (!key) return;
    if (extraFields[key] !== undefined) return;
    setExtraFields((prev) => ({ ...prev, [key]: "" }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast({ variant: "error", title: "Validation", message: "Material name is required" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      if (code !== "") fd.append("material_code", code);
      fd.append("country_of_origin", country);
      if (quantity !== "") fd.append("quantity", String(quantity));
      if (standardQuantity !== "") fd.append("standard_quantity", String(standardQuantity));
      if (imageFile) fd.append("image", imageFile);
      if (Object.keys(extraFields).length > 0) {
        fd.append("extra_fields", JSON.stringify(extraFields));
      }
      await materialApi.update(id, fd);
      addToast({ variant: "success", title: "Saved", message: "Material updated" });
      router.push("/materials");
    } catch (e: any) {
      addToast({ variant: "error", title: "Failed", message: e?.response?.data?.message || e?.message || "Could not update material" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Edit material</h1>
        <Link href="/materials" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:max-w-2xl">
        <div>
          <Label>Material name</Label>
          <Input placeholder="Material name" defaultValue={name} onChange={(e: any) => setName(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Material code</Label>
          <Input placeholder="Optional unique code" defaultValue={code} onChange={(e: any) => setCode(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Country of origin</Label>
          <Input placeholder="e.g., Bangladesh" defaultValue={country} onChange={(e: any) => setCountry(e.target?.value ?? "")} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Quantity</Label>
            <Input type="number" min={0} placeholder="Current quantity" defaultValue={quantity} onChange={(e: any) => setQuantity(e.target?.value ?? "")} />
          </div>
          <div>
            <Label>Standard quantity</Label>
            <Input type="number" min={0} placeholder="Standard quantity" defaultValue={standardQuantity} onChange={(e: any) => setStandardQuantity(e.target?.value ?? "")} />
          </div>
        </div>
        <div>
          <Label>Image</Label>
          <input type="file" accept="image/*" onChange={onImageChange} />
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="mt-3 h-24 w-24 rounded object-cover" />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Extra fields</Label>
            <button type="button" onClick={onAddExtraField} className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10">Add field</button>
          </div>
          <div className="space-y-3">
            {Object.entries(extraFields).map(([key, val]) => (
              <div key={key} className="grid grid-cols-2 gap-3">
                <Input defaultValue={key} disabled />
                <Input defaultValue={String(val ?? "")} onChange={(e: any) => setExtraFields((prev) => ({ ...prev, [key]: e.target?.value ?? "" }))} />
              </div>
            ))}
            {Object.keys(extraFields).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No extra fields added yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/materials" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</Link>
          <Button disabled={submitting}>{submitting ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
