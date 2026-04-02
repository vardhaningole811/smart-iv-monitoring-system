import mongoose from "mongoose";

const deviceNodeSchema = new mongoose.Schema(
  {
    // Human-friendly identifier for a sensor/host
    nodeKey: { type: String, required: true, unique: true, index: true },
    host: { type: String, required: true },

    // Which patient this node's feeds are assigned to right now (doctor can grant/revoke)
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // For auditing who performed assignment
    assignedByDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

deviceNodeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("DeviceNode", deviceNodeSchema);

