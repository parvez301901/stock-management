"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { articleApi, extraFieldsApi, type ExtraField } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { isAuthenticated, ready } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [articleId, setArticleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [publicationDate, setPublicationDate] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [currentFile1Url, setCurrentFile1Url] = useState<string | null>(null);
  const [currentFile2Url, setCurrentFile2Url] = useState<string | null>(null);

  const [availableFields, setAvailableFields] = useState<ExtraField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await articleApi.getBySlug(params.slug);
        if (!data) {
          setError("Article not found");
          return;
        }
        setArticleId(data.id ?? null);
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        setAuthor(data.author_name ?? "");
        setPublicationDate(
          data.publication_date ? new Date(data.publication_date).toISOString().split("T")[0] : ""
        );
        setPreview(data.image_url ?? null);
        setCurrentFile1Url(data.file1_url ?? data.file1_path ?? null);
        setCurrentFile2Url(data.file2_url ?? data.file2_path ?? null);
        setFieldValues(data.extra_fields ?? {});

        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        if (token) {
          const fields = await extraFieldsApi.list(token);
          setAvailableFields(fields);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, ready, params.slug, router]);

  useEffect(() => {
    if (!image) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(image);
    return () => reader.abort();
  }, [image]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId) return;
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("author_name", author);
      if (publicationDate) fd.append("publication_date", publicationDate);
      if (image) fd.append("image", image);
      if (file1) fd.append("file1", file1);
      if (file2) fd.append("file2", file2);
      if (fieldValues && Object.keys(fieldValues).length > 0) {
        fd.append("extra_fields", JSON.stringify(fieldValues));
      }
      await articleApi.update(articleId, fd as unknown as FormData);
      router.push(`/articles/${params.slug}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update article");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Edit Article</h1>
        <div className="flex gap-2">
          <Link href="/articles" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">
            Cancel
          </Link>
          <Button disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-500" />
        </div>
      ) : error ? (
        <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div>
              <Label>Title</Label>
              <Input placeholder="Article title" defaultValue={title} onChange={(e: any) => setTitle(e.target?.value ?? "")} />
            </div>

            {/* Content field removed */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Author Name</Label>
                <Input placeholder="Author" defaultValue={author} onChange={(e: any) => setAuthor(e.target?.value ?? "")} />
              </div>
              <div>
                <Label>Publication Date</Label>
                <Input type="date" defaultValue={publicationDate} onChange={(e: any) => setPublicationDate(e.target?.value ?? publicationDate)} />
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
              <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Attachments</h2>
              <div className="space-y-4">
                {currentFile1Url && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-300 mr-2">Current Attachment 1:</span>
                    <a href={currentFile1Url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">View</a>
                  </div>
                )}
                <div>
                  <Label>Replace Attachment 1</Label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                    onChange={(e) => setFile1(e.target.files?.[0] ?? null)}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{file1?.name || (currentFile1Url ? "Existing" : "No file chosen")}</div>
                </div>

                {currentFile2Url && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-300 mr-2">Current Attachment 2:</span>
                    <a href={currentFile2Url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">View</a>
                  </div>
                )}
                <div>
                  <Label>Replace Attachment 2</Label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                    onChange={(e) => setFile2(e.target.files?.[0] ?? null)}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{file2?.name || (currentFile2Url ? "Existing" : "No file chosen")}</div>
                </div>
              </div>
            </div>

            {availableFields.length > 0 && (
              <div className="rounded-lg border p-4 dark:border-gray-800">
                <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Custom Fields</h2>
                <div className="space-y-3">
                  {availableFields.map((f) => (
                    <div key={f.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {f.label} <span className="text-xs text-gray-500">({f.key})</span>
                        {f.required ? " *" : ""}
                      </div>
                      {f.type !== "boolean" ? (
                        <input
                          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          value={fieldValues[f.key] ?? ""}
                          onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                        />
                      ) : (
                        <div>
                          <input
                            type="checkbox"
                            checked={Boolean(fieldValues[f.key])}
                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                          />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">Type: {f.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link href={`/articles/${params.slug}`} className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm dark:border-gray-800">
                Back
              </Link>
              <Button disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
