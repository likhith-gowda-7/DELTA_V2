import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    callType: {
      type: String,
      enum: ["1-to-1", "group"],
      default: "1-to-1",
    },
    mediaType: {
      type: String,
      enum: ["audio", "video", "audio-video"],
      default: "audio-video",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "missed", "ended"],
      default: "pending",
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    recordingUrl: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      enum: [null, "busy", "declined", "no_answer", "network_error"],
    },
    metadata: {
      initiatorAudioEnabled: {
        type: Boolean,
        default: true,
      },
      initiatorVideoEnabled: {
        type: Boolean,
        default: true,
      },
      recipientAudioEnabled: {
        type: Boolean,
        default: true,
      },
      recipientVideoEnabled: {
        type: Boolean,
        default: true,
      },
      connectionQuality: {
        type: String,
        enum: ["good", "fair", "poor"],
        default: "good",
      },
      iceCandidatesExchanged: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
callSchema.index({ initiatorId: 1, createdAt: -1 });
callSchema.index({ recipientId: 1, createdAt: -1 });
callSchema.index({ chatId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Method to calculate duration
callSchema.methods.calculateDuration = function () {
  if (this.startedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  return this.duration;
};

// Method to mark call as accepted
callSchema.methods.accept = function () {
  this.status = "accepted";
  this.startedAt = new Date();
  return this.save();
};

// Method to mark call as rejected
callSchema.methods.reject = function (reason = "declined") {
  this.status = "rejected";
  this.rejectionReason = reason;
  return this.save();
};

// Method to mark call as ended
callSchema.methods.end = function () {
  this.status = "ended";
  this.endedAt = new Date();
  this.calculateDuration();
  return this.save();
};

// Method to mark call as missed
callSchema.methods.markAsMissed = function () {
  this.status = "missed";
  this.rejectionReason = "no_answer";
  return this.save();
};

// Static method to create call
callSchema.statics.createCall = async function (
  initiatorId,
  recipientId,
  mediaType = "audio-video",
) {
  const call = new this({
    initiatorId,
    recipientId,
    participants: [initiatorId, recipientId],
    mediaType,
    callType: "1-to-1",
  });
  return call.save();
};

// Static method to get call by ID with populated references
callSchema.statics.getCallWithDetails = async function (callId) {
  return this.findById(callId)
    .populate("initiatorId", "name avatar email")
    .populate("recipientId", "name avatar email")
    .populate("participants", "name avatar email")
    .lean();
};

// Static method to get call history for user
callSchema.statics.getUserCallHistory = async function (
  userId,
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;

  const calls = await this.find({
    $or: [{ initiatorId: userId }, { recipientId: userId }],
  })
    .populate("initiatorId", "name avatar")
    .populate("recipientId", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments({
    $or: [{ initiatorId: userId }, { recipientId: userId }],
  });

  return { calls, total, page, limit };
};

// Static method to get missed calls for user
callSchema.statics.getUserMissedCalls = async function (userId) {
  return this.find({
    recipientId: userId,
    status: "missed",
  })
    .populate("initiatorId", "name avatar")
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to get active calls for user
callSchema.statics.getUserActiveCalls = async function (userId) {
  return this.find({
    $or: [{ initiatorId: userId }, { recipientId: userId }],
    status: { $in: ["pending", "accepted"] },
  })
    .populate("initiatorId", "name avatar")
    .populate("recipientId", "name avatar")
    .lean();
};

// Static method to get pending call between two users
callSchema.statics.getPendingCallBetween = async function (userId1, userId2) {
  return this.findOne({
    $or: [
      { initiatorId: userId1, recipientId: userId2 },
      { initiatorId: userId2, recipientId: userId1 },
    ],
    status: "pending",
  }).lean();
};

export default mongoose.model("Call", callSchema);
