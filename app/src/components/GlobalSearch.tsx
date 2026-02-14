import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockResults = [
  { type: "wallet", name: "vitalik.block", address: "0x1a2b...9f3e", score: 97, avatar: "V" },
  { type: "wallet", name: "whale.block", address: "0x4c5d...2a1b", score: 94, avatar: "W" },
  { type: "wallet", name: "builder.block", address: "0x7e8f...5c3d", score: 89, avatar: "B" },
  { type: "wallet", name: "defi-chad.block", address: "0x9g0h...8e7f", score: 92, avatar: "D" },
  { type: "wallet", name: "anon42.block", address: "0x2b3c...1a0g", score: 87, avatar: "A" },
];

const getScoreColor = (s: number) => {
  if (s >= 80) return "text-success";
  if (s >= 50) return "text-warning";
  return "text-destructive";
};

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? mockResults.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.address.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showDropdown = focused && query.length > 0 && filtered.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-300 ${
          focused
            ? "border-primary/50 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.25),0_0_0_1px_hsl(var(--primary)/0.3)] bg-card"
            : "border-glass-border bg-card/60 backdrop-blur-xl hover:border-primary/20"
        }`}
      >
        <div className="flex items-center gap-2 pl-4">
          <Sparkles className={`w-4 h-4 transition-colors duration-300 ${focused ? "text-primary" : "text-muted-foreground"}`} />
          <Search className={`w-4 h-4 transition-colors duration-300 ${focused ? "text-primary/60" : "text-muted-foreground/60"}`} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search wallet or ID"
          className="flex-1 bg-transparent py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="pr-4 text-muted-foreground hover:text-foreground text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-glass-border bg-card shadow-[0_8px_32px_-8px_hsl(222_25%_4%/0.8)] z-50 overflow-hidden animate-slide-up">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Results · {filtered.length}
            </span>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {filtered.map((result) => (
              <button
                key={result.address}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                onClick={() => {
                  setQuery("");
                  setFocused(false);
                }}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {result.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                    {result.name}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{result.address}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={`text-sm font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
