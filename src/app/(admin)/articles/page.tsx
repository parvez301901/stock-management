"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { articleApi, extraFieldsApi, type Article, type ExtraField, type PaginatedResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableFields, setAvailableFields] = useState<ExtraField[]>([]);
  const [extraFilters, setExtraFilters] = useState<Record<string, string | number | boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        if (token) {
          const fields = await extraFieldsApi.list(token);
          setAvailableFields(fields);
        }
      } catch {}
    })();

    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, ready]);

  const fetchArticles = async (query = "", nextPage = page) => {
    try {
      setIsLoading(true);
      setError("");
      const params: Record<string, any> = { page: nextPage };
      if (query.trim()) params.search = query.trim();
      Object.entries(extraFilters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v) !== "") {
          params[`extra_${k}`] = v;
        }
      });
      const resp: PaginatedResponse<Article> = await articleApi.getAllPaged(params);
      setArticles(resp.data);
      setTotalPages(resp.meta?.last_page ?? 1);
    } catch (err) {
      setError("Failed to load articles. Please try again.");
      console.error("Error fetching articles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery);
  };

  // Auto-search on typing with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (isAuthenticated) fetchArticles(searchQuery, 1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onChangeFilter = (key: string, value: string | number | boolean) => {
    setExtraFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      setIsLoading(true);
      await articleApi.delete(id);
      await fetchArticles(searchQuery, page);
      addToast({ variant: "success", title: "Deleted", message: "Article deleted" });
    } catch (e) {
      setError("Failed to delete article");
      addToast({ variant: "error", title: "Delete failed", message: "Unable to delete article" });
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = async (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    await fetchArticles(searchQuery, p);
  };

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Articles</h1>
          <a
            href="/articles/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            New Article
          </a>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, content, or author..."
            className="flex-1 h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            aria-label="Search articles"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {availableFields.length > 0 && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Filter by Custom Fields</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {availableFields.map((f) => (
                <div key={f.key} className="flex flex-col">
                  <label className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                    {f.label} <span className="text-xs text-gray-400">({f.key})</span>
                  </label>
                  {f.type !== "boolean" ? (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={String(extraFilters[f.key] ?? "")}
                      onChange={(e) => onChangeFilter(f.key, e.target.value)}
                      className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(extraFilters[f.key])}
                        onChange={(e) => onChangeFilter(f.key, e.target.checked)}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Yes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchArticles(searchQuery);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Apply Filters
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setExtraFilters({});
                  fetchArticles(searchQuery);
                }}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm dark:border-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-500" />
          </div>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <div key={article.id} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900/40 dark:ring-1 dark:ring-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white/90">{article.title}</h2>
                  <p className="mb-3 text-gray-600 dark:text-gray-400">{(article.content || "").slice(0, 160)}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Posted on
                    {article.created_at || article.publication_date
                      ? ` ${new Date((article.created_at || article.publication_date) as string).toLocaleDateString()}`
                      : " —"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center justify-center rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  >
                    View
                  </a>
                  <a
                    href={`/articles/${article.slug}/edit`}
                    className="inline-flex items-center justify-center rounded bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => { setPendingDeleteId(article.id ?? null); setConfirmOpen(true); }}
                    className="inline-flex items-center justify-center rounded bg-error-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-error-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <a
                href={`/articles/${article.slug}`}
                className="mt-4 inline-block text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Read More →
              </a>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">No articles found.</p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchArticles("");
                }}
                className="mt-4 text-brand-600 hover:underline dark:text-brand-400"
              >
                Clear search and show all articles
              </button>
            )}
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-800"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).slice(0, 10).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    p === page
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "border dark:border-gray-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
        }}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      />
    </div>
  );
}
