import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initialMfoBrands } from "./src/data/mfoData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side state for MFO Brands and redirect configuration
let currentMfoBrands = [...initialMfoBrands];

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vitovladimirov27";

function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Требуется авторизация." });
    return;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: "Неверный пароль администратора." });
  }
}

// API: Verify password
app.post("/api/verify-password", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Неверный пароль администратора." });
  }
});

// Server-side state for Partner Link customization and Tracker records
// We seed this with realistic statistical history to make analytics graphs gorgeous
let mfoPartnerLinks: Record<string, string> = {
  zaimer: "https://partner.zaimer.ru/click?offer_id=1&aff_id=100",
  ekapusta: "https://ekapusta.com/click?aff=200",
  moneyman: "https://moneyman.ru/leads?ref=300",
  webzaim: "https://web-zaim.ru/track?click_id=400",
  lime: "https://lime-zaim.ru?aff_id=500",
  dobrozaim: "https://dobrozaim.ru/partner?click=600",
  bystrodengi: "https://bystrodengi.ru/?ref=700",
  turbozaim: "https://turbozaim.ru/?aff=800",
};

// Seed initial conversion logs
let clicksLog = [
  { id: "1001", brandId: "zaimer", brandName: "Займер", timestamp: "2026-06-12T14:24:00Z", subId: "seo_block", converted: true, commission: 1500 },
  { id: "1002", brandId: "ekapusta", brandName: "еКапуста", timestamp: "2026-06-12T15:10:00Z", subId: "calc_0", converted: true, commission: 1200 },
  { id: "1003", brandId: "moneyman", brandName: "MoneyMan", timestamp: "2026-06-12T19:45:00Z", subId: "banner_top", converted: false, commission: 1800 },
  { id: "1004", brandId: "zaimer", brandName: "Займер", timestamp: "2026-06-13T09:12:00Z", subId: "calc_0", converted: false, commission: 1500 },
  { id: "1005", brandId: "lime", brandName: "Лайм-Займ", timestamp: "2026-06-13T10:30:00Z", subId: "seo_block", converted: true, commission: 1600 },
  { id: "1006", brandId: "dobrozaim", brandName: "Доброзайм", timestamp: "2026-06-13T11:05:00Z", subId: "long_term", converted: true, commission: 2500 },
  { id: "1007", brandId: "ekapusta", brandName: "еКапуста", timestamp: "2026-06-13T14:20:00Z", subId: "calc_0", converted: false, commission: 1200 },
  { id: "1008", brandId: "turbozaim", brandName: "Турбозайм", timestamp: "2026-06-13T16:50:00Z", subId: "card_btn", converted: false, commission: 1400 },
];

const COMMISSION_RATES: Record<string, number> = {
  zaimer: 1500,
  ekapusta: 1200,
  moneyman: 1800,
  webzaim: 1300,
  lime: 1600,
  dobrozaim: 2500,
  bystrodengi: 1400,
  turbozaim: 1400,
};

const BRAND_NAMES: Record<string, string> = {
  zaimer: "Займер",
  ekapusta: "еКапуста",
  moneyman: "MoneyMan",
  webzaim: "Веб-займ",
  lime: "Лайм-Займ",
  dobrozaim: "Доброзайм",
  bystrodengi: "Быстроденьги",
  turbozaim: "Турбозайм",
};

