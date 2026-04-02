import Vitals from "../models/Vitals.js";
import { emitVitalsNew } from "../sockets/index.js";
import * as alertService from "../services/alertService.js";

export async function createVitals(req) {
  // RBAC: patient can only create vitals for themselves
  const role = req.auth?.role;
  const authUserId = req.auth?.userId;

  const body = { ...req.body };
  if (role === "patient") {
    body.patientId = authUserId;
  }
  if (!body.patientId) {
    throw new Error("patientId is required");
  }

  const vitals = await Vitals.create(body);
  emitVitalsNew(req.app.locals.io, vitals);
  await alertService.evaluate(vitals, req.app.locals.io);
  return vitals;
}

export async function getLatestVitals(auth) {
  const query =
    auth?.role === "patient" ? { patientId: auth.userId } : {};

  const latest = await Vitals.findOne(query).sort({ timestamp: -1 });
  return latest;
}

export async function getVitalsHistory(auth, limitQuery) {
  const parsedLimit = Number.parseInt(limitQuery, 10);
  const limit = Number.isNaN(parsedLimit)
    ? 100
    : Math.max(1, Math.min(parsedLimit, 100));

  const query =
    auth?.role === "patient" ? { patientId: auth.userId } : {};

  const history = await Vitals.find(query).sort({ timestamp: -1 }).limit(limit);
  return history;
}
