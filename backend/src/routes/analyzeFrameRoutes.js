import express from "express";
import multer from "multer";
import { forwardFrameToAiService } from "../services/aiProxy.js";
import authRequired from "../middleware/authRequired.js";
import { emitVisionUpdate } from "../sockets/index.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  "/",
  authRequired,
  upload.single("frame"),
  async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(200).json({
        status: "error",
        message: 'missing multipart field "frame"',
      });
    }
    const result = await forwardFrameToAiService(
      req.file.buffer,
      req.file.mimetype || "image/jpeg",
      req.file.originalname || "frame.jpg"
    );
    // Side effect: notify frontend listeners.
    emitVisionUpdate(req.app.locals.io, {
      patientId: req.auth?.role === "patient" ? req.auth.userId : undefined,
      ...result,
      timestamp: new Date().toISOString(),
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: err?.message || "analyze-frame failed",
    });
  }
});

export default router;
