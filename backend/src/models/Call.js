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
      required: false, // Not required for group calls (uses participants array)
      default: null,
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
    rejectionReason: {
      type: String,
      default: null,
      enum: [null, "busy", "declined", "no_answer", "network_error"],
    },
    // Group call settings
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    maxParticipants: {
      type: Number,
      default: 2,
      min: 2,
      max: 100,
    },

    // Screen sharing
    screenShareParticipants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        startedAt: Date,
        endedAt: Date,
      },
    ],

    // Recording
    recordingUrl: {
      type: String,
      default: null,
    },
    recordingStartedAt: {
      type: Date,
      default: null,
    },
    recordingDuration: {
      type: Number,
      default: 0, // in seconds
    },
    recordingSize: {
      type: Number,
      default: 0, // in bytes
    },

    // Enhanced metadata with per-participant tracking
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
      audioQuality: {
        type: String,
        enum: ["hd", "sd", "low"],
        default: "sd",
      },
      videoQuality: {
        type: String,
        enum: ["hd", "sd", "low"],
        default: "sd",
      },
      iceCandidatesExchanged: {
        type: Boolean,
        default: false,
      },
      bandwidth: {
        type: Number,
        default: 0, // Mbps
      },
      packetLoss: {
        type: Number,
        default: 0, // percentage
      },
      roundTripTime: {
        type: Number,
        default: 0, // ms
      },
    },

    // Detailed participant tracking for group calls
    participantDetails: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: Date,
        leftAt: Date,
        duration: Number, // in seconds
        audioEnabled: {
          type: Boolean,
          default: true,
        },
        videoEnabled: {
          type: Boolean,
          default: true,
        },
        screenShared: {
          type: Boolean,
          default: false,
        },
        quality: {
          audio: String,
          video: String,
          bandwidth: Number,
          packetLoss: Number,
        },
      },
    ],
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
    participantDetails: [
      {
        userId: initiatorId,
        joinedAt: new Date(),
        audioEnabled: true,
        videoEnabled: true,
      },
      {
        userId: recipientId,
        joinedAt: new Date(),
        audioEnabled: true,
        videoEnabled: true,
      },
    ],
    mediaType,
    callType: "1-to-1",
  });
  return call.save();
};

// Static method to create group call
callSchema.statics.createGroupCall = async function (
  initiatorId,
  participantIds,
  chatId,
  mediaType = "audio-video",
) {
  const allParticipants = [initiatorId, ...participantIds];
  const participantDetails = allParticipants.map((userId) => ({
    userId,
    joinedAt: new Date(),
    audioEnabled: true,
    videoEnabled: true,
  }));

  const call = new this({
    initiatorId,
    participants: allParticipants,
    participantDetails,
    chatId,
    mediaType,
    callType: "group",
    isGroupCall: true,
    maxParticipants: Math.min(allParticipants.length + 2, 6), // Allow 2 more to join
  });
  return call.save();
};

// Method to add participant to group call
callSchema.methods.addParticipant = async function (userId) {
  if (this.participants.includes(userId)) {
    throw new Error("Participant already in call");
  }

  this.participants.push(userId);
  this.participantDetails.push({
    userId,
    joinedAt: new Date(),
    audioEnabled: true,
    videoEnabled: true,
  });

  this.maxParticipants = Math.min(this.participants.length + 2, 6);
  return this.save();
};

// Method to remove participant from group call
callSchema.methods.removeParticipant = async function (userId) {
  const participantIndex = this.participants.findIndex(
    (id) => id.toString() === userId.toString(),
  );

  if (participantIndex === -1) {
    throw new Error("Participant not found in call");
  }

  // Update participantDetails with left time
  const detailIndex = this.participantDetails.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );

  if (detailIndex !== -1) {
    this.participantDetails[detailIndex].leftAt = new Date();
    if (this.participantDetails[detailIndex].joinedAt) {
      this.participantDetails[detailIndex].duration = Math.floor(
        (this.participantDetails[detailIndex].leftAt -
          this.participantDetails[detailIndex].joinedAt) /
          1000,
      );
    }
  }

  this.participants.splice(participantIndex, 1);

  // If no participants left, end the call
  if (this.participants.length === 0) {
    this.status = "ended";
    this.endedAt = new Date();
    this.calculateDuration();
  }

  return this.save();
};

// Method to start screen share
callSchema.methods.startScreenShare = async function (userId) {
  const existingShare = this.screenShareParticipants.find(
    (s) => s.userId.toString() === userId.toString() && !s.endedAt,
  );

  if (existingShare) {
    throw new Error("User already sharing screen");
  }

  this.screenShareParticipants.push({
    userId,
    startedAt: new Date(),
  });

  // Update participantDetails
  const detailIndex = this.participantDetails.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );

  if (detailIndex !== -1) {
    this.participantDetails[detailIndex].screenShared = true;
  }

  return this.save();
};

// Method to stop screen share
callSchema.methods.stopScreenShare = async function (userId) {
  const shareIndex = this.screenShareParticipants.findIndex(
    (s) => s.userId.toString() === userId.toString() && !s.endedAt,
  );

  if (shareIndex === -1) {
    throw new Error("No active screen share found");
  }

  this.screenShareParticipants[shareIndex].endedAt = new Date();

  // Update participantDetails
  const detailIndex = this.participantDetails.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );

  if (detailIndex !== -1) {
    this.participantDetails[detailIndex].screenShared = false;
  }

  return this.save();
};

// Method to start recording
callSchema.methods.startRecording = function () {
  this.recordingStartedAt = new Date();
  return this.save();
};

// Method to stop recording
callSchema.methods.stopRecording = function () {
  if (this.recordingStartedAt) {
    this.recordingDuration = Math.floor(
      (new Date() - this.recordingStartedAt) / 1000,
    );
  }
  return this.save();
};

// Method to update participant quality metrics
callSchema.methods.updateParticipantQuality = async function (
  userId,
  qualityMetrics,
) {
  const detailIndex = this.participantDetails.findIndex(
    (p) => p.userId.toString() === userId.toString(),
  );

  if (detailIndex !== -1) {
    this.participantDetails[detailIndex].quality = qualityMetrics;
  }

  return this.save();
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

// Static method to get group calls for user
callSchema.statics.getUserGroupCalls = async function (
  userId,
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;

  const calls = await this.find({
    isGroupCall: true,
    participants: userId,
  })
    .populate("initiatorId", "name avatar")
    .populate("participants", "name avatar email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments({
    isGroupCall: true,
    participants: userId,
  });

  return { calls, total, page, limit };
};

// Static method to get group call details with participants
callSchema.statics.getGroupCallDetails = async function (callId) {
  return this.findById(callId)
    .populate("initiatorId", "name avatar email")
    .populate("participants", "name avatar email")
    .populate("participantDetails.userId", "name avatar email")
    .populate("screenShareParticipants.userId", "name avatar")
    .lean();
};

// Static method to get call analytics
callSchema.statics.getCallStats = async function (userId) {
  const calls = await this.find({
    $or: [{ initiatorId: userId }, { recipientId: userId }],
    status: "ended",
  }).lean();

  const totalCalls = calls.length;
  const totalDuration = calls.reduce(
    (sum, call) => sum + (call.duration || 0),
    0,
  );
  const averageDuration =
    totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;

  const groupCalls = calls.filter((c) => c.isGroupCall).length;
  const oneToOneCalls = totalCalls - groupCalls;

  return {
    totalCalls,
    groupCalls,
    oneToOneCalls,
    totalDuration,
    averageDuration,
  };
};

export default mongoose.model("Call", callSchema);
