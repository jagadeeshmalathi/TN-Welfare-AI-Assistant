import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Category, Scheme } from "@/types";

/** Loads schemes + categories, with client-side filtering by category/search. */
export function useSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Load categories once.
  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Re-query whenever the filter changes (debounced for search).
  useEffect(() => {
    let active = true;
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .listSchemes(category, search)
        .then((data) => active && setSchemes(data))
        .catch(() => active && setError("Could not load schemes. Is the backend running?"))
        .finally(() => active && setLoading(false));
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [category, search]);

  return {
    schemes,
    categories,
    loading,
    error,
    category,
    setCategory,
    search,
    setSearch,
  };
}
