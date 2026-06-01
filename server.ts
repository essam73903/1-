import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Initialize Gemini client on the server as mandated by the SDK guidelines
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API endpoint for fetching grounded Ministry of Labor news
  app.post("/api/saudi-labor-news", async (req, res) => {
    try {
      const ai = getGeminiClient();
      
      // Using basic text model gemini-3.5-flash which is ideal and supports Search Grounding
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "ما هي أحدث القرارات والتحديثات التنظيمية الرسمية الصادرة عن وزارة الموارد البشرية والتنمية الاجتماعية السعودية ومنصة قوى ومنصة مساند فيما يتعلق بالتأشيرات، الاستقدام، رخص العمل، والعمالة المنزلية والمهنية لعام 2026؟ لخص أهم 3 قرارات بأسلوب نقاط واضحة واحترافية للغاية باللغة العربية مع تفاصيل ملموسة ونسب وتواريخ دقيقة.",
        config: {
          systemInstruction: "أنت مستشار قانوني خبير في أنظمة العمل والعمال واللوائح الحكومية السعودية. قدم ملخصاً عالي الجودة وموثقاً. ركز على التحديثات الصادرة بشكل موضوعي وبصيغة نقاط جذابة ومرتبة مع تقليل المقدمات والإنشاء الطويل.",
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "لا توجد تحديثات متاحة حالياً.";
      
      // Extract Google Search grounding sources to display in the UI as clickable citations
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => {
          if (chunk?.web?.uri) {
            return {
              title: chunk.web.title || "بوابة وزارة الموارد البشرية والتنمية الاجتماعية (MHRSD)",
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Filter duplicate source URLs
      const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.uri, s])).values());

      res.json({
        newsContent: text,
        sources: uniqueSources,
      });
    } catch (error: any) {
      console.error("Error generating grounded labor news:", error);
      res.status(500).json({ error: error.message || "فشل جلب وتأصيل المستجدات العمالية من محرك البحث" });
    }
  });

  // Vite integration in development or static directory mapping in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
