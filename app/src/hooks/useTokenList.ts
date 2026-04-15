import { useCallback, useEffect, useRef, useState } from "react";

export interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

interface TokenCachePayload {
  timestamp: number;
  tokens: JupiterToken[];
}

const STRICT_URL = "https://token.jup.ag/strict";
const ALL_URL = "https://token.jup.ag/all";
const STRICT_CACHE_KEY = "blockid_jup_tokens";
const ALL_CACHE_KEY = "blockid_jup_tokens_all";
const TTL_MS = 24 * 60 * 60 * 1000;

function normalizeTicker(ticker: string): string {
  return ticker.trim().replace(/^\$/, "").toUpperCase();
}

function isCacheFresh(timestamp: number): boolean {
  return Date.now() - timestamp < TTL_MS;
}

function readCache(key: string): JupiterToken[] | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TokenCachePayload;
    if (
      !parsed ||
      typeof parsed.timestamp !== "number" ||
      !Array.isArray(parsed.tokens)
    ) {
      return null;
    }

    if (!isCacheFresh(parsed.timestamp)) {
      return null;
    }

    return parsed.tokens;
  } catch {
    return null;
  }
}

function writeCache(key: string, tokens: JupiterToken[]): void {
  try {
    if (typeof window === "undefined") return;
    const payload: TokenCachePayload = {
      timestamp: Date.now(),
      tokens,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore localStorage failures (quota/private mode/etc)
  }
}

async function fetchTokenList(url: string): Promise<JupiterToken[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as JupiterToken[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function useTokenList() {
  const [tokens, setTokens] = useState<JupiterToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const allTokensRef = useRef<JupiterToken[] | null>(null);
  const allFetchPromiseRef = useRef<Promise<JupiterToken[]> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStrictTokens = async () => {
      const cachedStrict = readCache(STRICT_CACHE_KEY);
      if (cachedStrict) {
        if (isMounted) {
          setTokens(cachedStrict);
          setIsLoading(false);
        }
        return;
      }

      const fetchedStrict = await fetchTokenList(STRICT_URL);
      if (fetchedStrict.length > 0) {
        writeCache(STRICT_CACHE_KEY, fetchedStrict);
      }

      if (isMounted) {
        setTokens(fetchedStrict);
        setIsLoading(false);
      }
    };

    void loadStrictTokens();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadAllTokensOnce = useCallback(async (): Promise<JupiterToken[]> => {
    if (allTokensRef.current) {
      return allTokensRef.current;
    }

    const cachedAll = readCache(ALL_CACHE_KEY);
    if (cachedAll) {
      allTokensRef.current = cachedAll;
      return cachedAll;
    }

    if (!allFetchPromiseRef.current) {
      allFetchPromiseRef.current = fetchTokenList(ALL_URL).then((fetchedAll) => {
        if (fetchedAll.length > 0) {
          writeCache(ALL_CACHE_KEY, fetchedAll);
        }
        allTokensRef.current = fetchedAll;
        return fetchedAll;
      });
    }

    return allFetchPromiseRef.current;
  }, []);

  const getByTicker = useCallback(
    (ticker: string): JupiterToken | null => {
      const normalized = normalizeTicker(ticker);
      if (!normalized) return null;

      const strictMatch =
        tokens.find((token) => token.symbol.toUpperCase() === normalized) ??
        null;
      if (strictMatch) {
        return strictMatch;
      }

      if (allTokensRef.current) {
        return (
          allTokensRef.current.find(
            (token) => token.symbol.toUpperCase() === normalized,
          ) ?? null
        );
      }

      void loadAllTokensOnce();
      return null;
    },
    [loadAllTokensOnce, tokens],
  );

  return { tokens, getByTicker, isLoading };
}
