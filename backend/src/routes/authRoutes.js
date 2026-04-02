import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import authRequired from "../middleware/authRequired.js";

const router = express.Router();

function jwtSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

function expiresIn() {
  return process.env.JWT_EXPIRES_IN || "8h";
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Missing email/password" });
    }

    // Demo fallback: if Mongo doesn't yet have users, create one deterministically.
    if (email === "demo@smartiv.com" && password === "demo123") {
      let demoDoctor = await User.findOne({ email: "demo@smartiv.com" });
      if (!demoDoctor) {
        const passwordHash = await bcrypt.hash("demo123", 10);
        demoDoctor = await User.create({
          email,
          passwordHash,
          role: "doctor",
        });
      }
      const token = jwt.sign(
        { sub: demoDoctor._id.toString(), role: demoDoctor.role, email: demoDoctor.email },
        jwtSecret(),
        { expiresIn: expiresIn() }
      );
      return res.json({
        success: true,
        data: {
          token,
          user: { id: demoDoctor._id.toString(), role: demoDoctor.role, email: demoDoctor.email },
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email },
      jwtSecret(),
      { expiresIn: expiresIn() }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user._id.toString(), role: user.role, email: user.email },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select("_id email role assignedDoctorId");
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

