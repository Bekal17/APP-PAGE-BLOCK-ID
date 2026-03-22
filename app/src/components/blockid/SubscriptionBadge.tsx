import { useId } from "react";

interface SubscriptionBadgeProps {
  plan: "free" | "explorer" | "pro" | string;
  size?: "sm" | "md" | "lg";
}

export default function SubscriptionBadge({
  plan,
  size = "sm",
}: SubscriptionBadgeProps) {
  const uid = useId().replace(/:/g, "-");
  const sizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const s = sizeMap[size];

  if (plan === "explorer") {
    return (
      <svg
        className={`${s} shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        title="Explorer"
      >
        <circle cx="12" cy="12" r="12" fill="#38bdf8" />
        <path
          d="M7 12.5l3.5 3.5 6.5-7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (plan === "pro") {
    return (
      <svg
        className={`${s} shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        title="Pro Member"
      >
        <defs>
          <linearGradient id={`pro-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill={`url(#pro-gold-${uid})`} />
        <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <path
          d="M7 12.5l3.5 3.5 6.5-7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
}
