import { useState, useCallback, useRef } from "react";

const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

export interface MentionResult {
  wallet: string;
  handle: string;
  handle_type: string;
  display: string;
  trust_score: number;
  avatar_url?: string | null;
  avatar_type?: string | null;
  avatar_is_animated?: boolean;
  is_following: boolean;
}

export function useMentionAutocomplete(currentWallet?: string | null) {
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchMentions = useCallback(
    async (query: string) => {
      if (!query || query.length < 1) {
        setMentionResults([]);
        setMentionOpen(false);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const params = new URLSearchParams({ q: query, limit: "5" });
          if (currentWallet) params.set("wallet", currentWallet);
          const res = await fetch(`${API_BASE}/handle/search?${params}`);
          const data = await res.json();
          const results: MentionResult[] = data.results ?? [];
          setMentionResults(results);
          setMentionOpen(results.length > 0);
          setMentionIndex(0);
        } catch {
          setMentionResults([]);
          setMentionOpen(false);
        }
      }, 200);
    },
    [currentWallet]
  );

  /**
   * Call this in onChange of textarea/input.
   * Returns: { isMention: boolean, query: string | null }
   */
  const handleInputChange = useCallback(
    (value: string, cursorPosition: number) => {
      const beforeCursor = value.slice(0, cursorPosition);
      const match = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
      if (match) {
        const query = match[1];
        setMentionQuery(query);
        searchMentions(query);
        return { isMention: true, query };
      } else {
        setMentionQuery(null);
        setMentionResults([]);
        setMentionOpen(false);
        return { isMention: false, query: null };
      }
    },
    [searchMentions]
  );

  /**
   * Call this when user selects a mention from dropdown.
   * Returns the new text value with @handle inserted.
   */
  const selectMention = useCallback(
    (result: MentionResult, currentValue: string, cursorPosition: number): string => {
      const beforeCursor = currentValue.slice(0, cursorPosition);
      const afterCursor = currentValue.slice(cursorPosition);
      // Replace @query with @handle (no suffix — suffix is display only)
      const newBefore = beforeCursor.replace(/@([a-zA-Z0-9_]*)$/, `@${result.handle} `);
      setMentionOpen(false);
      setMentionResults([]);
      setMentionQuery(null);
      return newBefore + afterCursor;
    },
    []
  );

  /**
   * Handle keyboard navigation in dropdown.
   * Returns true if event was consumed.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, onSelect: (result: MentionResult) => void): boolean => {
      if (!mentionOpen || mentionResults.length === 0) return false;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, mentionResults.length - 1));
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (mentionOpen && mentionResults[mentionIndex]) {
          e.preventDefault();
          onSelect(mentionResults[mentionIndex]);
          return true;
        }
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return true;
      }
      return false;
    },
    [mentionOpen, mentionResults, mentionIndex]
  );

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionResults([]);
    setMentionQuery(null);
  }, []);

  return {
    mentionResults,
    mentionQuery,
    mentionOpen,
    mentionIndex,
    handleInputChange,
    selectMention,
    handleKeyDown,
    closeMention,
  };
}
