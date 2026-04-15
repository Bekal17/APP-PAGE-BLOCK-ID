import { useMemo } from "react";
import { useTokenList } from "./useTokenList";

export interface TokenPrice {
  price: number;
  change24h?: number;
}

export function useCashtagPrice(mintAddresses: string[]) {
  const { tokens } = useTokenList();

  const prices = useMemo(() => {
    const mapped: Record<string, TokenPrice> = {};
    for (const addr of mintAddresses) {
      const token = tokens.find((t) => t.address === addr);
      if (token?.usdPrice) {
        mapped[addr] = {
          price: token.usdPrice,
          change24h: token.change24h,
        };
      }
    }
    return mapped;
  }, [mintAddresses, tokens]);

  return { prices, isLoading: false };
}
