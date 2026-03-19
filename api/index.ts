import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStatic } from "./static";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

(async () => {
  try {
    console.log("🔄 Starting server initialization...");
    await registerRoutes(httpServer, app);
    console.log("✅ Routes registered successfully");

    if (process.env.NODE_ENV !== "production") {
      // In dev, use Vite middleware so backend serves the real frontend
      try {
        console.log("🔄 Setting up Vite middleware...");
        await setupVite(httpServer, app);
        console.log("✅ Vite middleware enabled in development mode");
      } catch (e) {
        console.warn("Could not start Vite middleware, ensure vite is installed:", e);
      }
    } else {
      // In production serve the built client
      serveStatic(app);
    }

    console.log("🔄 Starting HTTP server...");
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log("📡 API endpoints available:");
      console.log("   - POST /api/login");
      console.log("   - GET  /api/dashboard/stats");
      console.log("   - GET  /api/attendance");
      console.log("   - POST /api/attendance/batch");
    });
  } catch (err) {
    console.error("❌ Error iniciando servidor:", err);
    if (err instanceof Error) {
      console.error("Stack trace:", err.stack);
    }
    process.exit(1);
  }
})();