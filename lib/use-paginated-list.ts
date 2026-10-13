import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "./api";
import type { Paginated } from "./types";

const DEFAULT_LIMIT = 20;

/**
 * Infinite-scroll pagination for any endpoint that returns { data, page, totalPages }.
 *
 * `fetchPage` must be stable per filter combination — wrap it in `useCallback` at the
 * call site with your filters (city, subject, etc.) as deps. This hook reloads from
 * page 1 automatically whenever `fetchPage`'s identity changes.
 */
export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<Paginated<T>>,
  limit: number = DEFAULT_LIMIT,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meta, setMeta] = useState<Omit<Paginated<T>, "data"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow earlier request overwriting a newer one (e.g. filters
  // changed twice quickly) — only the most recently *started* request may apply its result.
  const requestId = useRef(0);

  const runLoad = useCallback(
    async (targetPage: number, mode: "initial" | "refresh" | "more") => {
      const id = ++requestId.current;
      try {
        const res = await fetchPage(targetPage, limit);
        if (id !== requestId.current) return;
        setItems((prev) => (mode === "more" ? [...prev, ...res.data] : res.data));
        setPage(targetPage);
        setTotalPages(res.totalPages ?? 1);
        setMeta(res);
        setError(null);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(apiErrorMessage(e));
      } finally {
        if (id !== requestId.current) return;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchPage, limit],
  );

  useEffect(() => {
    setLoading(true);
    runLoad(1, "initial");
    // Intentionally depends only on fetchPage: the caller's useCallback deps (filters,
    // role, etc.) are what should trigger a fresh page-1 load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    runLoad(1, "refresh");
  }, [runLoad]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || page >= totalPages) return;
    setLoadingMore(true);
    runLoad(page + 1, "more");
  }, [loading, loadingMore, refreshing, page, totalPages, runLoad]);

  return {
    items,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: page < totalPages,
    refresh,
    loadMore,
  };
}