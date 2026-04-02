import express from "express";
import authRequired from "../middleware/authRequired.js";
import { createAlert, listAlerts } from "../controllers/alertController.js";

const router = express.Router();

router.post("/", authRequired, async (req, res) => {
  try {
    const alert = await createAlert(req);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/", authRequired, async (req, res) => {
  try {
    const alerts = await listAlerts(req.auth);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
