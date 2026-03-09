interface GraphModeToggleProps {
  modes: readonly string[];
  value: string;
  onChange: (mode: string) => void;
}

export default function GraphModeToggle({ modes, value, onChange }: GraphModeToggleProps) {
  return (
    <div className="flex rounded-lg bg-zinc-800/50 p-0.5 border border-zinc-700/50">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
            value === mode
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-gray-400 hover:text-foreground hover:bg-zinc-700/50"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
