/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockInfo {
  code: string;
  name: string;
  basePrice: number;
  weight: number;
  description: string;
  // Dynamic simulation values
  currentPrice?: number;
  changePercent?: number;
  volumeMultiplier?: number;
  bias20?: number;
}

export interface CustomConcept {
  id: string;
  conceptName: string;
  rationale: string;
  stocks: StockInfo[];
  marketInsight: string;
  // Parameters
  ratioTrigger: number; // Ratio (%) for daily gain
  barCount: number; // K-bars for intraday surge
  rangePercentTrigger: number; // Intraday surge rapid rise (%)
  // Calculated indexes
  indexPrice?: number;
  indexChangePercent?: number;
  intradaySurge?: number;
  lastTriggered?: string;
}

export interface AlertLog {
  id: string;
  time: string;
  type: "INDEX_SURGE" | "INDEX_突破" | "STOCK_BREAKOUT";
  targetName: string;
  message: string;
  severity: "high" | "medium" | "info";
}

export interface ChartDataPoint {
  date: string;
  price: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  ma5: number;
  ma10: number;
  ma20: number;
  ma60: number;
  vOsc: number; // MACD OSC
  // Condition status
  isTrigger: boolean;
  matchConditions: number[]; // Array of conditions matched on this day [1, 2, 3, 4, 5, 6]
}
