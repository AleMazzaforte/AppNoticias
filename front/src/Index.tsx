import { useEffect, useState } from 'react';
import axios from 'axios';

// Interfaz actualizada con todos los campos
interface NewsItem {
  title: string;
  description: string;
  source: { name: string };
  sentimentScore?: number;
  currency: string;
  time: string;
  impact: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  activos: string[];
}

// Interfaz para el análisis
interface MarketAnalysis {
  analisisEURUSD: string;
  analisisNASDAQ: string;
  analisisUS30: string;
}

const urlGetNews = "http://localhost:5000/api/news";

function Index() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get<NewsItem[]>(urlGetNews)
      .then((res) => {
        const data = res.data;

        // Si no hay datos, salir
        if (!Array.isArray(data) || data.length === 0) {
          setNews([]);
          setAnalysis(null);
          setLoading(false);
          return;
        }

        setNews(data);
        const analisis = analizarMercado(data);
        setAnalysis(analisis);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar noticias:", err);
        setError("Error al cargar noticias");
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: "20px", textAlign: "center" }}>🔍 Cargando noticias...</p>;
  if (error) return <p style={{ padding: "20px", color: "red", textAlign: "center" }}>{error}</p>;
  if (news.length === 0) return <p style={{ padding: "20px", textAlign: "center" }}>📭 No hay noticias relevantes de alto o medio impacto.</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📰 Calendario Económico (EUR/USD, NASDAQ, US30)</h1>

      {/* === ANÁLISIS DEL MERCADO === */}
      {analysis && (
        <div style={styles.analysis}>
          <h2 style={styles.analysisTitle}>📊 Análisis del Mercado</h2>

          <div style={styles.analysisItem}>
            <h3 style={styles.assetTitle}>EUR/USD</h3>
            <p style={styles.analysisText} dangerouslySetInnerHTML={{ __html: analysis.analisisEURUSD }} />
          </div>

          <div style={styles.analysisItem}>
            <h3 style={styles.assetTitle}>NASDAQ</h3>
            <p style={styles.analysisText} dangerouslySetInnerHTML={{ __html: analysis.analisisNASDAQ }} />
          </div>

          <div style={styles.analysisItem}>
            <h3 style={styles.assetTitle}>US 30</h3>
            <p style={styles.analysisText} dangerouslySetInnerHTML={{ __html: analysis.analisisUS30 }} />
          </div>
        </div>
      )}

      {/* === LISTA DE NOTICIAS === */}
      {news.map((n, i) => (
        <div key={i} style={styles.card}>
          {/* Título */}
          <h3 style={styles.title}>{n.title}</h3>

          {/* Información básica */}
          <div style={styles.infoRow}>
            <span style={styles.tag}>{n.currency}</span>
            <span style={styles.time}>{n.time}</span>
            <ImpactBadge impact={n.impact} />
          </div>

          {/* Activos afectados */}
          <div style={styles.assets}>
            {n.activos.map((activo, idx) => (
              <span key={idx} style={styles.assetTag(activo)}>
                {activo}
              </span>
            ))}
          </div>

          {/* Datos macro */}
          <div style={styles.dataGrid}>
            <div style={styles.dataItem}>
              <label>Actual</label>
              <div style={styles.valueBox(n.actual, n.forecast)}>{n.actual || "—"}</div>
            </div>
            <div style={styles.dataItem}>
              <label>Forecast</label>
              <div style={styles.forecast}>{n.forecast || "—"}</div>
            </div>
            <div style={styles.dataItem}>
              <label>Previous</label>
              <div style={styles.previous}>{n.previous || "—"}</div>
            </div>
          </div>

          {/* Sentimiento */}
          {n.sentimentScore !== undefined && (
            <div style={styles.sentiment}>
              <strong>Sentimiento:</strong>{" "}
              <span style={styles.sentimentValue(n.sentimentScore)}>
                {n.sentimentScore > 0 ? "🟢 Positivo" : n.sentimentScore < 0 ? "🔴 Negativo" : "⚪ Neutro"} ({n.sentimentScore})
              </span>
            </div>
          )}

          {/* Fuente */}
          <small style={styles.source}>Fuente: {n.source?.name}</small>
        </div>
      ))}
    </div>
  );
}

