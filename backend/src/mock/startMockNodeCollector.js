import DeviceNode from "../../src/models/DeviceNode.js";
import Vitals from "../../src/models/Vitals.js";
import Event from "../../src/models/Event.js";
import * as alertService from "../../src/services/alertService.js";
import { emitVitalsNew } from "../../src/sockets/index.js";
import { scheduleDrugCurveCompute } from "../../src/controllers/eventController.js";

const HEART_RATE_BASE = 80;
const SPO2_BASE = 97;

const ivStateByNode = new Map();

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function mockVitalsForPatient() {
  const heartRate = Math.round(randBetween(60, 110));
  const spo2 = Math.round(randBetween(88, 100));
  return { heartRate, spo2 };
}

export default function startMockNodeCollector(io) {
  if (process.env.MOCK_NODE_INGESTION !== "true") return;
  if (!io) return;

  const tickMs = Number(process.env.MOCK_NODE_TICK_MS || 5000);

  setInterval(async () => {
    const nodes = await DeviceNode.find({ patientId: { $ne: null } }).lean();

    for (const node of nodes) {
      const { heartRate, spo2 } = mockVitalsForPatient();

      // Simple IV state machine for demo only
      const prev = ivStateByNode.get(String(node._id)) || "running";
      const next = Math.random() < 0.08 ? (prev === "running" ? "stopped" : "running") : prev;
      ivStateByNode.set(String(node._id), next);

      const vitals = await Vitals.create({
        heartRate,
        spo2,
        ivStatus: next,
        patientId: node.patientId,
        nodeId: node._id,
        timestamp: new Date(),
      });

      emitVitalsNew(io, vitals);
      await alertService.evaluate(vitals, io);

      if (next === "running" && prev === "stopped") {
        const event = await Event.create({
          type: "iv_start",
          patientId: node.patientId,
          nodeId: node._id,
          timestamp: new Date(),
          metadata: { mock: true },
        });
        scheduleDrugCurveCompute(event, io);
      }
      if (next === "stopped" && prev === "running") {
        await Event.create({
          type: "iv_stop",
          patientId: node.patientId,
          nodeId: node._id,
          timestamp: new Date(),
          metadata: { mock: true },
        });
      }
    }
  }, tickMs);
}

