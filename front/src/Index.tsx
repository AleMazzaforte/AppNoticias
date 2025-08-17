import { useEffect, useState } from 'react';
import axios from 'axios';
import './estilos/estilos.css'; 


// === INTERFACES CORREGIDAS ===
interface NewsItem {
  title: string;
  description?: string; // Ahora opcional
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

// ✅ AHORA analisis es un string (texto de IA)
interface ApiResponse {
  noticias: NewsItem[];
  analisis: string; // Texto plano generado por IA
}

const urlGetNews = "http://localhost:5000/api/news";

function Index() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
  if (data) {
    console.log('Datos actualizados:', data);
  }
}, [data]); // Se ejecuta cada vez que `data` cambia

  useEffect(() => {
    setLoading(true);
    axios
      .get<ApiResponse>(urlGetNews)
      .then((res) => {
        // Validación básica
        if (Array.isArray(res.data.noticias)) {
          setData(res.data);
          
          
        } else {
          setError("Formato de datos incorrecto");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar noticias:", err);
        setError("Error al cargar noticias");
        setLoading(false);
      });
  }, []);

  if (loading) return <div> 
                        <h1 style={{ padding: "20px", textAlign: "center" }}>🔍 Cargando noticias...</h1>
                        <div className="spinner-container">
  <div className="spinner"></div>
</div>

                        
                      </div>;
  if (error) return <h1 style={{ padding: "20px", color: "red", textAlign: "center" }}>{error}</h1>;
  if (!data || data.noticias.length === 0) return <h1 style={{ padding: "20px", textAlign: "center" }}>📭 No hay noticias relevantes de alto o medio impacto.</h1>;

  const { noticias, analisis } = data;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📰 Calendario Económico (EUR/USD, NASDAQ, US30)</h1>

      {/* === ANÁLISIS DEL MERCADO (texto plano de IA) === */}
      {analisis && (
        <div style={styles.analysis}>
          <h2 style={styles.analysisTitle}>📊 Análisis del Mercado</h2>
          <p style={styles.analysisText} dangerouslySetInnerHTML={{ __html: analisis }} />
        </div>
      )}

      {/* === LISTA DE NOTICIAS === */}
      {noticias.map((n, i) => (
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

// === COMPONENTE: ImpactBadge ===
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

// === ESTILOS ===
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