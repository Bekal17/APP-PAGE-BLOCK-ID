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

const STRICT_URL = "https://api.jup.ag/tokens/v2/tag?query=verified";
const SEARCH_URL = "https://api.jup.ag/tokens/v2/search";
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

interface JupiterV2Token {
  id?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  icon?: string;
  tags?: string[];
  isVerified?: boolean;
}

function isTokenVerified(item: JupiterV2Token): boolean {
  const tags = item.tags ?? [];
  return (
    item.isVerified === true ||
    tags.includes("verified") ||
    tags.includes("strict")
  );
}

function mapV2Token(item: JupiterV2Token): JupiterToken | null {
  if (
    !item.id ||
    !item.symbol ||
    !item.name ||
    typeof item.decimals !== "number"
  ) {
    return null;
  }

  const tags = item.tags ?? [];
  return {
    address: item.id,
    symbol: item.symbol,
    name: item.name,
    decimals: item.decimals,
    logoURI: item.icon,
    tags,
  };
}

async function fetchTokenList(url: string): Promise<JupiterToken[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as JupiterV2Token[];
    if (!Array.isArray(data)) return [];

    const mapped = data
      .map(mapV2Token)
      .filter((token): token is JupiterToken => token !== null);

    return mapped.filter((token) => {
      const source = data.find((item) => item.id === token.address);
      return source ? isTokenVerified(source) : false;
    });
  } catch {
    return [];
  }
}

async function fetchTokensBySearch(ticker: string): Promise<JupiterToken[]> {
  try {
    const response = await fetch(
      `${SEARCH_URL}?query=${encodeURIComponent(ticker)}`,
    );
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as JupiterV2Token[];
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        const mapped = mapV2Token(item);
        if (!mapped) return null;
        const tags = mapped.tags ?? [];
        if (isTokenVerified(item) && !tags.includes("verified")) {
          mapped.tags = [...tags, "verified"];
        }
        return mapped;
      })
      .filter((token): token is JupiterToken => token !== null);
  } catch {
    return [];
  }
}

export function useTokenList() {
  const [tokens, setTokens] = useState<JupiterToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const allTokensRef = useRef<JupiterToken[] | null>(null);
  const allFetchPromiseRef = useRef<Record<string, Promise<JupiterToken[]>>>({});

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

  const loadSearchTokensOnce = useCallback(async (ticker: string): Promise<JupiterToken[]> => {
    const cachedAll = readCache(ALL_CACHE_KEY);
    if (!allTokensRef.current && cachedAll) {
      allTokensRef.current = cachedAll;
    }

    const existingMatch =
      allTokensRef.current?.filter(
        (token) => token.symbol.toUpperCase() === ticker.toUpperCase(),
      ) ?? [];
    if (existingMatch.length > 0) {
      return existingMatch;
    }

    const key = ticker.toUpperCase();
    if (!allFetchPromiseRef.current[key]) {
      allFetchPromiseRef.current[key] = fetchTokensBySearch(key).then(
        (fetched) => {
          if (fetched.length > 0) {
            const existing = allTokensRef.current ?? [];
            const mergedByAddress = new Map<string, JupiterToken>();
            for (const token of existing) {
              mergedByAddress.set(token.address, token);
            }
            for (const token of fetched) {
              mergedByAddress.set(token.address, token);
            }
            const merged = Array.from(mergedByAddress.values());
            allTokensRef.current = merged;
            writeCache(ALL_CACHE_KEY, merged);
          } else if (!allTokensRef.current) {
            allTokensRef.current = [];
          }

          return fetched;
        },
      );
    }

    return allFetchPromiseRef.current[key];
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

      void loadSearchTokensOnce(normalized);
      return null;
    },
    [loadSearchTokensOnce, tokens],
  );

  return { tokens, getByTicker, isLoading };
}
