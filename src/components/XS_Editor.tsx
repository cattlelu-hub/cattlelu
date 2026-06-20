import React, { useState } from "react";
import { Copy, Check, FileCode, ShieldCheck, Cpu, Code2 } from "lucide-react";

interface ScriptItem {
  id: string;
  name: string;
  type: string;
  frequency: string;
  code: string;
  description: string;
}

export default function XSEditor() {
  const [activeTab, setActiveTab] = useState<string>("washout_perfect");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scripts: ScriptItem[] = [
    {
      id: "washout_perfect",
      name: "強勢股破月線量縮洗盤再起_完美版",
      type: "選股腳本 / 雷達腳本",
      frequency: "日線",
      description: "完美融合多頭格局、跌破月線誘空洗盤、極致量縮整理、今日復甦帶量站回月線，並加入月線黃金乖離防守，是集主力籌碼與動能之大成的經典實戰腳本。",
      code: `// 腳本名稱：強勢股破月線量縮洗盤再起_完美版
// 適用頻率：日線

input: Length5(5, "5日均線"), Length10(10, "10日均線"), Length20(20, "20日均線"), Length60(60, "60日均線");
input: VolMultiplier(1.5, "突破放量倍數");
input: LookbackDays(10, "回溯洗盤天數");
input: MaxBias(4, "最大月線乖離率(%)"); // 限制突破當天不能離月線太遠

variable: ma5(0), ma10(0), ma20(0), ma60(0);
variable: vDIF(0), vMACD(0), vOSC(0);
variable: bias20(0); // 月線乖離率變數

// 1. 計算技術指標
ma5 = Average(Close, Length5);
ma10 = Average(Close, Length10);
ma20 = Average(Close, Length20);
ma60 = Average(Close, Length60);

// 計算今日收盤價與月線的乖離率
if ma20 <> 0 then bias20 = ((Close - ma20) / ma20) * 100;

// XQ 內建 MACD 函數
MACD(Close, 12, 26, 9, vDIF, vMACD, vOSC);

// 2. 條件定義

// 條件一：多頭格局基底 + 月線角度上揚（尚未下彎）
condition1 = ma20 > ma60 and ma20 >= ma20[1];

// 條件二：曾經下殺破月線
// 過去 10 個交易日內（不含今天），曾有任何一天的最低價跌破當時的月線
condition2 = TrueAny(Low[1] < ma20[1], LookbackDays);

// 條件三：量縮整理
// 突破前 3 天的平均成交量，明顯低於 20 日均量，代表洗盤時籌碼沉澱
condition3 = Average(Volume, 3)[1] < Average(Volume, Length20)[1];

// 條件四：今日帶量突破月線
// 今日收盤價站上月線，且今日成交量大於「5日均量」的 1.5 倍
condition4 = Close > ma20 and Volume >= Average(Volume, 5)[1] * VolMultiplier;

// 條件五：MACD 柱狀體縮小或翻紅
condition5 = vOSC > vOSC[1];

// 條件六：離月均線乖離未過大
// 確保收盤價距離月線在設定的百分比（如 4%）以內，避免過度追高
condition6 = bias20 <= MaxBias;

// 3. 嚴格篩選觸發
if condition1 and condition2 and condition3 and condition4 and condition5 and condition6 then Ret = 1;

// 4. 輸出欄位（方便快速檢視）
OutputField(1, Close, 2, "今日收盤");
OutputField(2, ma20, 2, "今日月線值");
OutputField(3, Volume / Average(Volume, 5)[1], 1, "量增倍數");
OutputField(4, bias20, 2, "月線乖離率%");
OutputField(5, vOSC, 2, "MACD柱狀體");`
    },
    {
      id: "index_surge",
      name: "自訂指數5分鐘集體暴衝",
      type: "警示雷達腳本",
      frequency: "1分鐘線",
      description: "应用於自訂細產業商品，當所有成份股集體受資金追捧急速拉抬時，偵測自訂指數的 short-term 加速度，提早全市場一步鎖定今日爆發的主流族群。",
      code: `// 腳本類型：警示腳本
// 應用商品：請綁定您自訂創立的「細產業商品平權指數」
// 執行頻率：1分鐘線

input: Ratio(2, "今日漲幅觸發(%)");
input: BarCount(5, "回溯分鐘數(幾支Bar)");
input: RangePercent(1.5, "短線急拉幅度(%)");

// 條件1：今天自訂指數的漲幅已經超過設定值
condition1 = (Close - q_RefPrice) / q_RefPrice * 100 >= Ratio;

// 條件2：短時間內（例如5分鐘內）指數急拉
condition2 = (Close - Close[BarCount]) / Close[BarCount] * 100 >= RangePercent;

if condition1 and condition2 then
begin
    RetMsg = "【族群性發動】自訂產業指數短線集體暴衝！";
    Ret = 1;
end;`
    },
    {
      id: "stock_breakout_basic",
      name: "個股強勢爆量突破",
      type: "選股腳本",
      frequency: "日線",
      description: "最基礎的強勢股突破濾網：量增2倍創20日新高，搭配漲幅達到4.5%，用於統計每日強勢股。可在XQ中用欄位排序或產業分析，偵測有沒有光通訊、散熱等同產業個股密集連鎖爆發。",
      code: `// 腳本類型：選股腳本
// 執行頻率：日線

input: VolumeFactor(2, "成交量放大倍率");

// 條件1：今日成交量為20天平均量的2倍以上
condition1 = Volume > Average(Volume, 20) * VolumeFactor;

// 條件2：今日收盤價創20天新高
condition2 = Close = Highest(Close, 20);

// 條件3：漲幅大於4.5%（代表有實質主力進駐）
condition3 = (Close - Close[1]) / Close[1] * 100 >= 4.5;

if condition1 and condition2 and condition3 then
begin
    Ret = 1;
end;`
    }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currScript = scripts.find((s) => s.id === activeTab) || scripts[0];

  return (
    <div id="xs_script_editor" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Tab select bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 p-2 overflow-x-auto gap-2">
        {scripts.map((script) => (
          <button
            key={script.id}
            id={`btn-tab-${script.id}`}
            onClick={() => setActiveTab(script.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === script.id
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {script.name}
          </button>
        ))}
      </div>

      {/* Code details */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              頻率: {currScript.frequency}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              類型: {currScript.type}
            </span>
          </div>
          <button
            id={`copy-script-${currScript.id}`}
            onClick={() => handleCopy(currScript.id, currScript.code)}
            className="flex items-center gap-1.5 self-start md:self-auto px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition duration-150 border border-slate-700 font-medium"
          >
            {copiedId === currScript.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">已複製！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>複製 XS 程式碼</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-sans">
          {currScript.description}
        </p>
      </div>

      {/* Real editor container */}
      <div className="relative">
        <textarea
          readOnly
          id={`textarea-${currScript.id}`}
          className="w-full h-[380px] bg-slate-950 text-slate-300 p-4 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-0 select-text overflow-y-auto"
          value={currScript.code}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-slate-500 font-mono select-none px-2 py-1 bg-slate-900/95 rounded">
          <FileCode className="w-3" />
          <span>XS Script | UTF-8</span>
        </div>
      </div>
    </div>
  );
}
