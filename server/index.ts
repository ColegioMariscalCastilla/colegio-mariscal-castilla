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
    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV !== "production") {
      // In dev, use Vite middleware so backend serves the real frontend
      try {
        await setupVite(httpServer, app);
        // Vite middleware enabled in development mode
      } catch (e) {
        console.warn("Could not start Vite middleware, ensure vite is installed:", e);
      }
    } else {
      // In production serve the built client
      serveStatic(app);
    }

    httpServer.listen(3000, () => {
      // Server started on port 3000
    });
  } catch (err) {
    console.error("Error iniciando servidor:", err);
    process.exit(1);
  }
})();