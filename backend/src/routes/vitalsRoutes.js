import express from "express";
import authRequired from "../middleware/authRequired.js";
import {
  createVitals,
  getLatestVitals,
  getVitalsHistory,
} from "../controllers/vitalsController.js";

const router = express.Router();

router.post("/", authRequired, async (req, res) => {
  try {
    const vitals = await createVitals(req);
    res.status(201).json({ success: true, data: vitals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/latest", authRequired, async (req, res) => {
  try {
    const latest = await getLatestVitals(req.auth);
    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/history", authRequired, async (req, res) => {
  try {
    const history = await getVitalsHistory(req.auth, req.query.limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
