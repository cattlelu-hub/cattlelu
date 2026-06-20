import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini AI with safe header user-agent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY is not defined. Falling back to structured search mock data.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -----------------------------------------------------------------
// Preset fallback data if API key is missing or for rapid testing
// -----------------------------------------------------------------
const conceptPresets: { [key: string]: any } = {
  "cpo": {
    conceptName: "CPO 光共同封裝 (Silicon Photonics)",
    rationale: "共同封裝光學 (Co-Packaged Optics, CPO) 技術將矽光晶片與交換器晶片整合封裝，大幅減少訊號傳輸距離並降低功耗，是高階 AI 伺服器傳輸速突破極限的關鍵技術。",
    stocks: [
      { code: "3363", name: "上詮", basePrice: 185.5, weight: 1.0, description: "與台積電、輝達合作光通道技術封裝" },
      { code: "4979", name: "華星光", basePrice: 145.0, weight: 1.0, description: "主力出貨 800G 高速光收發模組" },
      { code: "3450", name: "聯鈞", basePrice: 220.0, weight: 1.0, description: "封測大廠，矽光子雷射封測關鍵供應鏈" },
      { code: "3081", name: "聯亞", basePrice: 310.5, weight: 1.0, description: "美系大廠 CPO 雷射磊晶片核心供應商" },
      { code: "6451", name: "訊芯-KY", basePrice: 215.0, weight: 1.0, description: "鴻海集團旗下，專攻 CPO 模組高速封測" }
    ],
    marketInsight: "產業正處於從 800G 升級 1.6T 關鍵期。市場資金十分青睞，突破平台後通常會引爆全群熱潮。"
  },
  "liquid": {
    conceptName: "AI 伺服器液冷散熱 (Liquid Cooling)",
    rationale: "GB200晶片功耗大幅突破，傳統風冷方案已步入極限，液冷水冷板(Cold Plate)、冷卻分配量(CDU)及快接頭等技術成為主流標配。",
    stocks: [
      { code: "3017", name: "奇鋐", basePrice: 620.0, weight: 1.0, description: "3D VC 與水冷板全套解決方案一線廠商" },
      { code: "3324", name: "雙鴻", basePrice: 680.0, weight: 1.0, description: "CDU、分流折板及水冷系統指標性大廠" },
      { code: "2421", name: "建準", basePrice: 110.5, weight: 1.0, description: "提供高階散熱風扇與液冷泵浦輔助設計" },
      { code: "3008", name: "大立光", basePrice: 2150.0, weight: 0.1, description: "傳跨足快接頭精密金屬零件技術" },
      { code: "8996", name: "高力", basePrice: 325.5, weight: 1.0, description: "提供液冷歧管與熱交換器核心關鍵部件" }
    ],
    marketInsight: "液冷滲透率正逐步從10%攀升至35%。目前正值認證期與首批拉貨期，領先創高個股對群體具有強烈帶動效果。"
  }
};

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Search & Generate Concept via Gemini
app.post("/api/gemini/generate-concept", async (req, res) => {
  const { conceptQuery } = req.body;
  if (!conceptQuery) {
    return res.status(400).json({ error: "Missing conceptQuery" });
  }

  const queryKey = conceptQuery.toLowerCase().trim();
  
  // Quick return for presets to guarantee instant responsiveness if requested
  if (queryKey === "cpo" || queryKey === "cpo光共同封裝" || queryKey === "矽光子") {
    return res.json(conceptPresets.cpo);
  }
  if (queryKey === "liquid" || queryKey === "液冷" || queryKey === "散熱" || queryKey === "液冷散熱") {
    return res.json(conceptPresets.liquid);
  }

  const geminiKeyExists = !!process.env.GEMINI_API_KEY;

  if (!geminiKeyExists) {
    // Return a dynamically simulated mock concept based on the conceptQuery if no API Key exists
    const randId = Math.floor(Math.random() * 100);
    return res.json({
      conceptName: `自訂 ${conceptQuery} 概念指數`,
      rationale: `這是一個針對「${conceptQuery}」產業進行智能評估所編製的平權概念指數。收集了該族群中最具代表性、關聯度最高的核心供應鏈成員。`,
      stocks: [
        { code: `100${randId}`, name: `${conceptQuery}龍頭`, basePrice: 120 + Math.random() * 200, weight: 1.0, description: `國內${conceptQuery}大廠，市佔率領先` },
        { code: `200${randId}`, name: `${conceptQuery}二哥`, basePrice: 85 + Math.random() * 100, weight: 1.0, description: `關鍵上游模組，獲得國際品牌認證` },
        { code: `300${randId}`, name: `${conceptQuery}黑馬`, basePrice: 45 + Math.random() * 50, weight: 1.0, description: `轉型切入此族群，獲利爆發力強` },
        { code: `400${randId}`, name: `${conceptQuery}設備手`, basePrice: 160 + Math.random() * 150, weight: 1.0, description: `專屬測試設備獨家供應，訂單能見度高` }
      ],
      marketInsight: `技術面多頭排列，短線上因${conceptQuery}題材集體發酵，均線正逐漸糾結往上，強烈建議監控 5 分鐘急拉幅度以掌握群體突破點。`
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `你是一個資深的台灣股市量化交易研究員。請針對使用者輸入的股票題材或族群名稱: "${conceptQuery}"。
分析並選出 4 到 5 檔最核心、成交量熱烈且具代表性的台灣上市櫃成份股，組建成一個自訂概念族群。
請務必精準回答，提供正確的股票代號與名稱（例如：CPO 填上詮 3363，散熱填奇鋐 3017等，若為其餘新興概念，請用真實存在或合理的代表股票）。

請以 JSON 格式回應，必須完全契合以下 JSON schema：
{
  conceptName: string (精準的產業/概念名稱),
  rationale: string (此概念的產業邏輯與驅動因素介紹，字數約150字),
  stocks: array of objects [
    {
      code: string (一律為4位或5位數字字串代表台灣股票代碼，例如 "3363"),
      name: string (股票繁體中文名稱，例如 "上詮"),
      basePrice: number (合理的近期股價，例如 185.5),
      weight: number (平權配置比例，通常填 1.0),
      description: string (為何將此股納入此概念的理由，必須具有專業投資人的佐證，例如「提供矽光封測服務，切入美系CSP硬體鏈」)
    }
  ],
  marketInsight: string (近期針對此族群的技術形態或籌碼觀察，並點評如何設定「急拉%與突破漲幅」以監控此群體集體發動)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptName: { type: Type.STRING },
            rationale: { type: Type.STRING },
            stocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  name: { type: Type.STRING },
                  basePrice: { type: Type.NUMBER },
                  weight: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["code", "name", "basePrice", "weight", "description"]
              }
            },
            marketInsight: { type: Type.STRING }
          },
          required: ["conceptName", "rationale", "stocks", "marketInsight"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini request failed, returning mock:", error.message);
    res.json(conceptPresets.cpo);
  }
});

// API: AI interpretation of the specified XS Script
app.post("/api/gemini/explain-script", async (req, res) => {
  const { conditionNum } = req.body;
  const geminiKeyExists = !!process.env.GEMINI_API_KEY;

  const defaultExplanations: { [key: string]: string } = {
    "1": "【多頭格局基底 + 月線角度上揚】定義短中期趨勢偏多。MA20 大於 MA60 確保了股價在季均線上有支撐，且 MA20 大於等於前一日的 MA20，杜絕了正在走空的下彎均線個股。這是最重要的過濾網。",
    "2": "【曾經下殺破月線】這是典型的「回檔洗盤」驗證。限制過去 10 個交易日內必須有任何一天的最低價破過月線，把那些一直在天空中強勢上攻沒有經過淬鍊的股票篩除，只找主力做過打壓洗盤、製造恐慌誘空的優質個股。",
    "3": "【量縮整理】在回測破月線的期間，主力壓低洗盤時散戶必須下車。所以規定突破前3天的成交均量落後於20日均量。量縮極致代表賣壓竭盡，此時籌碼完全沉澱，只要主力稍微一推，就能輕鬆往上展開新攻勢。",
    "4": "【今日帶量突破月線】今日爆紅Ｋ棒強力站回 MA20，成交量放大到 5 日均量的 1.5 倍以上。這是洗盤結束的表態訊號！代表主力資金今日重新點火，以實質買單宣示重新掌控多頭發球權。",
    "5": "【MACD 柱狀體縮小或翻紅】用震盪指標 MACD 雙重確認動能。當 OSC[0] > OSC[1]，表示雖然之前股價拉回洗盤，但動能指標的負值正在收斂或直接翻紅，此時買力正式轉強，具有強烈的短線動能突破意義。",
    "6": "【離月均線乖離未過大】新增之核心控險因子。控制今日突破當下的乖離率（bias20 <= MaxBias, 預設 4%）。目的是避免散戶在今日大漲 7~9% 的情況下追在短線末端，限縮在均線上方保護區內，兼顧防守與進攻。"
  };

  if (!geminiKeyExists || !conditionNum) {
    return res.json({ explanation: defaultExplanations[conditionNum] || "這是 XS 強勢股洗盤再起的核心濾網，能有效結合趨勢、洗盤、籌碼、爆量與風控五位一體的核心邏輯。" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `你是一個專業實戰的交易大師與 XQ XS 腳本專家。
使用者今天想要了解我們的「強勢股破月線量縮洗盤再起_完美版」 XS 腳本中的【條件 ${conditionNum}】:
${defaultExplanations[conditionNum]}

請更深度的分析這句條件在台股實務上的「籌碼心理學」：
1. 為什麼要這樣設計？這在洗盤（Shakeout）與吃貨中有什麼含意？
2. 主力是怎麼操作這個指標與價格關係的？
3. 進場後應該如何防守與停損？
請用專業、充滿實戰教學意味的繁體中文回答，維持在 200 字左右，可使用精美排版。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    res.json({ explanation: defaultExplanations[conditionNum] });
  }
});

// START EXPRESS + VITE INTERACTION LAYER
async function startServer() {
  // Vite server injection in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`XQ Radar Full-stack server running at http://localhost:${PORT}`);
  });
}

startServer();
