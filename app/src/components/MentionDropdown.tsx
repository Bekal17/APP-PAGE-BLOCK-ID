import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { type MentionResult } from "@/hooks/useMentionAutocomplete";

interface MentionDropdownProps {
  results: MentionResult[];
  open: boolean;
  activeIndex: number;
  onSelect: (result: MentionResult) => void;
  onClose: () => void;
}

export function MentionDropdown({
  results,
  open,
  activeIndex,
  onSelect,
  onClose,
}: MentionDropdownProps) {
  if (!open || results.length === 0) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="absolute z-50 w-72 bg-zinc-900 border border-zinc-700
            rounded-xl shadow-xl overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((result, i) => (
            <button
              key={result.wallet}
              onClick={() => onSelect(result)}
              className={`w-full flex items-center gap-3 px-3 py-2.5
                hover:bg-zinc-800 transition-colors text-left
                ${i === activeIndex ? "bg-zinc-800" : ""}`}
            >
              <UserAvatar
                wallet={result.wallet}
                handle={result.handle}
                avatarUrl={result.avatar_url}
                avatarType={result.avatar_type ?? "NONE"}
                avatarIsAnimated={result.avatar_is_animated ?? false}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {result.display}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                ○ {Math.round(result.trust_score)}
              </span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
