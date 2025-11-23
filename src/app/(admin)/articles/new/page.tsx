"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { articleApi, extraFieldsApi, type ExtraField } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";

export default function NewArticlePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [publicationDate, setPublicationDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0]
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [availableFields, setAvailableFields] = useState<ExtraField[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    if (!token) return;
    (async () => {
      try {
        const fields = await extraFieldsApi.list(token);
        setAvailableFields(fields);
        const initSel: Record<string, boolean> = {};
        for (const f of fields) initSel[f.key] = true;
        setSelected(initSel);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(image);
    return () => reader.abort();
  }, [image]);

  const onToggleSelected = (key: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [key]: checked }));
    if (!checked) {
      setFieldValues((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim() || !author.trim() || !publicationDate) {
      setError("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("author_name", author);
      fd.append("publication_date", publicationDate);
      if (image) fd.append("image", image);

      const payload: Record<string, any> = {};
      for (const f of availableFields) {
        if (!selected[f.key]) continue;
        const val = fieldValues[f.key];
        if (f.required && (val === undefined || val === null || String(val) === "")) {
          setSubmitting(false);
          setError(`Field "${f.label}" is required`);
          return;
        }
        if (val !== undefined) {
          const casted = f.type === "number" ? Number(val) : f.type === "boolean" ? Boolean(val) : val;
          payload[f.key] = casted;
        }
      }
      if (Object.keys(payload).length > 0) {
        fd.append("extra_fields", JSON.stringify(payload));
      }

      await articleApi.create(fd as unknown as FormData);
      router.push("/articles");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create article");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Create New Article</h1>
        <Link
          href="/articles"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          ← Back to Articles
        </Link>
      </div>

      {error && (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Article title"
              defaultValue={title}
              onChange={(e: any) => setTitle(e.target?.value ?? "")}
            />
          </div>
          <div>
            <Label>Content</Label>
            <textarea
              rows={10}
              placeholder="Write your content..."
              className="h-auto w-full rounded-lg border bg-transparent px-4 py-3 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              defaultValue={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>Author Name</Label>
              <Input
                placeholder="Author"
                defaultValue={author}
                onChange={(e: any) => setAuthor(e.target?.value ?? "")}
              />
            </div>
            <div>
              <Label>Publication Date</Label>
              <Input
                type="date"
                defaultValue={publicationDate}
                onChange={(e: any) => setPublicationDate(e.target?.value ?? publicationDate)}
              />
            </div>
          </div>
          <div>
            <Label>Article Image (Optional)</Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {image?.name || "No file chosen"}
              </span>
            </div>
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="Preview" className="h-32 w-32 rounded-md object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-1">
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Custom Fields</h2>
              <Link href="/articles/fields" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
                Manage Fields
              </Link>
            </div>
            {availableFields.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No saved fields. Use Manage Fields to create reusable fields.</p>
            ) : (
              <div className="space-y-3">
                {availableFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={!!selected[f.key]}
                        onChange={(e) => onToggleSelected(f.key, e.target.checked)}
                      />
                      <span>
                        {f.label} <span className="text-xs text-gray-500">({f.key})</span>
                        {f.required ? " *" : ""}
                      </span>
                    </label>
                    {f.type !== "boolean" ? (
                      <input
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                        disabled={!selected[f.key]}
                        value={fieldValues[f.key] ?? ""}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    ) : (
                      <div>
                        <input
                          type="checkbox"
                          disabled={!selected[f.key]}
                          checked={Boolean(fieldValues[f.key])}
                          onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        />
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">Type: {f.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/articles" className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm dark:border-gray-800">
              Cancel
            </Link>
            <Button disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Article"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
