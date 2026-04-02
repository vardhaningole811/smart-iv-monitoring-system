import { Server } from "socket.io";
import jwt from "jsonwebtoken";

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

export function setupSockets(httpServer, app) {
  const corsOrigins = (process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  app.locals.io = io;

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next();

    try {
      const payload = jwt.verify(token, jwtSecret());
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch (_err) {
      // If token is invalid, keep socket unauthenticated.
    }
    return next();
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "patient" && socket.data.userId) {
      socket.join(`patient:${socket.data.userId}`);
    }
    if (socket.data.role === "doctor") {
      socket.join("role:doctor");
    }
  });

  return io;
}

export function emitVitalsNew(io, vitals) {
  if (!io) return;
  const patientId = vitals?.patientId;
  if (patientId) io.to(`patient:${patientId}`).emit("vitals:new", vitals);
  io.to("role:doctor").emit("vitals:new", vitals);
}

export function emitAlertNew(io, alert) {
  if (!io) return;
  const patientId = alert?.patientId;
  if (patientId) io.to(`patient:${patientId}`).emit("alert:new", alert);
  io.to("role:doctor").emit("alert:new", alert);
}

export function emitInsightUpdate(io, payload) {
  if (!io) return;
  const patientId = payload?.patientId;
  if (patientId) io.to(`patient:${patientId}`).emit("insight:update", payload);
  io.to("role:doctor").emit("insight:update", payload);
}

export function emitVisionUpdate(io, payload) {
  if (!io) return;
  const patientId = payload?.patientId;
  if (patientId) io.to(`patient:${patientId}`).emit("vision:update", payload);
  io.to("role:doctor").emit("vision:update", payload);
}
