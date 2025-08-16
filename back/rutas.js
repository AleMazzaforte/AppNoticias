import express from "express";
import { getNoticias } from "./getNoticiasController.js";

const router = express.Router();

router.get("/api/news", getNoticias);

export default router;
