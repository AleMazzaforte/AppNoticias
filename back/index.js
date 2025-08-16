import express from "express";
import cors from "cors";
import router from "./rutas.js";

const app = express();

app.use(cors());
app.use(router);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