// === ANÁLISIS DEL MERCADO (función en el frontend) ===
function analizarMercado(news: NewsItem[]) {
  let efectoUSD = 0;
  let efectoEUR = 0;

  news.forEach(n => {
    const actual = parseFloat(n.actual?.replace(/[^\d.-]/g, '') || "0");
    const forecast = parseFloat(n.forecast?.replace(/[^\d.-]/g, '') || "0");
    const diff = actual - forecast;
    const impactFactor = n.impact === "High" ? 2 : 1;

    if (n.currency === "USD") {
      if (diff > 0) efectoUSD += impactFactor;
      else if (diff < 0) efectoUSD -= impactFactor;
    }
    if (n.currency === "EUR") {
      if (diff > 0) efectoEUR += impactFactor;
      else if (diff < 0) efectoEUR -= impactFactor;
    }
  });

  // --- EUR/USD ---
  let analisisEURUSD;
  if (efectoEUR - efectoUSD > 0) {
    analisisEURUSD = "Se espera una **subida de EUR/USD** debido a datos fuertes en la zona euro y/o débiles en EE.UU.";
  } else if (efectoEUR - efectoUSD < 0) {
    analisisEURUSD = "Se espera una **bajada de EUR/USD** debido a datos fuertes en EE.UU. y/o débiles en la zona euro.";
  } else {
    analisisEURUSD = "No se espera un movimiento claro en EUR/USD. Los datos están equilibrados.";
  }

  // --- NASDAQ y US30 ---
  const datosFuertesUSD = news.filter(n => n.currency === "USD" && 
    (n.title.includes("CPI") || n.title.includes("PCE") || n.title.includes("Core PCE")) && 
    parseFloat(n.actual?.replace(/[^\d.-]/g, '') || "0") > parseFloat(n.forecast?.replace(/[^\d.-]/g, '') || "0")
  );

  const datosDebilesUSD = news.filter(n => n.currency === "USD" && 
    (n.title.includes("CPI") || n.title.includes("PCE") || n.title.includes("Core PCE")) && 
    parseFloat(n.actual?.replace(/[^\d.-]/g, '') || "0") < parseFloat(n.forecast?.replace(/[^\d.-]/g, '') || "0")
  );

  let analisisNASDAQ, analisisUS30;

  if (datosFuertesUSD.length > 0) {
    analisisNASDAQ = "Se espera una **bajada en NASDAQ** debido a datos inflacionarios fuertes, lo que aumenta las expectativas de tasas altas.";
    analisisUS30 = analisisNASDAQ;
  } else if (datosDebilesUSD.length > 0) {
    analisisNASDAQ = "Se espera una **subida en NASDAQ** debido a datos inflacionarios débiles, lo que sugiere posible recorte de tasas.";
    analisisUS30 = analisisNASDAQ;
  } else if (efectoUSD > 0) {
    analisisNASDAQ = "El USD se fortalece, lo que podría presionar a la baja a NASDAQ y US 30.";
    analisisUS30 = analisisNASDAQ;
  } else if (efectoUSD < 0) {
    analisisNASDAQ = "El USD se debilita, favoreciendo un entorno alcista para NASDAQ y US 30.";
    analisisUS30 = analisisNASDAQ;
  } else {
    analisisNASDAQ = "No se espera un movimiento claro en NASDAQ. El mercado está en espera.";
    analisisUS30 = "No se espera un movimiento claro en US 30. El mercado está en espera.";
  }

  return { analisisEURUSD, analisisNASDAQ, analisisUS30 };
}

// Componente para mostrar el impacto
function ImpactBadge({ impact }: { impact: string }) {
  const colors = {
    High: "#e53e3e",
    Medium: "#dd6b20",
    Low: "#38a169",
  };

  return (
    <span
      style={{
        backgroundColor: colors[impact as keyof typeof colors] || "#ccc",
        color: "white",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "0.8em",
        fontWeight: "bold",
      }}
    >
      {impact}
    </span>
  );
}

// Estilos
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Segoe UI, Arial, sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#f7f9fc",
    borderRadius: "10px",
  },
  header: {
    color: "#1a73e8",
    textAlign: "center" as const,
    marginBottom: "20px",
    fontSize: "1.8em",
  },
  analysis: {
    backgroundColor: "#e3f2fd",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "1px solid #bbdefb",
  },
  analysisTitle: {
    color: "#1565c0",
    marginBottom: "15px",
    fontSize: "1.4em",
  },
  analysisItem: {
    marginBottom: "12px",
  },
  assetTitle: {
    margin: "8px 0 4px 0",
    color: "#0d47a1",
    fontSize: "1.1em",
  },
  analysisText: {
    fontSize: "1em",
    lineHeight: "1.6",
    color: "#0d47a1",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    borderLeft: "4px solid #1a73e8",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "1.3em",
    color: "#2d3748",
  },
  infoRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap" as const,
  },
  tag: {
    backgroundColor: "#3182ce",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.85em",
    fontWeight: "bold",
  },
  time: {
    fontSize: "0.9em",
    color: "#4a5568",
  },
  assets: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap" as const,
  },
  assetTag: (activo: string) => ({
    backgroundColor:
      activo === "EUR/USD"
        ? "#4299e1"
        : activo === "NASDAQ"
        ? "#e53e3e"
        : "#805ad5",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.8em",
    fontWeight: "600",
  }),
  dataGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "12px",
    marginTop: "8px",
  },
  dataItem: {
    textAlign: "center" as const,
  },
  valueBox: (actual: string = "", forecast: string = "") => ({
    padding: "8px",
    backgroundColor:
      actual && forecast && actual.replace(/[^\d.-]/g, '') !== "" && forecast.replace(/[^\d.-]/g, '')
        ? parseFloat(actual.replace(/[^\d.-]/g, '')) > parseFloat(forecast.replace(/[^\d.-]/g, ''))
          ? "#c6f6d5" // Verde si mejor que forecast
          : "#fed7d7" // Rojo si peor
        : "#f7fafc",
    borderRadius: "6px",
    fontWeight: "bold",
    color: "#2d3748",
    fontSize: "1.1em",
  }),
  forecast: {
    padding: "6px",
    backgroundColor: "#ebf8ff",
    borderRadius: "6px",
    color: "#2b6cb0",
    fontSize: "0.95em",
  },
  previous: {
    padding: "6px",
    backgroundColor: "#f7fafc",
    borderRadius: "6px",
    color: "#718096",
    fontSize: "0.95em",
  },
  sentiment: {
    margin: "10px 0",
    fontSize: "0.95em",
  },
  sentimentValue: (score: number) => ({
    color: score > 0 ? "#38a169" : score < 0 ? "#e53e3e" : "#718096",
    fontWeight: "bold" as const,
  }),
  source: {
    color: "#718096",
    fontSize: "0.85em",
  },
};

export default Index;