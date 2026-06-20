import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Activity, 
  TrendingUp, 
  Search, 
  Settings, 
  Bell, 
  Code, 
  BrainCircuit, 
  Flame, 
  Plus, 
  HelpCircle, 
  Copy, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  ChevronRight,
  TrendingDown,
  Sparkles,
  Info,
  Database
} from "lucide-react";
import { StockInfo, CustomConcept, AlertLog, ChartDataPoint } from "./types";
import XSEditor from "./components/XS_Editor";

// Pre-defined high-quality Taiwanese stocks mock database for quick references
const INITIAL_PRESETS: { [key: string]: CustomConcept } = {
  "CPO": {
    id: "preset_cpo",
    conceptName: "CPO 光共同封裝 (Silicon Photonics)",
    rationale: "共同封裝光學 (Co-Packaged Optics) 技術將矽光子晶片與晶片整合封裝，大幅升級高頻傳輸速，是高階 AI 交換器核心傳輸架構技術。",
    ratioTrigger: 3.5,
    barCount: 5,
    rangePercentTrigger: 1.2,
    stocks: [
      { code: "3363", name: "上詮", basePrice: 185.5, weight: 1.0, description: "光連結與矽光子模組封測關鍵成員" },
      { code: "4979", name: "華星光", basePrice: 145.0, weight: 1.0, description: "高速光收發模組核心出貨，對接北美雲端大廠" },
      { code: "3450", name: "聯鈞", basePrice: 220.0, weight: 1.0, description: "主提供光通訊雷射及矽光子封測整合服務" },
      { code: "3081", name: "聯亞", basePrice: 310.5, weight: 1.0, description: "高速雷射磊晶片指標大廠" },
    ],
    marketInsight: "產業正處於 800G 到 1.6T 關鍵升級，資金高度擁擠。一旦多檔起漲即形成大行情。"
  },
  "LIQUID": {
    id: "preset_liquid",
    conceptName: "AI 伺服器液冷散熱 (Cooling System)",
    rationale: "GB200 高效能晶片功耗逼近極限，液冷散熱模組中的分流歧管、水冷板及 CDU 控制器成為高階機櫃標配裝備。",
    ratioTrigger: 4.0,
    barCount: 5,
    rangePercentTrigger: 1.5,
    stocks: [
      { code: "3017", name: "奇鋐", basePrice: 620.0, weight: 1.0, description: "伺服器散熱、3D VC 及水冷板供應大廠" },
      { code: "3324", name: "雙鴻", basePrice: 680.0, weight: 1.0, description: "液冷冷卻分配量(CDU)及接頭全模組主力供應商" },
      { code: "8996", name: "高力", basePrice: 325.5, weight: 1.0, description: "水冷歧管與反應冷卻核心焊接件與製造" },
      { code: "2421", name: "建準", basePrice: 110.5, weight: 1.0, description: "散熱風扇與泵浦馬達領導製造品牌" }
    ],
    marketInsight: "認證拉貨高峰即將展開，短線看幾家主力股是否突破月線，往往有帶頭羊示範效應。"
  }
};

// Heatmap mock initial sectors
const INITIAL_HEATMAP_SECTORS = [
  { id: "s1", name: "光通訊 / CPO", total: 12, breakoutCount: 6, codePrefix: "33/49/34", scale: 4, hotScore: 92 },
  { id: "s2", name: "液冷散熱", total: 15, breakoutCount: 5, codePrefix: "30/33/89", scale: 5, hotScore: 88 },
  { id: "s3", name: "特用化學", total: 9, breakoutCount: 1, codePrefix: "47/17", scale: 2, hotScore: 45 },
  { id: "s4", name: "CoWoS 先進封裝", total: 18, breakoutCount: 4, codePrefix: "31/61/15", scale: 6, hotScore: 78 },
  { id: "s5", name: "伺服器滑軌與機殼", total: 8, breakoutCount: 3, codePrefix: "20/52", scale: 3, hotScore: 65 },
  { id: "s6", name: "矽智財 / IP", total: 11, breakoutCount: 0, codePrefix: "36/66/64", scale: 1, hotScore: 30 },
];

