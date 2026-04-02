import express from "express";
import authRequired from "../middleware/authRequired.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  try {
    if (role === "doctor") {
      const patients = await User.find({ role: "patient", assignedDoctorId: userId }).select(
        "_id email role assignedDoctorId"
      );
      if (patients.length) {
        return res.json({ success: true, data: patients });
      }
      const allPatients = await User.find({ role: "patient" }).select(
        "_id email role assignedDoctorId"
      );
      return res.json({ success: true, data: allPatients });
    }

    // patient: only themselves
    const me = await User.findById(userId).select("_id email role assignedDoctorId");
    return res.json({ success: true, data: me ? [me] : [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Doctor creates patient accounts (minimal registration; no email verification)
router.post("/register", authRequired, async (req, res) => {
  if (req.auth?.role !== "doctor") {
    return res.status(403).json({ success: false, error: "Doctor access required" });
  }

  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const patient = await User.create({
      email,
      passwordHash,
      role: "patient",
      assignedDoctorId: req.auth.userId,
    });

    return res.status(201).json({
      success: true,
      data: { id: patient._id.toString(), email: patient.email, role: patient.role },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

