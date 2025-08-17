// analizerController.js
import { InferenceClient } from "@huggingface/inference";

import dotenv  from 'dotenv';

dotenv.config();

// 🔑 Reemplaza con tu API Key de Hugging Face
const HUGGINGFACE_API_KEY = process.env.apiKey;


const client = new InferenceClient(HUGGINGFACE_API_KEY,)


/**
 * Analiza el impacto de las noticias en EUR/USD, NASDAQ y US30
 * @param {Array} news - Array de noticias scrapeadas
 * @returns {Promise<string>} - Análisis generado por IA
 */
export async function analizarNoticiasConIA(news) {
    if (!HUGGINGFACE_API_KEY) {
    return "Análisis no disponible: Falta API Key de Hugging Face.";
  }
  if (!Array.isArray(news) || news.length === 0) {
    return "No hay noticias relevantes para analizar.";
  }
  
  const prompt = `
  responde en español
Eres un analista financiero experto en mercados forex y bursátiles.
Analiza si las siguentes noticias impulsan al alza o a la baja los siguientes activos:

- **EUR/USD**: Considera datos de EE.UU. (USD) y Zona Euro (EUR)
- **NASDAQ**: Sensible a tasas de EE.UU., inflación y confianza
- **US 30 (Dow Jones)**: Afectado por datos macro de EE.UU.

Solo dime la direccion.
Responde en español.

### Noticias Recientes:
${news.map(n => `
- [${n.currency}] ${n.title}
  • Hora: ${n.time}
  • Impacto: ${n.impact}
  • Actual: ${n.actual || '—'}, Forecast: ${n.forecast || '—'}, Previous: ${n.previous || '—'}
`).join('\n')}

### Análisis por activo:
`;

  try {
    const chatCompletion = await client.chatCompletion({
      
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = chatCompletion.choices[0]?.message?.content || "Análisis no disponible.";

    // Extrae solo el análisis si hay texto antes
    return response.split("### Análisis por activo:")[1]?.trim() || response.trim();
  } catch (error) {
    console.error("Error al analizar con IA:", error.message);
    return "No se pudo generar el análisis. Error de conexión con IA.";
  }
}