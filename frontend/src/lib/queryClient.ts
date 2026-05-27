import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { cachePolicy } from "./cachePolicy";
import type { ProductQueryDto } from "../@types/product.type";

const PERSISTED_QUERY_CACHE_KEY = "haushop_query_cache_v2";
const LEGACY_PERSISTED_QUERY_CACHE_KEYS = ["haushop_query_cache_v1"];
const PERSISTED_QUERY_MAX_AGE = 30 * 60 * 1000;
const PERSISTED_QUERY_SCOPES = new Set(["products", "categories"]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: cachePolicy.order.staleTime,
      gcTime: cachePolicy.order.gcTime,
    },
    mutations: {
      retry: 0,
    },
  },
});

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function shouldPersistQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
}) {
  const scope = query.queryKey[0];

  if (
    typeof scope !== "string" ||
    !PERSISTED_QUERY_SCOPES.has(scope) ||
    query.state.status !== "success"
  ) {
    return false;
  }

  if (scope === "categories") return true;

  const [, productKey, productQuery] = query.queryKey;
  if (productKey !== "list" || !productQuery || typeof productQuery !== "object") {
    return false;
  }

  const listQuery = productQuery as ProductQueryDto;
  return (
    !listQuery.search &&
    listQuery.isActive === true &&
    listQuery.includeTotal === false &&
    (listQuery.page ?? 1) <= 1 &&
    (listQuery.pageSize ?? 20) <= 12
  );
}

function clearLegacyPersistedQueries() {
  if (!canUseStorage()) return;

  for (const key of LEGACY_PERSISTED_QUERY_CACHE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function hydratePersistedQueries() {
  if (!canUseStorage()) return;

  try {
    clearLegacyPersistedQueries();
    const raw = window.localStorage.getItem(PERSISTED_QUERY_CACHE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as { savedAt?: number; state?: unknown };
    if (!parsed.savedAt || !parsed.state) return;

    if (Date.now() - parsed.savedAt > PERSISTED_QUERY_MAX_AGE) {
      window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
      return;
    }

    hydrate(queryClient, parsed.state);
  } catch {
    window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
  }
}

function persistQueries() {
  if (!canUseStorage()) return;

  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => shouldPersistQuery(query),
    });

    if (state.queries.length === 0) return;

    window.localStorage.setItem(
      PERSISTED_QUERY_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        state,
      })
    );
  } catch {
    // localStorage quota/private-mode failures should not affect rendering.
  }
}

function subscribeQueryPersistence() {
  if (!canUseStorage()) return;

  let timeoutId: number | undefined;

  queryClient.getQueryCache().subscribe((event) => {
    if (event?.query && !shouldPersistQuery(event.query)) return;

    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(persistQueries, 800);
  });
}

hydratePersistedQueries();
subscribeQueryPersistence();
