import express from "express";
import {
  createEvent,
  scheduleDrugCurveCompute,
} from "../controllers/eventController.js";
import authRequired from "../middleware/authRequired.js";

const router = express.Router();

router.post("/", authRequired, async (req, res) => {
  try {
    const role = req.auth?.role;
    const authUserId = req.auth?.userId;
    const body = { ...req.body };

    if (role === "patient") {
      body.patientId = authUserId;
    }
    if (!body.patientId) {
      return res.status(400).json({ success: false, error: "patientId is required" });
    }

    const event = await createEvent(body);
    res.status(201).json({ success: true, data: event });
    scheduleDrugCurveCompute(event, req.app.locals.io);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
