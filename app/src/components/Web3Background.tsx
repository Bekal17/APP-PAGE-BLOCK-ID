export default function Web3Background() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />

      {/* Neon glow orbs */}
      <div
        className="absolute top-[-200px] left-[30%] w-[600px] h-[600px] bg-cyan-500/20 blur-[180px] rounded-full"
        aria-hidden
      />
      <div
        className="absolute bottom-[-200px] right-[20%] w-[600px] h-[600px] bg-indigo-500/20 blur-[180px] rounded-full"
        aria-hidden
      />

      {/* Network nodes SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g stroke="rgba(34,211,238,0.25)" strokeWidth="1">
          <line x1="100" y1="100" x2="200" y2="160" />
          <line x1="200" y1="160" x2="320" y2="120" />
          <line x1="320" y1="120" x2="450" y2="200" />
          <line x1="200" y1="160" x2="260" y2="260" />
          <line x1="260" y1="260" x2="420" y2="320" />
        </g>
        <g fill="#22d3ee">
          <circle cx="100" cy="100" r="3" />
          <circle cx="200" cy="160" r="3" />
          <circle cx="320" cy="120" r="3" />
          <circle cx="450" cy="200" r="3" />
          <circle cx="260" cy="260" r="3" />
          <circle cx="420" cy="320" r="3" />
        </g>
      </svg>
    </div>
  );
}