// API: Setup partner redirect tracker (302 Redirect)
app.get("/api/redirect", (req, res) => {
  const brandId = (req.query.brandId as string) || "zaimer";
  const subId = (req.query.subId as string) || "direct";
  
  const foundBrand = currentMfoBrands.find((m) => m.id === brandId);
  const targetUrl = foundBrand ? foundBrand.partnerUrl : (mfoPartnerLinks[brandId] || "https://google.ru");
  const brandName = foundBrand ? foundBrand.name : (BRAND_NAMES[brandId] || brandId);
  const commission = COMMISSION_RATES[brandId] || 1500;
  
  // Register click log
  const newClick = {
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    brandId,
    brandName,
    timestamp: new Date().toISOString(),
    subId,
    converted: false,
    commission,
  };
  
  clicksLog.unshift(newClick); // Add to beginning
  
  // Optional: Append subID to partner URL to forward to actual affiliate platform
  let finalUrl = targetUrl;
  try {
    const parsedUrl = new URL(targetUrl);
    parsedUrl.searchParams.set("subid", subId);
    parsedUrl.searchParams.set("clickid", newClick.id);
    finalUrl = parsedUrl.toString();
  } catch (err) {
    // Falls back to direct string append if targetUrl is not a fully qualified URL
    if (finalUrl.includes("?")) {
      finalUrl += `&subid=${encodeURIComponent(subId)}&clickid=${newClick.id}`;
    } else {
      finalUrl += `?subid=${encodeURIComponent(subId)}&clickid=${newClick.id}`;
    }
  }
  
  // 302 Redirect to affiliate path!
  res.redirect(finalUrl);
});

// API: Get analytics / config state
app.get("/api/stats", (req, res) => {
  res.json({
    logs: clicksLog,
    affiliateLinks: mfoPartnerLinks,
    mfoBrands: currentMfoBrands,
  });
});

// API: Update partner link dynamically (from Admin UI)
app.post("/api/update-partner", checkAuth, (req, res) => {
  const { brandId, newUrl } = req.body;
  if (!brandId || !newUrl) {
    res.status(400).json({ error: "Missing brandId or newUrl" });
    return;
  }
  mfoPartnerLinks[brandId] = newUrl;
  
  // Sync in core brand configuration as well
  const found = currentMfoBrands.find(m => m.id === brandId);
  if (found) {
    found.partnerUrl = newUrl;
  }
  
  res.json({ success: true, updatedConfig: mfoPartnerLinks });
});

// API: Update MFO list element
app.post("/api/update-mfo", checkAuth, (req, res) => {
  const { updatedMfo } = req.body;
  if (!updatedMfo || !updatedMfo.id) {
    res.status(400).json({ error: "Missing updatedMfo data or id" });
    return;
  }
  
  const index = currentMfoBrands.findIndex((m) => m.id === updatedMfo.id);
  if (index !== -1) {
    // Merge new values
    currentMfoBrands[index] = {
      ...currentMfoBrands[index],
      ...updatedMfo,
    };
    res.json({ success: true, mfoBrands: currentMfoBrands });
  } else {
    res.status(404).json({ error: "MFO Brand not found in repository." });
  }
});

// API: Add MFO list element dynamically (Admin only)
app.post("/api/add-mfo", checkAuth, (req, res) => {
  const { newMfo } = req.body;
  if (!newMfo || !newMfo.id) {
    res.status(400).json({ error: "Missing newMfo data or id" });
    return;
  }
  
  const exists = currentMfoBrands.some((m) => m.id === newMfo.id);
  if (exists) {
    res.status(400).json({ error: "МФО с таким ID уже существует." });
    return;
  }
  
  currentMfoBrands.push(newMfo);
  mfoPartnerLinks[newMfo.id] = newMfo.partnerUrl;
  res.json({ success: true, mfoBrands: currentMfoBrands });
});

// API: Delete MFO list element dynamically (Admin only)
app.post("/api/delete-mfo", checkAuth, (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  
  currentMfoBrands = currentMfoBrands.filter((m) => m.id !== id);
  delete mfoPartnerLinks[id];
  res.json({ success: true, mfoBrands: currentMfoBrands });
});

// API: Webmaster Conversion Simulator (simulates approval event on a prior click)
app.post("/api/convert", (req, res) => {
  const { clickId } = req.body;
  const click = clicksLog.find((c) => c.id === clickId);
  
  if (!click) {
    res.status(404).json({ error: "Click ID not found in tracker records." });
    return;
  }
  
  if (click.converted) {
    res.status(400).json({ error: "This click is already converted." });
    return;
  }
  
  click.converted = true;
  res.json({ success: true, updatedClick: click });
});

