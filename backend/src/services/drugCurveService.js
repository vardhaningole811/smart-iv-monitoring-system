import Vitals from "../models/Vitals.js";

const lastByPatientId = new Map();

export function getLastInsight(patientId) {
  if (!patientId) return null;
  return lastByPatientId.get(String(patientId)) || null;
}

function toDate(t) {
  if (!t) return null;
  const d = t instanceof Date ? t : new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function avg(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function distTo75(hr) {
  return Math.abs(hr - 75);
}

const NO_RESPONSE_INSIGHT =
  "No measurable response to IV administration detected within the observation window.";

/**
 * Deterministic plain-language insight from a drug-curve result (output of compute()).
 * Never returns undefined.
 */
export function generateInsight(curveResult) {
  if (!curveResult || typeof curveResult !== "object") {
    return NO_RESPONSE_INSIGHT;
  }

  const xRaw = curveResult.responseDelayMins;
  const yRaw = curveResult.stabilizationMins;

  if (xRaw == null || Number.isNaN(Number(xRaw))) {
    return NO_RESPONSE_INSIGHT;
  }

  const x = Number(xRaw).toFixed(1);

  if (yRaw == null || Number.isNaN(Number(yRaw))) {
    return `Response detected at ${x} minutes. Stabilisation not achieved within the 30-minute observation window.`;
  }

  const yNum = Number(yRaw);
  const y = yNum.toFixed(1);

  if (yNum < 20) {
    return `Patient responded within ${x} minutes. Vitals stabilised at ${y} minutes after IV start.`;
  }

  return `Patient showed initial response at ${x} minutes but required extended time to stabilise (${y} minutes).`;
}

export async function compute(ivStartTime, patientId) {
  const start = toDate(ivStartTime);
  if (!start || !patientId) return null;

  const ms10 = 10 * 60 * 1000;
  const ms30 = 30 * 60 * 1000;
  const preWindowStart = new Date(start.getTime() - ms10);

  const preRaw = await Vitals.find({
    patientId,
    timestamp: { $gte: preWindowStart, $lt: start },
  })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  let baseline = null;
  if (preRaw.length > 0) {
    baseline = {
      heartRate: avg(preRaw.map((v) => v.heartRate)),
      spo2: avg(preRaw.map((v) => v.spo2)),
    };
  }

  const postEnd = new Date(start.getTime() + ms30);
  const post = await Vitals.find({
    patientId,
    timestamp: { $gt: start, $lte: postEnd },
  })
    .sort({ timestamp: 1 })
    .lean();

  const vitalsTimeline = post.map((v) => ({
    ...v,
    timestamp: v.timestamp instanceof Date ? v.timestamp : new Date(v.timestamp),
  }));

  let responseDelayMins = null;
  if (baseline && post.length > 0) {
    const bHr = baseline.heartRate;
    const bSpo2 = baseline.spo2;
    const d0 = distTo75(bHr);

    for (const v of post) {
      const ts = v.timestamp instanceof Date ? v.timestamp : new Date(v.timestamp);
      const spo2Ok = v.spo2 >= bSpo2 + 2;
      const d1 = distTo75(v.heartRate);
      const hrCloser = d0 - d1 >= 5;
      if (spo2Ok || hrCloser) {
        responseDelayMins = (ts.getTime() - start.getTime()) / 60000;
        break;
      }
    }
  }

  let improvement = null;
  if (baseline && post.length > 0) {
    const mHr = avg(post.map((v) => v.heartRate));
    const mSpo2 = avg(post.map((v) => v.spo2));
    improvement = {
      heartRate: mHr - baseline.heartRate,
      spo2: mSpo2 - baseline.spo2,
    };
  }

  let stabilizationMins = null;
  if (post.length >= 5) {
    for (let i = 0; i <= post.length - 5; i++) {
      const slice = post.slice(i, i + 5);
      const ok = slice.every(
        (v) => v.spo2 > 93 && v.heartRate >= 55 && v.heartRate <= 100
      );
      if (ok) {
        const t0 = slice[0].timestamp;
        const ts = t0 instanceof Date ? t0 : new Date(t0);
        stabilizationMins = (ts.getTime() - start.getTime()) / 60000;
        break;
      }
    }
  }

  const result = {
    ivStartTime: start.toISOString(),
    patientId: String(patientId),
    baseline,
    responseDelayMins,
    improvement,
    stabilizationMins,
    vitalsTimeline,
  };
  result.insight = generateInsight(result);
  lastByPatientId.set(String(patientId), result);
  return result;
}
