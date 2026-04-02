import Event from "../models/Event.js";
import * as drugCurveService from "../services/drugCurveService.js";
import { emitInsightUpdate } from "../sockets/index.js";

export async function createEvent(data) {
  const event = await Event.create(data);
  return event;
}

export function scheduleDrugCurveCompute(event, io) {
  if (!event || event.type !== "iv_start" || !io) return;
  setImmediate(() => {
    drugCurveService
      .compute(event.timestamp, event.patientId)
      .then((result) => {
        if (result) emitInsightUpdate(io, result);
      })
      .catch((err) => console.error("drugCurveService.compute:", err));
  });
}