export default function App() {
  // Navigation Tabs: dashboard (即時雷達板), scripts (XS腳本編輯器)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "scripts">("dashboard");

  // Approach 1 states - Custom Concept Monitor
  const [activeConcept, setActiveConcept] = useState<CustomConcept>(INITIAL_PRESETS.CPO);
  const [conceptQuery, setConceptQuery] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);

  // User input fields for active concept thresholds
  const [inputRatio, setInputRatio] = useState<number>(activeConcept.ratioTrigger);
  const [inputBarCount, setInputBarCount] = useState<number>(activeConcept.barCount);
  const [inputRangePercent, setInputRangePercent] = useState<number>(activeConcept.rangePercentTrigger);

  // Heatmap Sector States
  const [sectors, setSectors] = useState(INITIAL_HEATMAP_SECTORS);

  // Logs / Alerts States
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([
    {
      id: "log_init_1",
      time: "10:00:15",
      type: "INDEX_突破",
      targetName: "CPO 光共同封裝 指數",
      message: "自訂指數今日漲幅達到 3.65%，突破設定閾值！",
      severity: "medium"
    },
    {
      id: "log_init_2",
      time: "10:01:22",
      type: "STOCK_BREAKOUT",
      targetName: "3363 上詮",
      message: "偵測到洗盤結束，帶量突破月線！(符合完美版策略)",
      severity: "high"
    }
  ]);

  // Approach 3 states - Code Explainer and Simulator parameters
  const [selectedStock, setSelectedStock] = useState<string>("3363");
  const [selectedCondition, setSelectedCondition] = useState<number>(1);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isFetchingExplanation, setIsFetchingExplanation] = useState<boolean>(false);

  // Sandbox Technical Chart adjustable criteria
  const [length20, setLength20] = useState<number>(20);
  const [volMultiplier, setVolMultiplier] = useState<number>(1.5);
  const [lookbackDays, setLookbackDays] = useState<number>(10);
  const [maxBias, setMaxBias] = useState<number>(4);

  // Hover point details
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Sync internal parameters on concept change
  const [liveTime, setLiveTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const dy = String(now.getDate()).padStart(2, "0");
      const hr = String(now.getHours()).padStart(2, "0");
      const mi = String(now.getMinutes()).padStart(2, "0");
      const sc = String(now.getSeconds()).padStart(2, "0");
      setLiveTime(`${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setInputRatio(activeConcept.ratioTrigger);
    setInputBarCount(activeConcept.barCount);
    setInputRangePercent(activeConcept.rangePercentTrigger);
  }, [activeConcept]);

  // Simulated live stock price stream logic
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // 1. Update prices for stocks inside the ACTIVE Custom Concept
      setActiveConcept((prev) => {
        let anyPriceChanged = false;
        const updatedStocks = prev.stocks.map((stock) => {
          const currentPrice = stock.currentPrice || stock.basePrice;
          
          // Random walk price shift (-1.2% to +1.8%)
          const changePercent = (stock.changePercent || 0) + (Math.random() * 3 - 1.2) * 0.2;
          const roundedChange = Math.max(-10, Math.min(10, Number(changePercent.toFixed(2))));
          const mockPrice = Number((stock.basePrice * (1 + roundedChange / 100)).toFixed(2));
          
          // simulated live technical fields
          const mockVolMult = Number((1.0 + Math.random() * 2).toFixed(2));
          const mockBias = Number((roundedChange * 0.7).toFixed(2));

          return {
            ...stock,
            currentPrice: mockPrice,
            changePercent: roundedChange,
            volumeMultiplier: mockVolMult,
            bias20: mockBias
          };
        });

        // Calculate average "平權" custom index pricing
        const totalBase = prev.stocks.reduce((sum, s) => sum + s.basePrice, 0);
        const totalCurr = updatedStocks.reduce((sum, s) => sum + (s.currentPrice || s.basePrice), 0);
        const indexPrice = Number((100 * (totalCurr / totalBase)).toFixed(2));
        const indexChangePercent = Number((((indexPrice - 100) / 100) * 100).toFixed(2));

        // Intraday surge simulator (last 5 bars)
        // We simulate a 5-minute surge factor by looking at average stock ticks
        const currentSurge = Number((Math.random() * 2.2).toFixed(2));
        
        // Randomly trigger alerts on surge or breakthrough!
        const randTrigger = Math.random();
        if (randTrigger > 0.94) {
          const now = new Date();
          const timeStr = now.toTimeString().split(" ")[0];
          
          if (currentSurge > inputRangePercent) {
            // Index surge warning!
            setAlertLogs((prevLogs) => [
              {
                id: `log_surge_${Date.now()}`,
                time: timeStr,
                type: "INDEX_SURGE",
                targetName: prev.conceptName,
                message: `【族群性發動】自訂產業指數短線集體暴衝拉抬！5分急拉達 ${currentSurge}% (閾值 ${inputRangePercent}%)`,
                severity: "high"
              },
              ...prevLogs.slice(0, 40)
            ]);
          } else if (indexChangePercent > inputRatio) {
            // Index breakout threshold
            setAlertLogs((prevLogs) => [
              {
                id: `log_break_${Date.now()}`,
                time: timeStr,
                type: "INDEX_突破",
                targetName: prev.conceptName,
                message: `自訂族群指數熱力引爆！今日累積漲幅 ${indexChangePercent}% 超出警告點 ${inputRatio}%`,
                severity: "medium"
              },
              ...prevLogs.slice(0, 40)
            ]);
          }
        }

        return {
          ...prev,
          stocks: updatedStocks,
          indexPrice,
          indexChangePercent,
          intradaySurge: currentSurge
        };
      });

      // 2. Randomly jitter Heatmap sectors breakout numbers to simulate real breakout scanning
      setSectors((prevSectors) => {
        return prevSectors.map((sec) => {
          const change = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const count = Math.max(0, Math.min(sec.total, sec.breakoutCount + change));
          const hotScore = Math.round((count / sec.total) * 100 + (Math.random() * 5));
          
          // If breakout hit critical cluster threshold, add a log
          if (count >= 4 && change === 1) {
            const now = new Date();
            const timeStr = now.toTimeString().split(" ")[0];
            setAlertLogs((prevLogs) => [
              {
                id: `log_sector_${Date.now()}`,
                time: timeStr,
                type: "STOCK_BREAKOUT",
                targetName: sec.name,
                message: `欄位排序分析警告：${sec.name}族群密集度急升！目前已有 ${count} 檔個股同時爆量突破高點！`,
                severity: "high"
              },
              ...prevLogs.slice(0, 40)
            ]);
          }

          return {
            ...sec,
            breakoutCount: count,
            hotScore: Math.min(100, Math.max(10, hotScore))
          };
        });
      });

    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, inputRangePercent, inputRatio, activeConcept.stocks]);

  // Preset switch handles
  const selectPreset = (key: string) => {
    setActiveConcept(INITIAL_PRESETS[key]);
  };

  // Calling Gemini API server-side to generate customizable concepts
  const handleGenerateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptQuery.trim()) return;

    setIsAiGenerating(true);
    try {
      const response = await fetch("/api/gemini/generate-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptQuery: conceptQuery.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        // Pack into CustomConcept structure
        const nextConcept: CustomConcept = {
          id: `ai_${Date.now()}`,
          conceptName: data.conceptName,
          rationale: data.rationale,
          ratioTrigger: inputRatio,
          barCount: inputBarCount,
          rangePercentTrigger: inputRangePercent,
          stocks: data.stocks.map((s: any) => ({
            code: s.code,
            name: s.name,
            basePrice: s.basePrice,
            weight: s.weight || 1.0,
            description: s.description,
            currentPrice: s.basePrice,
            changePercent: 0,
            volumeMultiplier: 1.0,
            bias20: 0
          })),
          marketInsight: data.marketInsight
        };
        setActiveConcept(nextConcept);
        setConceptQuery("");
      }
    } catch (err) {
      console.error("AI Generation Error", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Calling Gemini API server-side to explain core XS logic criteria
  const handleExplainCondition = async (conditionNumber: number) => {
    setSelectedCondition(conditionNumber);
    setIsFetchingExplanation(true);
    setAiExplanation("");
    try {
      const response = await fetch("/api/gemini/explain-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionNum: conditionNumber.toString() })
      });
      if (response.ok) {
        const data = await response.json();
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error("Explain condition failed", err);
    } finally {
      setIsFetchingExplanation(false);
    }
  };

  // Auto trigger default explanation on load
  useEffect(() => {
    handleExplainCondition(1);
  }, []);

  // ---------------------------------------------------------
  // Sandbox mockup historical data generator (CPO or liquid)
  // ---------------------------------------------------------
  const simulatedHistoricalChartData = useMemo<ChartDataPoint[]>(() => {
    const data: ChartDataPoint[] = [];
    const base = selectedStock === "3363" ? 180 : selectedStock === "4979" ? 140 : 250;
    
    // Simulate 35 days timeline representing the breakout setups precisely
    for (let i = 0; i < 35; i++) {
      const date = `06-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`;
      let price = base;
      let volume = 1200;
      let isPeakDay = (i === 15); // Day 15 is our exact golden trigger setup day!

      // Setup prices:
      if (i < 8) {
        // High trend (above MA20, MA20 > MA60)
        price = base + (i * 2.5);
        volume = 950 + i * 50;
      } else if (i >= 8 && i < 12) {
        // Pullback drop crossed below monthly line
        price = base + 15 - ((i - 7) * 7.5);
        volume = 700 - (i - 7) * 80;
      } else if (i >= 12 && i < 15) {
        // Volume dryout wash phase (量縮極致)
        price = base - 10 + (Math.random() * 3);
        volume = 250 + (Math.random() * 80);
      } else if (i === 15) {
        // Massive Day 15 breakthrough!
        price = base + 14.2; // Stands above MA20
        volume = 3500; // Big volume jump!
      } else {
        // Post breakout jump
        price = base + 14.2 + ((i - 15) * 5.8) + (Math.sin(i) * 2);
        volume = 2000 - (i - 15) * 100 + (Math.random() * 500);
      }

      const high = price + (isPeakDay ? 3.5 : 1 + Math.random() * 4);
      const low = price - (isPeakDay ? 0.5 : 1 + Math.random() * 4);
      const open = price - (isPeakDay ? 8.5 : (Math.random() * 3 - 1.5));

      data.push({
        date,
        price: Number(price.toFixed(1)),
        high: Number(high.toFixed(1)),
        low: Number(low.toFixed(1)),
        open: Number(open.toFixed(1)),
        volume: Math.round(volume),
        ma5: 0, ma10: 0, ma20: 0, ma60: 0, vOsc: 0,
        isTrigger: false,
        matchConditions: []
      });
    }

    // Now calculate indices moving averages and MACD OSC mock values
    for (let i = 0; i < data.length; i++) {
      // Calculate MA5
      if (i >= 4) {
        const sum = data.slice(i - 4, i + 1).reduce((s, d) => s + d.price, 0);
        data[i].ma5 = Number((sum / 5).toFixed(1));
      } else {
        data[i].ma5 = data[i].price;
      }

      // Calculate MA10
      if (i >= 9) {
        const sum = data.slice(i - 9, i + 1).reduce((s, d) => s + d.price, 0);
        data[i].ma10 = Number((sum / 10).toFixed(1));
      } else {
        data[i].ma10 = data[i].price;
      }

      // Calculate MA20 (adjustable monthly line parameter)
      if (i >= length20 - 1) {
        const sum = data.slice(i - (length20 - 1), i + 1).reduce((s, d) => s + d.price, 0);
        data[i].ma20 = Number((sum / length20).toFixed(1));
      } else {
        // fallback
        const sum = data.slice(0, i + 1).reduce((s, d) => s + d.price, 0);
        data[i].ma20 = Number((sum / (i + 1)).toFixed(1));
      }

      // Calculate MA60
      if (i >= 15) {
        // slightly below MA20 to simulate bull market background
        data[i].ma60 = Number((data[i].ma20 - 12 + (i * 0.15)).toFixed(1));
      } else {
        data[i].ma60 = Number((data[i].ma20 - 15).toFixed(1));
      }

      // vOsc (MACD OSC柱狀體)
      if (i < 8) {
        data[i].vOsc = Number((1.5 + (i * 0.4)).toFixed(2));
      } else if (i >= 8 && i < 14) {
        data[i].vOsc = Number((2.0 - (i - 7) * 1.1).toFixed(2)); // crossing below zero slightly
      } else if (i === 14) {
        data[i].vOsc = -3.20; // MACD OSC bottomed
      } else if (i === 15) {
        data[i].vOsc = -0.55; // Huge contraction! OSC[15] > OSC[14] (翻紅/縮小)
      } else {
        data[i].vOsc = Number((-0.55 + (i - 15) * 0.8).toFixed(2));
      }

      // Evaluate XQ xs multi-conditions
      const matched: number[] = [];
      const current = data[i];
      const prevDataDay = i > 0 ? data[i - 1] : null;

      // Condition 1: ma20 > ma60 and ma25 >= ma20[1]
      const c1 = current.ma20 > current.ma60 && (prevDataDay ? current.ma20 >= prevDataDay.ma20 : true);
      if (c1) matched.push(1);

      // Condition 2: Low < ma20[1] in lookback (excl. today)
      let c2 = false;
      if (i >= 5) {
        const lookbackRange = data.slice(Math.max(0, i - lookbackDays), i);
        c2 = lookbackRange.some((d) => d.low < d.ma20);
      }
      if (c2) matched.push(2);

      // Condition 3: Average(Volume, 3)[1] < Average(Volume, 20)[1] (量縮整理)
      let c3 = false;
      if (i >= 4) {
        const prev3DaysVol = (data[i - 1].volume + data[i - 2].volume + data[i - 3].volume) / 3;
        const prev20DaysVol = 1000; 
        c3 = prev3DaysVol < prev20DaysVol;
      }
      if (c3) matched.push(3);

      // Condition 4: Close > ma20 and Volume >= Average(Volume, 5)[1] * VolMultiplier
      let c4 = false;
      if (i >= 5) {
        const avgVol5 = (data[i - 1].volume + data[i - 2].volume + data[i - 3].volume + data[i - 4].volume + data[i - 5].volume) / 5;
        c4 = current.price > current.ma20 && current.volume >= avgVol5 * volMultiplier;
      }
      if (c4) matched.push(4);

      // Condition 5: vOSC > vOSC[1]
      const c5 = prevDataDay ? current.vOsc > prevDataDay.vOsc : false;
      if (c5) matched.push(5);

      // Condition 6: bias20 <= MaxBias (月線乖離合理，防追高)
      const bias = current.ma20 !== 0 ? ((current.price - current.ma20) / current.ma20) * 100 : 0;
      const c6 = bias <= maxBias;
      if (c6) matched.push(6);

      current.matchConditions = matched;

      // Final trigger: ALL conditions are matched!
      if (matched.length === 6) {
        current.isTrigger = true;
      }
    }

    return data;
  }, [selectedStock, length20, volMultiplier, lookbackDays, maxBias]);

  // Set default hover point to peak breakout day on initial load
  useEffect(() => {
    if (simulatedHistoricalChartData.length > 15) {
      setHoveredPoint(simulatedHistoricalChartData[15]);
    }
  }, [simulatedHistoricalChartData]);

  // Handle active preset buttons mapping UI highlights
  const activePresetId = useMemo(() => {
    if (activeConcept.id.startsWith("preset_")) {
      return activeConcept.id.replace("preset_", "").toUpperCase();
    }
    return null;
  }, [activeConcept]);

  const activeIndexPrice = activeConcept.indexPrice || 108.5;
  const activeIndexChange = activeConcept.indexChangePercent || 2.45;
  const activeSurge = activeConcept.intradaySurge || 0.65;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-gray-300 font-sans select-none flex flex-col overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-200">
      
      {/* Dynamic High-Density Header */}
      <header id="app-header" className="sticky top-0 z-40 h-12 border-b border-gray-800 bg-[#14161A] flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]"></div>
            <span className="font-bold text-white text-sm tracking-wider font-mono">XQ GLOBAL WINNER <span className="text-blue-400">PRO</span></span>
          </div>
          <div className="h-4 w-px bg-gray-700"></div>
          
          <nav className="flex space-x-6 text-xs font-semibold">
            <button
              id="tab-dashboard"
              onClick={() => setCurrentTab("dashboard")}
              className={`pb-1 transition-colors border-b-2 font-mono tracking-wider ${
                currentTab === "dashboard"
                  ? "text-blue-400 border-blue-400 font-bold"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              SECTOR MONITOR
            </button>
            <button
              id="tab-scripts"
              onClick={() => setCurrentTab("scripts")}
              className={`pb-1 transition-colors border-b-2 font-mono tracking-wider ${
                currentTab === "scripts"
                  ? "text-blue-400 border-blue-400 font-bold"
                  : "text-gray-400 hover:text-white border-transparent"
              }`}
            >
              SCRIPT LAB
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#0F1115] px-3 py-1 rounded border border-gray-800">
            <span className="text-gray-500">MARKET:</span>
            <span className={isSimulating ? "text-green-400 font-semibold animate-pulse" : "text-amber-500 font-semibold"}>
              {isSimulating ? "OPEN" : "PAUSED"}
            </span>
          </div>
          <span className="text-gray-400 hidden sm:inline">{liveTime || "2026-06-20 10:07:34"}</span>
        </div>
      </header>

      {currentTab === "dashboard" ? (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 w-full min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-800 bg-[#0A0B0D]">
          
          {/* LEFT 4 COLS STYLE PANEL: Custom Index and Heatmap Matrix */}
          <section id="approach1-region" className="lg:col-span-4 flex flex-col p-4 gap-4 overflow-y-auto max-h-[calc(100vh-3rem)]">
            
            {/* Custom Index Monitor segment */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 font-mono">
                    做法一 / 預警雷達
                  </span>
                  <h2 className="text-xs font-bold text-white font-mono">自訂產業商品指數監控</h2>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <span className="text-[9px] text-gray-500 font-mono">XS ACTIVE</span>
                </div>
              </div>

              {/* Selection button tags */}
              <div className="flex items-center gap-1.5 text-[10.5px]">
                <span className="text-gray-500 font-mono">成分族群:</span>
                <button
                  id="preset-btn-cpo"
                  onClick={() => selectPreset("CPO")}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all font-mono font-semibold ${
                    activePresetId === "CPO" 
                      ? "bg-blue-500 text-black shadow-[0_0_8px_rgba(59,130,246,0.25)]" 
                      : "bg-[#0F1115] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  CPO矽光子
                </button>
                <button
                  id="preset-btn-liquid"
                  onClick={() => selectPreset("LIQUID")}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all font-mono font-semibold ${
                    activePresetId === "LIQUID" 
                      ? "bg-blue-500 text-black shadow-[0_0_8px_rgba(59,130,246,0.25)]" 
                      : "bg-[#0F1115] text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  液冷散熱
                </button>
              </div>

              {/* Customizable search forms */}
              <form onSubmit={handleGenerateConcept} className="flex gap-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="concept-search-input"
                    placeholder="輸入自訂板塊... 如 BBU電池"
                    value={conceptQuery}
                    onChange={(e) => setConceptQuery(e.target.value)}
                    className="w-full bg-[#0A0B0D] text-[11px] text-slate-200 px-2.5 py-1 border border-gray-800 rounded font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>
                <button
                  id="search-generate-concept-btn"
                  type="submit"
                  disabled={isAiGenerating}
                  className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-black font-mono font-bold px-2 py-1 rounded text-[10.5px] border border-blue-500/30 transition duration-150 disabled:opacity-50"
                >
                  {isAiGenerating ? "DEPLOYING..." : "DEPLOY AI"}
                </button>
              </form>

              {/* Sector dynamic statistics bars */}
              <div className="grid grid-cols-3 gap-2 bg-[#0F1115] p-2 rounded border border-gray-850">
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 block font-mono">平權指數碼</span>
                  <span className="text-xs font-bold text-gray-300 font-mono">
                    ${activeIndexPrice}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-gray-500 block font-mono">今日漲幅%</span>
                  <span className={`text-xs font-bold font-mono ${
                    activeIndexChange >= 0 ? "text-red-400" : "text-green-400"
                  }`}>
                    {activeIndexChange >= 0 ? "+" : ""}{activeIndexChange}%
                  </span>
                </div>
                <div className={`text-center rounded ${activeSurge >= inputRangePercent ? "bg-red-950/20" : ""}`}>
                  <span className="text-[9px] text-gray-500 block font-mono">5分急拉%</span>
                  <span className={`text-xs font-mono font-bold ${
                    activeSurge >= inputRangePercent ? "text-red-400 animate-pulse underline" : "text-gray-400"
                  }`}>
                    {activeSurge}%
                  </span>
                </div>
              </div>

              {/* Rationale information */}
              <div className="bg-[#0F1115] p-2.5 rounded border border-gray-850 font-sans text-[10.5px]">
                <span className="font-bold text-gray-400 block font-mono text-[9px] uppercase tracking-wider">
                  {activeConcept.conceptName} 佈局內核
                </span>
                <p className="text-gray-400 leading-normal mt-0.5 select-text">
                  {activeConcept.rationale}
                </p>
              </div>

              {/* XS indices criteria dynamic parameters inputs */}
              <div className="bg-[#0F1115] border border-gray-850 rounded p-2.5 flex flex-col gap-2 font-mono text-[10px]">
                <div className="flex justify-between items-center text-gray-500 border-b border-gray-850 pb-1">
                  <span>XS 觸發雷達參數</span>
                  <span className="text-blue-400 font-bold">LIVE SYNC</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Ratio%</span>
                    <input
                      type="number"
                      step="0.5"
                      value={inputRatio}
                      onChange={(e) => setInputRatio(Number(e.target.value))}
                      className="w-full bg-[#0A0B0D] border border-gray-800 text-[10.5px] text-blue-400 text-center py-0.5 rounded focus:outline-none focus:border-blue-400 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">BarCount</span>
                    <input
                      type="number"
                      value={inputBarCount}
                      onChange={(e) => setInputBarCount(Number(e.target.value))}
                      className="w-full bg-[#0A0B0D] border border-gray-800 text-[10.5px] text-blue-400 text-center py-0.5 rounded focus:outline-none focus:border-blue-400 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Surge%</span>
                    <input
                      type="number"
                      step="0.1"
                      value={inputRangePercent}
                      onChange={(e) => setInputRangePercent(Number(e.target.value))}
                      className="w-full bg-[#0A0B0D] border border-gray-800 text-[10.5px] text-blue-400 text-center py-0.5 rounded focus:outline-none focus:border-blue-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Rationale recommendation pill */}
              <div className="bg-[#111317] border border-blue-500/10 p-2.5 rounded text-[10.5px] text-blue-300">
                <span className="font-bold text-blue-400 block mb-0.5 font-mono text-[9px]">XQ AI MULTI-FACTOR PREVIEW:</span>
                {activeConcept.marketInsight}
              </div>
            </div>

            {/* Approach 2 - Breakthrough Sector Frequency matrix (做法二 / 統計分析) */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/10 text-red-500 font-bold border border-red-500/20 font-mono">
                    做法二 / 統計分析
                  </span>
                  <h2 className="text-xs font-bold text-white font-mono">強勢突破股「欄位排序頻率統計」</h2>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">50檔大單池</span>
              </div>

              <p className="text-[10.5px] text-gray-400 leading-normal font-sans">
                經盤中 XS 雷達選股符合<strong>「高檔暴量突破 20 日高點」</strong>之明細，依板塊歸類家數。
                若單一細產業於本日密集大於 4 檔發動，即為<strong>族群性集體引爆點</strong>：
              </p>

              {/* Heatmap grid style dashboard */}
              <div className="grid grid-cols-2 gap-2">
                {sectors.map((sec) => {
                  const isClustered = sec.breakoutCount >= 4;
                  return (
                    <div
                      key={sec.id}
                      id={`heatmap-card-${sec.id}`}
                      className={`p-2.5 rounded border flex flex-col justify-between h-20 transition-all relative overflow-hidden ${
                        isClustered
                          ? "bg-red-500/5 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                          : "bg-[#0F1115] border-gray-850 hover:border-gray-700"
                      }`}
                    >
                      {isClustered && (
                        <div className="absolute top-0 right-0 py-0.5 px-1 bg-red-500 text-black text-[8px] font-bold rounded-bl uppercase tracking-wider flex items-center gap-0.5">
                          <Flame className="w-2 h-2 shrink-0" />
                          族群集體突破!
                        </div>
                      )}

                      <div>
                        <div className="text-[8.5px] text-gray-500 font-mono uppercase tracking-wider">
                          {sec.codePrefix}
                        </div>
                        <h3 className="text-[11px] font-bold text-white font-sans truncate">{sec.name}</h3>
                      </div>

                      <div className="flex items-end justify-between text-[10px] font-mono">
                        <span className="text-gray-500 font-normal">總池 {sec.total} 檔</span>
                        <span className={`font-bold ${isClustered ? "text-red-400 font-black" : "text-gray-300"}`}>
                          {sec.breakoutCount} 檔突破
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* CENTRAL 5 COLS: Flowchart, Constituents Table & Technical Candlestick Charts */}
          <section id="approach3-region-center" className="lg:col-span-5 flex flex-col p-4 gap-4 overflow-y-auto max-h-[calc(100vh-3rem)] border-r border-gray-800">
            
            {/* Group Ignition Logic Dynamic Flowchart */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between border-b border-gray-850 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white font-mono">細產業「集體啟動」動能淬鍊流程</span>
                </div>
                <span className="text-[9px] text-[#e0a96d] font-mono">FLOW GRAPH</span>
              </div>

              {/* High Density Flow Steps */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono mt-1 relative">
                <div className="p-1 px-1.5 rounded bg-[#0A0B0D] border border-gray-850 flex flex-col items-center justify-between min-h-[56px]">
                  <span className="text-blue-400 font-bold block">STEP 01</span>
                  <span className="text-gray-400 text-[8.5px] leading-tight">編製自訂籃子</span>
                  <span className="text-gray-600">產業權重 1:1</span>
                </div>
                <div className="p-1 px-1.5 rounded bg-[#0A0B0D] border border-gray-850 flex flex-col items-center justify-between min-h-[56px] relative">
                  <span className="text-blue-400 font-bold block">STEP 02</span>
                  <span className="text-gray-400 text-[8.5px] leading-tight">5分放量急拉</span>
                  <span className="text-amber-500 font-semibold">&gt;{inputRangePercent}%</span>
                </div>
                <div className="p-1 px-1.5 rounded bg-[#0A0B0D] border border-gray-850 flex flex-col items-center justify-between min-h-[56px]">
                  <span className="text-blue-400 font-bold block">STEP 03</span>
                  <span className="text-gray-400 text-[8.5px] leading-tight">起漲突破MA20</span>
                  <span className="text-gray-600">突破極致縮量</span>
                </div>
                <div className="p-1 px-1.5 rounded bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-between min-h-[56px]">
                  <span className="text-amber-400 font-bold block">STEP 04</span>
                  <span className="text-amber-200 text-[8.5px] leading-tight">雷達同步示警</span>
                  <span className="text-red-400 font-bold animate-pulse">BUY TRIGGER</span>
                </div>
              </div>
            </div>

            {/* Constituents State Interactive list table */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-gray-850 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {activeConcept.conceptName} 即時成分股 (點選載入日K操盤模擬)
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">共 {activeConcept.stocks.length} 檔</span>
              </div>

              {/* Rows layout list in high density style */}
              <div className="grid grid-cols-1 gap-1">
                {activeConcept.stocks.map((stock) => {
                  const sPrice = stock.currentPrice || stock.basePrice;
                  const sChange = stock.changePercent || 0;
                  const isCurrent = selectedStock === stock.code;
                  return (
                    <div
                      key={stock.code}
                      id={`stock-row-${stock.code}`}
                      onClick={() => setSelectedStock(stock.code)}
                      className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer border text-xs ${
                        isCurrent
                          ? "bg-blue-500/10 border-blue-500/60 text-blue-200"
                          : "bg-[#0A0B0D] border-gray-850 hover:bg-[#0F1115] hover:border-gray-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[10px] font-bold px-1 rounded ${
                            isCurrent ? "bg-blue-500 text-black" : "bg-gray-800 text-gray-300"
                          }`}>
                            {stock.code}
                          </span>
                          <span className="font-semibold text-gray-100">{stock.name}</span>
                          {sChange >= 9.8 && (
                            <span className="bg-red-500 text-black text-[9px] font-serif font-black px-1 rounded animate-pulse">
                              漲停
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] text-gray-500 truncate max-w-[240px] mt-0.5">
                          {stock.description}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-gray-200 text-xs">${sPrice.toFixed(1)}</div>
                        <div className={`text-[10px] ${sChange >= 0 ? "text-red-400" : "text-green-400"}`}>
                          {sChange >= 0 ? "+" : ""}{sChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy controls & Candlestick Technical Analysis Area */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-3">
              
              {/* Technical active headline */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#e0a96d]" />
                  <span className="text-xs font-bold text-white font-mono">
                    {selectedStock === "3363" ? "上詮 (3363)" : selectedStock === "4979" ? "華星光 (4979)" : `自訂成分股 (${selectedStock})`} 操盤沙盤模擬室
                  </span>
                </div>
                
                {/* Stock Selector inside simulation */}
                <select
                  id="chart-stock-selector"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="bg-[#0A0B0D] border border-gray-800 text-[10.5px] text-blue-400 font-mono p-1 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="3363">上詮 (3363)</option>
                  <option value="4979">華星光 (4979)</option>
                </select>
              </div>

              {/* Dynamic Adjustable Slider settings in high density */}
              <div className="grid grid-cols-2 gap-3 bg-[#0A0B0D] p-2.5 border border-gray-850 rounded">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                    <span>量能發動門檻 (VolMultiplier)</span>
                    <span className="text-[#e0a96d] font-bold">{volMultiplier}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={volMultiplier}
                    onChange={(e) => setVolMultiplier(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                    <span>回溯洗盤天數 (LookbackDays)</span>
                    <span className="text-[#e0a96d] font-bold">{lookbackDays}日</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                    <span>最大月均線乖離率 (MaxBias%)</span>
                    <span className="text-[#e0a96d] font-bold">{maxBias}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="0.5"
                    value={maxBias}
                    onChange={(e) => setMaxBias(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                    <span>均線周期 (MA20周期)</span>
                    <span className="text-[#e0a96d] font-bold">{length20}MA</span>
                  </div>
                  <input
                    type="number"
                    min="15"
                    max="25"
                    value={length20}
                    onChange={(e) => setLength20(Number(e.target.value))}
                    className="w-full bg-[#14161A] border border-gray-850 text-xs text-[#e0a96d] font-mono text-center p-0.5 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Main SVG Candlestick technical Chart drawing */}
              <div className="bg-[#0A0B0D] border border-gray-850 rounded p-2.5 relative flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-mono border-b border-gray-900 pb-1 text-gray-500">
                  <span>均線: orange=MA5, yellow=MA10, blue=MA20, cyan=MA60</span>
                  <span>橫軸: 日K線序列 (紅多綠空)</span>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg 
                    width="440" 
                    height="170" 
                    className="min-w-[440px] bg-[#0A0B0D]"
                  >
                    {/* Grids background lines */}
                    <line x1="0" y1="40" x2="440" y2="40" stroke="#1F2937" strokeDasharray="2,2" />
                    <line x1="0" y1="80" x2="440" y2="80" stroke="#1F2937" strokeDasharray="2,2" />
                    <line x1="0" y1="120" x2="440" y2="120" stroke="#1F2937" strokeDasharray="2,2" />

                    {/* Plot technical moving averages lines */}
                    <polyline
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.0"
                      points={simulatedHistoricalChartData.map((d, i) => `${(i * 12.2) + 12},${130 - (d.ma5 - 150) * 1.6}`).join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.0"
                      strokeDasharray="2,1"
                      points={simulatedHistoricalChartData.map((d, i) => `${(i * 12.2) + 12},${130 - (d.ma10 - 150) * 1.6}`).join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="1.8"
                      points={simulatedHistoricalChartData.map((d, i) => `${(i * 12.2) + 12},${130 - (d.ma20 - 150) * 1.6}`).join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke="#0891b2"
                      strokeWidth="1.0"
                      points={simulatedHistoricalChartData.map((d, i) => `${(i * 12.2) + 12},${130 - (d.ma60 - 150) * 1.6}`).join(" ")}
                    />

                    {/* Stock Candle drawings */}
                    {simulatedHistoricalChartData.map((d, i) => {
                      const x = (i * 12.2) + 12;
                      const yClose = 130 - (d.price - 150) * 1.6;
                      const yOpen = 130 - (d.open - 150) * 1.6;
                      const yHigh = 130 - (d.high - 150) * 1.6;
                      const yLow = 130 - (d.low - 150) * 1.6;
                      const isUp = d.price >= d.open;
                      const candleColor = isUp ? "#ef4444" : "#22c55e";

                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer hover:opacity-80" 
                          onClick={() => setHoveredPoint(d)}
                          onMouseEnter={() => setHoveredPoint(d)}
                        >
                          {hoveredPoint?.date === d.date && (
                            <rect x={x - 5} y="0" width="10" height="170" fill="rgba(59,130,246,0.06)" />
                          )}

                          {/* Wick line */}
                          <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1" />
                          
                          {/* Candle body */}
                          <rect
                            x={x - 3}
                            y={Math.min(yClose, yOpen)}
                            width="6"
                            height={Math.max(1.5, Math.abs(yClose - yOpen))}
                            fill={candleColor}
                          />

                          {/* XS strategy Trigger buy dots */}
                          {d.isTrigger && (
                            <g>
                              <circle cx={x} cy={yClose} r="6" fill="rgba(239,68,68,0.25)" className="animate-ping" />
                              <circle cx={x} cy={yClose} r="3" fill="#f59e0b" stroke="#000" strokeWidth="0.5" />
                              <text x={x - 8} y={yClose - 8} fill="#f59e0b" fontSize="7" fontWeight="black" fontFamily="monospace">
                               雷達
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Simulated Volume and MACD OSC histogram at the base */}
                <div className="w-full overflow-x-auto border-t border-gray-900 pt-1">
                  <svg 
                    width="440" 
                    height="50" 
                    className="min-w-[440px] bg-[#0A0B0D]"
                  >
                    {simulatedHistoricalChartData.map((d, i) => {
                      const x = (i * 12.2) + 12;
                      const volHeight = Math.min(22, (d.volume / 3500) * 22);
                      const isVolBreakout = i >= 5 && d.volume >= ((simulatedHistoricalChartData.slice(Math.max(0, i-5), i).reduce((sum, item)=>sum+item.volume,0)/5) * volMultiplier);
                      const barFill = isVolBreakout ? "#fbbf24" : "rgba(156,163,175,0.25)";

                      const oscY = 38;
                      const oscHeight = d.vOsc * 2.2;
                      const oscColor = d.vOsc >= 0 ? "#ef4444" : "#22c55e";

                      return (
                        <g key={i}>
                          {/* Volume column */}
                          <rect x={x - 3} y={23 - volHeight} width="6" height={volHeight} fill={barFill} />
                          <line x1="0" y1="38" x2="440" y2="38" stroke="#374151" strokeWidth="0.5" />
                          {/* MACD OSC column */}
                          <rect
                            x={x - 1.5}
                            y={oscY - (oscHeight >= 0 ? oscHeight : 0)}
                            width="3"
                            height={Math.max(1, Math.abs(oscHeight))}
                            fill={oscColor}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Active pointer data results block */}
              <div className="bg-[#0A0B0D] p-2 border border-gray-850 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-gray-300 font-sans">
                    日期: <strong className="text-[#e5c158] font-mono">{hoveredPoint?.date || "06-16"}</strong> | 收盤價: <strong className="text-white font-mono">${hoveredPoint?.price || 194.2}</strong>
                  </span>
                </div>

                <div className="flex gap-2 text-[10px] font-mono bg-[#14161A] p-1 px-2 border border-gray-800 rounded">
                  <div className="text-center font-normal px-1 border-r border-gray-850">
                    <span className="text-gray-500 block text-[9px] scale-95">MA20值</span>
                    <span className="text-blue-300 font-semibold">${hoveredPoint?.ma20 || "—"}</span>
                  </div>
                  <div className="text-center font-normal px-1 border-r border-gray-850">
                    <span className="text-gray-500 block text-[9px] scale-95">量比</span>
                    <span className="text-[#e0a96d] font-semibold">
                      {(hoveredPoint && hoveredPoint.ma5 > 0) ? (hoveredPoint.volume / (hoveredPoint.volume * 0.45)).toFixed(1) : "1.8"}x
                    </span>
                  </div>
                  <div className="text-center font-normal px-1">
                    <span className="text-gray-500 block text-[9px] scale-95">月乖離</span>
                    <span className="text-red-400 font-semibold">
                      {hoveredPoint ? (((hoveredPoint.price - hoveredPoint.ma20)/hoveredPoint.ma20)*100).toFixed(2) : "1.25"}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </section>

          {/* RIGHT 3 COLS PANEL: Criteria Selector, Dynamic AI breakdown & Warning logs */}
          <section id="approach3-region-right" className="lg:col-span-3 flex flex-col p-4 gap-4 overflow-y-auto max-h-[calc(100vh-3rem)]">
            
            {/* XS Criteria selectors checklist list */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-gray-850 pb-1.5">
                <span className="text-xs font-bold text-white font-mono">XS 多因子篩選觸發核對錶</span>
                <span className="text-[10px] text-gray-500 font-mono">條件剖析</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {[
                  { num: 1, label: "多頭格局 & 月線角度上拉", desc: "ma20 > ma60 and ma20 >= ma20[1]" },
                  { num: 2, label: "歷史洗盤：10天內曾跌破月線", desc: "TrueAny(Low[1] < ma20[1], LookbackDays)" },
                  { num: 3, label: "壓抑洗盤：前3天極致縮量", desc: "Average(Volume, 3)[1] < Average(Volume, Length20)[1]" },
                  { num: 4, label: "今日表態：帶量重奪月線", desc: "Close > ma20 and Volume >= 5日均量 * 1.5倍" },
                  { num: 5, label: "動能確認：MACD OSC收斂進逼", desc: "vOSC > vOSC[1]" },
                  { num: 6, label: "嚴格避避雷：限制月線乖離率", desc: "bias20 <= 4 %" }
                ].map((cond) => {
                  const isHoveredMatched = hoveredPoint?.matchConditions.includes(cond.num) || false;
                  const isTrigger = hoveredPoint?.isTrigger || false;
                  
                  return (
                    <div
                      key={cond.num}
                      id={`condition-card-${cond.num}`}
                      onClick={() => handleExplainCondition(cond.num)}
                      className={`p-2 rounded text-[10.5px] border cursor-pointer text-left transition-all flex items-center justify-between gap-1.5 ${
                        selectedCondition === cond.num
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-200"
                          : "bg-[#0A0B0D] border-gray-850 hover:bg-[#0F1115]"
                      }`}
                    >
                      <div className="flex items-start gap-1.5 truncate">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono shrink-0 mt-0.5 ${
                          isHoveredMatched || isTrigger
                            ? "bg-blue-400 text-black"
                            : "bg-gray-800 text-gray-400"
                        }`}>
                          {cond.num}
                        </span>
                        <div className="truncate">
                          <div className="text-gray-200 text-[10.5px] font-medium leading-tight truncate">{cond.label}</div>
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5 truncate">{cond.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        {isHoveredMatched ? (
                          <span className="text-[8.5px] bg-red-400/10 border border-red-400/20 text-red-400 px-1 py-0.2 rounded font-semibold">
                            滿足
                          </span>
                        ) : (
                          <span className="text-[8.5px] text-gray-500 font-mono">
                            未足
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Psychology explanation panel */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs border-b border-gray-850 pb-1.5 font-mono">
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                <span>AI 主力籌碼心理學分析庫</span>
              </div>
              
              <div className="text-gray-300 text-[10.5px] leading-relaxed font-sans bg-[#0A0B0D] p-2.5 rounded border border-gray-850 select-text">
                {isFetchingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9.5px] text-gray-500 font-mono">Gemini 智能解析條件 {selectedCondition}...</span>
                  </div>
                ) : (
                  <p>{aiExplanation}</p>
                )}
              </div>
            </div>

            {/* Rolling warning logs console list */}
            <div className="bg-[#14161A] border border-gray-800 rounded p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-gray-850 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white font-mono">盤中雷達即時示警追蹤</span>
                </div>
                <button
                  id="clear-logs-btn"
                  onClick={() => setAlertLogs([])}
                  className="text-[9.5px] text-gray-500 hover:text-gray-300 hover:underline font-mono"
                >
                  CLEAR
                </button>
              </div>

              {/* Warning rows list wrapper */}
              <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5">
                {alertLogs.length === 0 ? (
                  <div className="text-center text-[10px] text-gray-500 py-4 font-mono select-text">
                    [WAITING] 啟動上方模擬中... 接收即時觸發點
                  </div>
                ) : (
                  alertLogs.map((log) => {
                    const isHigh = log.severity === "high";
                    return (
                      <div
                        key={log.id}
                        id={`alert-log-${log.id}`}
                        className={`p-2 rounded border text-[10px] flex flex-col gap-1 transition-all ${
                          isHigh
                            ? "bg-red-500/5 border-red-500/20 text-red-200"
                            : "bg-[#0A0B0D] border-gray-850 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-gray-500 text-[9.5px] shrink-0">
                            [{log.time}]
                          </span>
                          <span className={`px-1 rounded text-[8.5px] font-bold ${
                            log.type === "INDEX_SURGE" 
                              ? "bg-blue-400 text-black font-black" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {log.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal font-sans">
                          {log.targetName}: {log.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick overview script shortcut button to SCRIPT LAB tab */}
            <div className="p-2.5 rounded bg-[#0A0B0D] border border-gray-850 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-sans text-[10.5px]">XQ 語法代碼已就緒</span>
              <button
                id="tab-scripts-btn-shortcut"
                onClick={() => setCurrentTab("scripts")}
                className="text-[10.5px] text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold"
              >
                複製腳本庫 &rarr;
              </button>
            </div>

          </section>

        </main>
      ) : (
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-2 font-mono">XQ全球贏家 實戰 XS 腳本庫</h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                本系統採集的核心 XQ 策略代碼。您可點選並直接網頁複製（Clipboard Copy）至您的 XQ 系統中：
                開啟 XQ ➔ 策略 ➔ 系統腳本 ➔ 新增自訂選股/自訂警示中，即可完全還原一比一的效果。
              </p>
              
              {/* Insert beautiful modular TSX scripts editor component */}
              <XSEditor />
            </div>
            
            {/* Troubleshooting & Guide banner */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex gap-3.5">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-200 font-mono">為什麼無法直接在 XQ 個股腳本裏監控全族群？</h3>
                <p className="text-[11.5px] text-slate-400 leading-relaxed mt-1">
                  因 XQ 腳本為精確逐檔執行結構（單兵作戰，一檔一檔股票輪流調用），在 execution 流程中很難直接引用其餘隨機 stock 的即時變動量。
                  所以實務做法有二：<strong>一是先編製自訂平權產業指數</strong>（做法一：雷達指向到群組指數，當指數短線急拉宣告發動）；
                  <strong>二是使用盤後產業統計篩選出重複度</strong>（做法二：抓出今天同時創高的前幾名概念股分類）。本儀表板完美還原了此二種高效率解決方案！
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Styled simple footer */}
      <footer id="app-footer" className="bg-slate-900 border-t border-slate-800 p-4 text-center mt-auto text-[11px] text-slate-500 font-mono">
        XQ Group Momentum Command Center • Designed with React, Tailwind & Google Gemini AI • UTC: 2026-06-20
      </footer>

    </div>
  );
}
