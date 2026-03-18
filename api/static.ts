import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // prefer built client at project root: ./dist/public
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to run the build script (npm run build)`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html for SPA routes
  app.get("/*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
