import mongoose from "mongoose";

/**
 * Per-participant call quality samples. The `call_metrics` socket event
 * fires at GROUP_CALL_LIMITS.QUALITY_REPORT_INTERVAL_MS; each event
 * persists one sample here for later analytics.
 */
const callMetricsSchema = new mongoose.Schema(
  {
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
    // Quality samples (all optional, clients send what they measure)
    audio: { type: String, enum: ["hd", "sd", "low", null], default: null },
    video: { type: String, enum: ["hd", "sd", "low", null], default: null },
    bandwidth: { type: Number, default: 0 }, // Mbps
    packetLoss: { type: Number, default: 0 }, // percentage 0-100
    roundTripTime: { type: Number, default: 0 }, // ms
    jitter: { type: Number, default: 0 }, // ms
    framesPerSecond: { type: Number, default: 0 },
    resolution: { type: String, default: null }, // e.g. "1280x720"
  },
  { timestamps: false },
);

// Compound index for "latest sample per (call, user)"
callMetricsSchema.index({ callId: 1, userId: 1, timestamp: -1 });

// TTL index: drop samples older than 30 days automatically
callMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static: aggregate average quality across a call
callMetricsSchema.statics.getCallQuality = async function (callId) {
  const result = await this.aggregate([
    { $match: { callId: new mongoose.Types.ObjectId(callId) } },
    {
      $group: {
        _id: null,
        avgBandwidth: { $avg: "$bandwidth" },
        avgPacketLoss: { $avg: "$packetLoss" },
        avgRtt: { $avg: "$roundTripTime" },
        avgJitter: { $avg: "$jitter" },
        avgFps: { $avg: "$framesPerSecond" },
        sampleCount: { $sum: 1 },
      },
    },
  ]);
  return result[0] || null;
};

export default mongoose.model("CallMetrics", callMetricsSchema);
