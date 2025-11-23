"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { articleApi } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { isAuthenticated, ready } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("\u00A0");
  const [article, setArticle] = useState<any>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await articleApi.getBySlug(params.slug);
        if (!data) {
          setError("Article not found");
          return;
        }
        setArticle(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, ready, params.slug, router]);

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Article Details</h1>
        <div className="flex gap-2">
          <Link href="/articles" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">
            Back
          </Link>
          {article?.slug && (
            <Link
              href={`/articles/${article.slug}/edit`}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Edit
            </Link>
          )}
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
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900/40 dark:ring-1 dark:ring-white/5">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white/90">{article.title}</h2>
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            By {article.author_name} • {article.publication_date ? new Date(article.publication_date).toLocaleDateString() : "—"}
          </div>
          {article.image_url && (
            <img src={article.image_url} alt={article.title} className="mb-4 max-h-80 w-auto rounded" />
          )}
          {/* Content removed */}

          {article.extra_fields && (
            <div className="mt-6">
              <h3 className="mb-2 text-base font-semibold">Custom Fields</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(article.extra_fields).map(([k, v]) => (
                  <div key={k} className="rounded border p-3 text-sm dark:border-gray-800">
                    <div className="text-gray-500">{k}</div>
                    <div className="font-medium text-gray-800 dark:text-white/90">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(article.file1_url || article.file2_url) && (
            <div className="mt-6">
              <h3 className="mb-2 text-base font-semibold">Attachments</h3>
              <div className="flex flex-col gap-2 text-sm">
                {article.file1_url && (
                  <a href={article.file1_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                    Download Attachment 1
                  </a>
                )}
                {article.file2_url && (
                  <a href={article.file2_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                    Download Attachment 2
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
