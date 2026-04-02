import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import { setupSockets } from "./sockets/index.js";
import vitalsRoutes from "./routes/vitalsRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import analyzeFrameRoutes from "./routes/analyzeFrameRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientsRoutes from "./routes/patientsRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import nodeRoutes from "./routes/nodeRoutes.js";
import startMockNodeCollector from "./mock/startMockNodeCollector.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

setupSockets(server, app);

// FINAL CORS FIX (NO RESTRICTIONS - HACKATHON SAFE)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ROUTES
app.use("/api/vitals", vitalsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/analyze-frame", analyzeFrameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/patient", patientRoutes);

// HEALTH CHECK
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

// START SERVER
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });

    // Demo/test-only: generates mock data
    startMockNodeCollector(app.locals.io);
  })
  .catch((error) => {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  });