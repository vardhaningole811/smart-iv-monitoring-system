import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
  {
    heartRate: { type: Number, required: true },
    spo2: { type: Number, required: true },
    ivStatus: { type: String, enum: ["running", "stopped"], required: true },

    //  Changed from ObjectId → String (for demo/hackathon)
    patientId: { type: String, required: true },

    // Optional: device node (keep as ObjectId, no issue)
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceNode" },

    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Vitals", vitalsSchema);