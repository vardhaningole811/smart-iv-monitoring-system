import express from "express";
import authRequired from "../middleware/authRequired.js";
import Vitals from "../models/Vitals.js";
import User from "../models/User.js";
import { getLastInsight } from "../services/drugCurveService.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  try {
    if (role === "doctor") {
      // Patients assigned by this doctor (audit), fallback to all patients if none exist yet
      const patients = await User.find({ role: "patient", assignedDoctorId: userId }).select(
        "_id email role assignedDoctorId"
      );
      if (patients.length) {
        return res.json({ success: true, data: patients });
      }
      const allPatients = await User.find({ role: "patient" }).select("_id email role assignedDoctorId");
      return res.json({ success: true, data: allPatients });
    }

    // patient: only themselves
    const me = await User.findById(userId).select("_id email role assignedDoctorId");
    return res.json({ success: true, data: me ? [me] : [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id/latest", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  const patientId = req.params.id;
  try {
    if (role === "patient" && String(patientId) !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const latest = await Vitals.findOne({ patientId }).sort({ timestamp: -1 });
    return res.json({ success: true, data: latest });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id/history", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  const patientId = req.params.id;
  try {
    if (role === "patient" && String(patientId) !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(parsedLimit)
      ? 100
      : Math.max(1, Math.min(parsedLimit, 100));

    const history = await Vitals.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(limit);
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id/drug-impact", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  const patientId = req.params.id;
  try {
    if (role === "patient" && String(patientId) !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const insight = getLastInsight(patientId);
    return res.json({ success: true, data: insight });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

