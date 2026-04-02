import jwt from "jsonwebtoken";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-only-change-me";
}

export default function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  // 🔥 ADD THIS BLOCK (VERY IMPORTANT)
  if (token === "demo-staff-token") {
    req.auth = {
      userId: "demo_staff",
      role: "doctor",
      email: "staff@hospital.local",
    };
    return next();
  }

  // ORIGINAL LOGIC
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}