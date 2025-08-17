// getNoticiasController.js
import puppeteer from "puppeteer";
import { analizarNoticiasConIA } from './analizerController.js';
import 'dotenv/config';

export async function scrapeForexFactory() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Configuración del navegador
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  // 🔧 URL corregida: sin espacios extra
  await page.goto("https://www.forexfactory.com/calendar", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Esperar que cargue al menos una fila
  try {
    await page.waitForSelector(".calendar__row", { timeout: 10000 });
  } catch (err) {
    console.error("❌ No se cargó el calendario");
    await browser.close();
    return [];
  }

  // Extraer datos
  const news = await page.evaluate(() => {
    const rows = document.querySelectorAll(".calendar__row");
    console.log('papa', rows.length); // Para depurar

    const data = [];

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

      // Ignorar filas sin título o sin impacto
      if (!title || title === "No events" || !impactCell) return;

      // ✅ FILTRO: Solo noticias de EUR o USD
      if (currency !== "EUR" && currency !== "USD") return;

      // ✅ Determinar qué activos afecta
      const activos = [];
      if (currency === "EUR" || currency === "USD") {
        activos.push("EUR/USD");
      }
      if (currency === "USD") {
        // Asumimos que cualquier dato de USD puede afectar a NASDAQ y US30
        activos.push("NASDAQ");
        activos.push("US30");
      }

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

    // ✅ No filtramos por impacto aquí → lo hace la IA
    return data;
  });

  await browser.close();

  return news;
}

// ✅ Controlador: solo scrapea y pasa a IA
export async function getNoticias(req, res) {
  try {
    const news = await scrapeForexFactory();

    let analisis = "No hay noticias recientes de EUR o USD para analizar.";
    if (news.length > 0) {
      analisis = await analizarNoticiasConIA(news);
    }


    res.json({
      noticias: news,
      analisis: analisis
    });
  } catch (err) {
    console.error("❌ Error en getNoticias:", err.message);
    res.status(500).json({ 
      error: "Error interno del servidor",
      detalles: err.message 
    });
  }
}