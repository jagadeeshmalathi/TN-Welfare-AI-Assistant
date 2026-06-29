import { useState } from "react";
import { api } from "@/lib/api";
import type { EligibilityForm, EligibilityMatch } from "@/types";

/** Drives the eligibility checker form + results. */
export function useEligibility() {
  const [results, setResults] = useState<EligibilityMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(form: EligibilityForm) {
    setLoading(true);
    setError(null);
    try {
      const { matches } = await api.checkEligibility(form);
      setResults(matches);
    } catch {
      setError("Could not check eligibility. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResults(null);
    setError(null);
  }

  return { results, loading, error, check, reset };
}
