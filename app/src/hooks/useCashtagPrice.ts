import { useEffect, useMemo, useState } from "react";

export interface TokenPrice {
  price: number;
  change24h?: number;
}

interface JupiterPriceResponse {
  data?: Record<string, { id: string; price: string }>;
}

const JUP_PRICE_URL = "https://api.jup.ag/price/v2";
const REFRESH_MS = 30_000;

export function useCashtagPrice(mintAddresses: string[] = []) {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [isLoading, setIsLoading] = useState(false);

  const dedupedAddresses = useMemo(() => {
    return Array.from(
      new Set(
        (mintAddresses ?? [])
          .map((address) => address.trim())
          .filter((address) => address.length > 0),
      ),
    );
  }, [mintAddresses]);

  useEffect(() => {
    if (dedupedAddresses.length === 0) {
      setPrices({});
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPrices = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const ids = dedupedAddresses.join(",");
        const response = await fetch(`${JUP_PRICE_URL}?ids=${encodeURIComponent(ids)}`);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as JupiterPriceResponse;
        const data = payload?.data ?? {};
        const nextPrices: Record<string, TokenPrice> = {};

        for (const [mint, token] of Object.entries(data)) {
          const parsedPrice = Number(token?.price);
          if (!Number.isNaN(parsedPrice)) {
            nextPrices[mint] = {
              price: parsedPrice,
              change24h: undefined,
            };
          }
        }

        if (isMounted) {
          setPrices(nextPrices);
        }
      } catch {
        if (isMounted) {
          setPrices({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchPrices();
    const intervalId = window.setInterval(() => {
      void fetchPrices();
    }, REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [dedupedAddresses]);

  return { prices, isLoading };
}
