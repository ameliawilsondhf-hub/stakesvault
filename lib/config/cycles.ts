// =============================
// 🔹 Cycle Configuration (Final)
// =============================

// 1️⃣ Interface for better typing
export interface CycleConfig {
  name: string;
  days: number;
  rate: number; // Daily compounding rate
  bonus: number; // Extra reward at completion
}

// 2️⃣ Strongly typed cycle data (3 cycles)
export const cycleData: Record<number, CycleConfig> = {
  1: {
    name: "30 Days Plan",
    days: 30,
    rate: 0.01, // 1% daily
    bonus: 0.00, // no bonus in first cycle
  },
  2: {
    name: "60 Days Plan",
    days: 60,
    rate: 0.01, // 1% daily
    bonus: 0.03, // +3% completion bonus
  },
  3: {
    name: "90 Days Plan",
    days: 90,
    rate: 0.01, // 1% daily
    bonus: 0.05, // +5% completion bonus
  },
};

// 3️⃣ Helper function (optional — use anywhere)
export function getCycleInfo(cycle: number): CycleConfig {
  return cycleData[cycle] || cycleData[1]; // default to first cycle if invalid
}
