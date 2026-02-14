import { useEffect, useState } from "react";

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const TrustScoreRing = ({ score, size = 180, strokeWidth = 8 }: TrustScoreRingProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "hsl(160, 70%, 45%)";
    if (s >= 50) return "hsl(38, 90%, 55%)";
    return "hsl(0, 72%, 55%)";
  };

  const getScoreGlow = (s: number) => {
    if (s >= 80) return "0 0 20px hsl(160 70% 45% / 0.4)";
    if (s >= 50) return "0 0 20px hsl(38 90% 55% / 0.4)";
    return "0 0 20px hsl(0 72% 55% / 0.4)";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Poor";
  };

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="trust-ring -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(222 15% 18%)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(animatedScore)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.1s linear",
            filter: `drop-shadow(${getScoreGlow(animatedScore)})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-foreground tracking-tight">{animatedScore}</span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-1">
          {getLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
};

export default TrustScoreRing;