// Lazy-initialize Gemini Client
let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return geminiClient;
}

// API: Smart SEO Article Generator (uses server-side Gemini 3.5-flash)
app.post("/api/generate-seo", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) {
    res.status(400).json({ error: "Keyword is required." });
    return;
  }

  const client = getGeminiClient();
  if (!client) {
    // Handle missing API key gracefully to prevent crashes
    // We return a beautifully formatted placeholder SEO Text written by local generator
    res.json({
      success: true,
      isMock: true,
      title: `Купить или оформить займ по ключевому слову "${keyword}"`,
      h1: `Онлайн-займы по всей России: ${keyword}`,
      metaDescription: `Актуальные предложения микрозаймов по ключевому слову "${keyword}". Моментальное одобрение до 99% заявок, перевод на карту за 2 минуты.`,
      seoText: `
        <h2>Оформление займов по условиям "${keyword}" в России</h2>
        <p>Для заемщиков, которых интересует <strong>"${keyword}"</strong>, мы подобрали эксклюзивные предложения от надежных микрофинансовых организаций РФ, сертифицированных Центробанком.</p>
        <p>Онлайн-сервисы предлагают лояльные кредитные ставки (от 0% в день при первом обращении), гибкие сроки возврата и быстрое заполнение по паспорту. Наш реестр обновляется в режиме реального времени, обеспечивая высокий рейтинг надежности.</p>
        <h3>Почему выбирают займы по запросу "${keyword}":</h3>
        <ul>
          <li>Мгновенный перевод денежных средств по номеру телефона (через удобный интерфейс СБП).</li>
          <li>Минимальный пакет документации без справок о доходах и залогового обеспечения.</li>
          <li>Автоматическое рассмотрение скоринговой системой круглосуточно.</li>
        </ul>
        <p><em>Обратите внимание: Для того чтобы воспользоваться реальными возможностями ИИ для создания уникальной разметки, подключите ваш API-ключ Gemini во вкладке Secrets.</em></p>
      `,
      faqs: [
        {
          q: `Как получить займ с гарантией по теме "${keyword}"?`,
          a: `Подайте одновременно заявки в 2-3 компании из нашего списка. Это повысит вероятность одобрения до рекордных 99%.`
        },
        {
          q: `Каковы требования к заемщикам при запросе "${keyword}"?`,
          a: `Основные условия: совершеннолетний возраст (18+), гражданство Российской Федерации и наличие действующего паспорта.`
        }
      ]
    });
    return;
  }

  try {
    const prompt = `
      Ты — опытный SEO специалист и маркетолог в сфере финансов и микрозаймов (MFI/MFO) в РФ.
      Напиши оптимизированный SEO сегмент для витрины займов по поисковому запросу: "${keyword}".
      Ответ должен быть строго в формате JSON со следующими полями (используй правильный русский язык):
      - title: Заголовок страницы (Meta Title до 70-80 символов)
      - metaDescription: Meta Description до 160-180 символов с призывом к действию
      - h1: Оптимизированный заголовок H1
      - seoText: Статья из 3-4 содержательных абзацев на 1500–2000 символов с HTML тегами <h2>, <p>, <ul>, <li>, <strong>, <em>. Не используй 💥 или другие вычурные смайлики. Сделай текст солидным и продающим экспертным мнением. Write real text, do not truncate.
      - faqs: Массив из 2 часто задаваемых вопросов и ответов (каждый FAQ объект содержит поля "q" и "a").

      Верни СТРОГО валидный JSON, не оборачивай его в markdown блоки вроде \`\`\`json. Только чистый JSON текст.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "";
    const parsedData = JSON.parse(resultText.trim());
    res.json({
      success: true,
      isMock: false,
      ...parsedData,
    });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Failed to generate SEO text. " + error.message });
  }
});

// Vite middleware setup
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Bind to 0.0.0.0:3000
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on port ${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}
