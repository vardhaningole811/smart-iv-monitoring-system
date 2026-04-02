import express from "express";
import { getLastInsight } from "../services/drugCurveService.js";
import authRequired from "../middleware/authRequired.js";

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  const { role, userId } = req.auth;

  if (role === "patient") {
    return res.json({ success: true, data: getLastInsight(userId) });
  }

  // doctor: must specify patientId
  const patientId = req.query.patientId;
  if (!patientId) {
    return res.status(400).json({
      success: false,
      error: "patientId query param is required for doctors",
    });
  }

  return res.json({ success: true, data: getLastInsight(patientId) });
});

export default router;
