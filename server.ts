import express from "express";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // Database setup
  const db = new Database("sgis.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birthDate TEXT NOT NULL,
      age INTEGER NOT NULL,
      neighborhood TEXT NOT NULL,
      locality TEXT NOT NULL,
      hasDisability BOOLEAN NOT NULL,
      disabilityType TEXT,
      situation TEXT NOT NULL,
      socialHistory TEXT,
      employmentStatus TEXT NOT NULL,
      helpNeeded TEXT NOT NULL,
      referral TEXT NOT NULL,
      agentId TEXT NOT NULL,
      stationId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Vite middleware for development (MUST be first)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: 24678 }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // JSON parser middleware (only for API routes)
  app.use(express.json());

  // API Routes
  app.get("/api/records", (req, res) => {
    const records = db.prepare("SELECT * FROM records ORDER BY timestamp DESC").all();
    const mappedRecords = records.map((r: any) => ({
      ...r,
      hasDisability: r.hasDisability === 1
    }));
    res.json(mappedRecords);
  });

  app.post("/api/records", (req, res) => {
    const {
      name, birthDate, age, neighborhood, locality,
      hasDisability, disabilityType, situation, socialHistory,
      employmentStatus, helpNeeded, referral, agentId, stationId
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO records (
        name, birthDate, age, neighborhood, locality,
        hasDisability, disabilityType, situation, socialHistory,
        employmentStatus, helpNeeded, referral, agentId, stationId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, birthDate, age, neighborhood, locality,
      hasDisability ? 1 : 0, disabilityType, situation, socialHistory,
      employmentStatus, helpNeeded, referral, agentId, stationId
    );

    const newRecord = db.prepare("SELECT * FROM records WHERE id = ?").get(result.lastInsertRowid) as any;
    const mappedRecord = {
      ...newRecord,
      hasDisability: newRecord.hasDisability === 1
    };
    
    // Emit to all connected clients
    io.emit("record:added", mappedRecord);
    
    res.status(201).json(mappedRecord);
  });

  // Production static files
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
