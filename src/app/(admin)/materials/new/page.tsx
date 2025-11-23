"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { materialApi } from "@/lib/api";

export default function NewMaterialPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [standardQuantity, setStandardQuantity] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraFields, setExtraFields] = useState<Record<string, string | number | boolean | Date>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f));
    else setImagePreview(null);
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
      fd.append("country_of_origin", country);
      if (quantity) fd.append("quantity", String(quantity));
      if (standardQuantity) fd.append("standard_quantity", String(standardQuantity));
      if (imageFile) fd.append("image", imageFile);
      if (Object.keys(extraFields).length > 0) {
        fd.append("extra_fields", JSON.stringify(extraFields));
      }
      await materialApi.create(fd);
      addToast({ variant: "success", title: "Saved", message: "Material created" });
      router.push("/materials");
    } catch (e: any) {
      addToast({ variant: "error", title: "Failed", message: e?.response?.data?.message || e?.message || "Could not save material" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Add material</h1>
        <Link href="/materials" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:max-w-2xl">
        <div>
          <Label>Material name</Label>
          <Input placeholder="Material name" defaultValue={name} onChange={(e: any) => setName(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Country of origin</Label>
          <Input placeholder="e.g., Bangladesh" defaultValue={country} onChange={(e: any) => setCountry(e.target?.value ?? "")} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={0}
              placeholder="Current quantity"
              defaultValue={quantity}
              onChange={(e: any) => setQuantity(e.target?.value ?? "")}
            />
          </div>
          <div>
            <Label>Standard quantity</Label>
            <Input
              type="number"
              min={0}
              placeholder="Standard quantity"
              defaultValue={standardQuantity}
              onChange={(e: any) => setStandardQuantity(e.target?.value ?? "")}
            />
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
          <Button disabled={submitting}>{submitting ? "Saving..." : "Save material"}</Button>
        </div>
      </form>
    </div>
  );
}
