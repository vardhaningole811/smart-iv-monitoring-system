import Alert from "../models/Alert.js";
import { emitAlertNew } from "../sockets/index.js";

export async function createAlert(req) {
  const role = req.auth?.role;
  const authUserId = req.auth?.userId;

  const body = { ...req.body };
  if (role === "patient") {
    body.patientId = authUserId;
  }
  if (!body.patientId) {
    throw new Error("patientId is required");
  }

  const alert = await Alert.create(body);
  emitAlertNew(req.app.locals.io, alert);
  return alert;
}

export async function listAlerts(auth) {
  const query = auth?.role === "patient" ? { patientId: auth.userId } : {};
  const alerts = await Alert.find(query).sort({ timestamp: -1 });
  return alerts;
}
