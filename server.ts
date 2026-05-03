import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Prediction Route
  app.post("/api/predict-crowd", async (req, res) => {
    try {
      const { gateHistory, eventDetails } = req.body;
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        Given the following crowd history for a stadium gate and event details, predict the crowd level for the next 30 minutes.
        History: ${JSON.stringify(gateHistory)}
        Event: ${JSON.stringify(eventDetails)}
        
        Respond only with valid JSON containing:
        - "predictedLevel": "Low" | "Medium" | "High" | "Overcrowded"
        - "confidence": 0-100
        - "reasoning": short text
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown if present
      const jsonStr = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
