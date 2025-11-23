"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";

interface LocalField {
  id: number;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  required: boolean;
}

export default function MaterialFieldsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [fields, setFields] = useState<LocalField[]>([]);
  const [keyValue, setKeyValue] = useState("");
  const [labelValue, setLabelValue] = useState("");
  const [typeValue, setTypeValue] = useState<LocalField["type"]>("text");
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue || !labelValue) {
      addToast({ variant: "error", title: "Validation", message: "Key and Label are required" });
      return;
    }
    const exists = fields.some((f) => f.key === keyValue);
    if (exists) {
      addToast({ variant: "error", title: "Duplicate", message: "A field with this key already exists" });
      return;
    }
    const newField: LocalField = {
      id: Date.now(),
      key: keyValue,
      label: labelValue,
      type: typeValue,
      required,
    };
    setFields((prev) => [newField, ...prev]);
    setKeyValue("");
    setLabelValue("");
    setTypeValue("text");
    setRequired(false);
    addToast({ variant: "success", title: "Added", message: "Field added (not saved to backend yet)" });
  };

  const onDelete = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    addToast({ variant: "success", title: "Deleted", message: "Field removed" });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Material Fields</h1>
      <form onSubmit={onAdd} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Key</Label>
          <Input placeholder="e.g., color" defaultValue={keyValue} onChange={(e: any) => setKeyValue(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Label</Label>
          <Input placeholder="e.g., Color" defaultValue={labelValue} onChange={(e: any) => setLabelValue(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Type</Label>
          <select
            value={typeValue}
            onChange={(e) => setTypeValue(e.target.value as any)}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
        <div className="flex items-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Required
          </label>
          <Button size="sm">Add Field</Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Label</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Required</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {fields.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-sm" colSpan={5}>No fields yet.</td>
              </tr>
            ) : (
              fields.map((f) => (
                <tr key={f.id}>
                  <td className="px-6 py-4 text-sm">{f.key}</td>
                  <td className="px-6 py-4 text-sm">{f.label}</td>
                  <td className="px-6 py-4 text-sm">{f.type}</td>
                  <td className="px-6 py-4 text-sm">{f.required ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button onClick={() => onDelete(f.id)} className="rounded bg-error-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-error-600">Delete</button>
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
