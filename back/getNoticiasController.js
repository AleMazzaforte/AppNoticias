import puppeteer from "puppeteer";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

export async function scrapeForexFactory() {
  const browser = await puppeteer.launch({ headless: true }); 
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

 

  await page.goto("https://www.forexfactory.com/calendar", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Esperar que cargue al menos una fila
  try {
    await page.waitForSelector(".calendar__row", { timeout: 10000 });
  } catch (err) {
    console.error("No se cargó el calendario");
    await browser.close();
    return [];
  }

  const news = await page.evaluate(() => {
  const rows = document.querySelectorAll(".calendar__row");
  console.log('papa', rows.length);

  const data = [];

  // Función para detectar impacto
  const getImpact = (impactCell) => {
    const span = impactCell?.querySelector("span");
    const title = span?.getAttribute("title") || "";
    if (title.includes("High")) return "High";
    if (title.includes("Med")) return "Medium";
    if (title.includes("Low")) return "Low";
    return "Low";
  };

  rows.forEach((row) => {
    const titleEl = row.querySelector(".calendar__event-title");
    const timeEl = row.querySelector(".calendar__time");
    const impactCell = row.querySelector(".calendar__impact");
    const descEl = row.querySelector(".calendar__event");
    const currencyEl = row.querySelector(".calendar__cell.calendar__currency span");

    // ✅ Selectores CORRECTOS para Actual, Forecast, Previous
    const actualEl = row.querySelector(".calendar__cell.calendar__actual");
    const forecastEl = row.querySelector(".calendar__cell.calendar__forecast");
    const previousEl = row.querySelector(".calendar__cell.calendar__previous");

    const title = titleEl?.textContent?.trim() || "";
    const time = timeEl?.textContent?.trim() || "";
    const description = descEl?.textContent?.trim() || "";
    const currency = currencyEl?.textContent?.trim() || "N/A";
    const actual = actualEl?.textContent?.trim() || ""; 
    const forecast = forecastEl?.textContent?.trim() || ""; 
    const previous = previousEl?.textContent?.trim() || ""; 
    const impact = getImpact(impactCell);

    // 🚫 Ignorar filas sin título o sin impacto
    if (!title || title === "No events" || !impactCell) return;

    // ✅ FILTRO: ¿Afecta a EUR/USD, NASDAQ o US30?
    const afectaEURUSD = currency === "EUR" || currency === "USD";
    const afectaIndicesUS = currency === "USD";

    // Palabras clave que afectan a NASDAQ o US30
    const keywords = [
      "CPI", "PCE", "GDP", "PCE", "Core PCE", "Unemployment", "NFP",
      "Payrolls", "Fed", "FOMC", "Consumer Confidence", "Retail Sales",
      "Durable Goods", "Housing", "HPI", "Existing Home Sales", "New Home Sales",
      "CB Consumer Confidence", "Personal Income", "Personal Spending"
    ];

    const esRelevanteParaIndices = keywords.some(kw => title.includes(kw));

    const afectaNASDAQ = afectaIndicesUS && esRelevanteParaIndices;
    const afectaUS30 = afectaIndicesUS && esRelevanteParaIndices;

    // Si no afecta a ninguno, ignorar
    if (!afectaEURUSD && !afectaNASDAQ && !afectaUS30) return;

    // Determinar qué activos afecta
    const activos = [];
    if (afectaEURUSD) activos.push("EUR/USD");
    if (afectaNASDAQ) activos.push("NASDAQ");
    if (afectaUS30) activos.push("US30");

    data.push({
      title,
      time,
      currency,
      impact,
      description,
      actual,       
      forecast,     
      previous,     
      activos,
    });
  });

  // ✅ Filtrar solo impacto Alto y Medio
  return data.filter(item => item.impact === "High" || item.impact === "Medium");
});
  

  await browser.close();

  // Análisis de sentimiento
  return news.map((item) => {
    const score = sentiment.analyze(item.title + " " + item.description).score;
    return {
      ...item,
      sentimentScore: score,
      source: { name: "Forex Factory" },
    };
  });
}

// Controlador para endpoint
export async function getNoticias(req, res) {
  try {
    const news = await scrapeForexFactory();
    res.json(news);
  } catch (err) {
    console.error("Error scraping con Puppeteer:", err.message);
    res.status(500).json({ error: "Error al obtener noticias" });
  }
}