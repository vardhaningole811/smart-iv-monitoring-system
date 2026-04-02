import express from "express";
import authRequired from "../middleware/authRequired.js";
import DeviceNode from "../models/DeviceNode.js";
import User from "../models/User.js";

const router = express.Router();

function requireDoctor(req, res) {
  if (req.auth?.role !== "doctor") {
    res.status(403).json({ success: false, error: "Doctor access required" });
    return false;
  }
  return true;
}

router.get("/", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  try {
    if (role === "doctor") {
      const nodes = await DeviceNode.find().sort({ updatedAt: -1 });
      return res.json({ success: true, data: nodes });
    }

    // patient: only assigned nodes
    const nodes = await DeviceNode.find({ patientId: userId }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: nodes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/register", authRequired, async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const { nodeKey, host } = req.body || {};
  try {
    if (!nodeKey || !host) {
      return res.status(400).json({ success: false, error: "nodeKey and host are required" });
    }

    const node = await DeviceNode.create({
      nodeKey,
      host,
      assignedByDoctorId: req.auth.userId,
    });

    return res.status(201).json({ success: true, data: node });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/:nodeId/assign", authRequired, async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const { nodeId } = req.params;
  const { patientId } = req.body || {};

  try {
    if (!patientId) {
      return res.status(400).json({ success: false, error: "patientId is required" });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ success: false, error: "patientId must be a patient user" });
    }

    const node = await DeviceNode.findByIdAndUpdate(
      nodeId,
      {
        patientId,
        assignedByDoctorId: req.auth.userId,
      },
      { new: true }
    );

    // Store who assigned the patient (audit / UI convenience)
    await User.findByIdAndUpdate(patientId, { assignedDoctorId: req.auth.userId });

    return res.json({ success: true, data: node });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/:nodeId/assign", authRequired, async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const { nodeId } = req.params;

  try {
    const node = await DeviceNode.findByIdAndUpdate(
      nodeId,
      { patientId: null, assignedByDoctorId: req.auth.userId },
      { new: true }
    );
    return res.json({ success: true, data: node });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

