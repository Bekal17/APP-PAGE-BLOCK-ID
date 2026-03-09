const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ?? "http://172.22.80.1:8001";

function buildUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function getWalletOverview(wallet: string) {
  const res = await fetch(buildUrl(`/wallet_overview/${encodeURIComponent(wallet)}`));
  if (!res.ok) {
    const fallback = await fetch(
      buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/summary-compact`)
    );
    if (!fallback.ok) throw new Error("Failed to fetch wallet overview");
    return fallback.json();
  }
  return res.json();
}

export async function getTimeline(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/timeline`)
  );
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function getFlowPath(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/flow-path`)
  );
  if (!res.ok) throw new Error("Failed to fetch flow path");
  return res.json();
}

const graphCache = new Map<string, unknown>();

export function getGraphCache(wallet: string): unknown {
  return graphCache.get(wallet) ?? null;
}

export function setGraphCache(wallet: string, data: unknown): void {
  graphCache.set(wallet, data);
}

export async function getGraph(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/graph`)
  );
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export async function getNeighbors(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/neighbors`)
  );
  if (!res.ok) throw new Error("Failed to fetch neighbors");
  return res.json();
}

export async function getCounterparties(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/counterparties`)
  );
  if (!res.ok) throw new Error("Failed to fetch counterparties");
  return res.json();
}
