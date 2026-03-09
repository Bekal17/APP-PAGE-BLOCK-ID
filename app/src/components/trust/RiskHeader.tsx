// ==========================================
// Create: src/components/trust/RiskHeader.tsx
// ==========================================

import React from "react"
import { Card, CardContent } from "@/components/ui/card"

type RiskHeaderProps = {
  trust_score: number
  simple_status: "SAFE" | "REVIEW" | "RISKY"
  risk_color: "GREEN" | "AMBER" | "RED"
  summary_message: string
}

const colorMap: Record<string, string> = {
  GREEN: "border-green-500 shadow-green-500/20",
  AMBER: "border-amber-500 shadow-amber-500/20",
  RED: "border-red-500 shadow-red-500/20",
}

export const RiskHeader: React.FC<RiskHeaderProps> = ({
  trust_score,
  simple_status,
  risk_color,
  summary_message,
}) => {
  return (
    <Card
      className={`border-2 ${colorMap[risk_color]} shadow-xl transition-all duration-300`}
    >
      <CardContent className="p-8 text-center space-y-4">
        <div className="text-xs tracking-widest opacity-60">
          WALLET RISK STATUS
        </div>

        <div className="text-4xl font-bold">
          {simple_status}
        </div>

        <div className="text-6xl font-extrabold">
          {trust_score}
        </div>

        <div className="opacity-70 max-w-xl mx-auto text-sm">
          {summary_message}
        </div>
      </CardContent>
    </Card>
  )
}
