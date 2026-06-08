import mongoose from "mongoose";
import Call from "../models/Call.js";
import AppError from "../lib/AppError.js";
import logger from "../lib/logger.js";

/**
 * Create a new call
 */
export const createCall = async (
  initiatorId,
  recipientId,
  mediaType = "audio-video",
) => {
  try {
    // Check if call already exists between these users
    const existingCall = await Call.getPendingCallBetween(
      initiatorId,
      recipientId,
    );
    if (existingCall) {
      throw new AppError("Call already in progress with this user", 400);
    }

    const call = await Call.createCall(initiatorId, recipientId, mediaType);
    return call;
  } catch (error) {
    logger.error("Error creating call:", error);
    throw error;
  }
};

/**
 * Accept a call
 */
export const acceptCall = async (callId, userId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is the recipient
    if (call.recipientId.toString() !== userId.toString()) {
      throw new AppError(
        "Unauthorized: You are not the recipient of this call",
        403,
      );
    }

    // Check call status
    if (call.status !== "pending") {
      throw new AppError(`Cannot accept call with status: ${call.status}`, 400);
    }

    await call.accept();
    return call;
  } catch (error) {
    logger.error("Error accepting call:", error);
    throw error;
  }
};

/**
 * Reject a call
 */
export const rejectCall = async (callId, userId, reason = "declined") => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is the recipient or initiator
    const isRecipient = call.recipientId.toString() === userId.toString();
    const isInitiator = call.initiatorId.toString() === userId.toString();

    if (!isRecipient && !isInitiator) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    // Check call status
    if (call.status === "ended" || call.status === "rejected") {
      throw new AppError(`Cannot reject call with status: ${call.status}`, 400);
    }

    await call.reject(reason);
    return call;
  } catch (error) {
    logger.error("Error rejecting call:", error);
    throw error;
  }
};

/**
 * End a call
 */
export const endCall = async (callId, userId, duration = null) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    const isInitiator = call.initiatorId.toString() === userId.toString();
    const isRecipient = call.recipientId.toString() === userId.toString();

    if (!isInitiator && !isRecipient) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    // Update end time and duration
    if (call.status === "accepted") {
      call.endedAt = new Date();
      if (duration) {
        call.duration = duration;
      } else {
        call.calculateDuration();
      }
      call.status = "ended";
      await call.save();
    } else if (call.status === "pending") {
      // If still pending, mark as missed
      await call.markAsMissed();
    }

    return call;
  } catch (error) {
    logger.error("Error ending call:", error);
    throw error;
  }
};

/**
 * Get call by ID
 */
export const getCallById = async (callId) => {
  try {
    const call = await Call.getCallWithDetails(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    return call;
  } catch (error) {
    logger.error("Error fetching call:", error);
    throw error;
  }
};

/**
 * Get call history for user
 */
export const getUserCallHistory = async (userId, page = 1, limit = 20) => {
  try {
    const { calls, total } = await Call.getUserCallHistory(userId, page, limit);

    return {
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching call history:", error);
    throw error;
  }
};

/**
 * Get missed calls for user
 */
export const getUserMissedCalls = async (userId) => {
  try {
    const missedCalls = await Call.getUserMissedCalls(userId);
    return missedCalls;
  } catch (error) {
    logger.error("Error fetching missed calls:", error);
    throw error;
  }
};

/**
 * Get missed calls count
 */
export const getUserMissedCallsCount = async (userId) => {
  try {
    const count = await Call.countDocuments({
      recipientId: userId,
      status: "missed",
    });
    return count;
  } catch (error) {
    logger.error("Error fetching missed calls count:", error);
    throw error;
  }
};

/**
 * Get active calls for user
 */
export const getUserActiveCalls = async (userId) => {
  try {
    const activeCalls = await Call.getUserActiveCalls(userId);
    return activeCalls;
  } catch (error) {
    logger.error("Error fetching active calls:", error);
    throw error;
  }
};

/**
 * Update call metadata (audio/video status, connection quality)
 */
export const updateCallMetadata = async (callId, userId, metadata) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    const isInitiator = call.initiatorId.toString() === userId.toString();
    const isRecipient = call.recipientId.toString() === userId.toString();

    if (!isInitiator && !isRecipient) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    // Update metadata based on user role
    if (isInitiator) {
      if (metadata.audioEnabled !== undefined) {
        call.metadata.initiatorAudioEnabled = metadata.audioEnabled;
      }
      if (metadata.videoEnabled !== undefined) {
        call.metadata.initiatorVideoEnabled = metadata.videoEnabled;
      }
    }

    if (isRecipient) {
      if (metadata.audioEnabled !== undefined) {
        call.metadata.recipientAudioEnabled = metadata.audioEnabled;
      }
      if (metadata.videoEnabled !== undefined) {
        call.metadata.recipientVideoEnabled = metadata.videoEnabled;
      }
    }

    if (metadata.connectionQuality !== undefined) {
      call.metadata.connectionQuality = metadata.connectionQuality;
    }

    if (metadata.iceCandidatesExchanged !== undefined) {
      call.metadata.iceCandidatesExchanged = metadata.iceCandidatesExchanged;
    }

    await call.save();
    return call;
  } catch (error) {
    logger.error("Error updating call metadata:", error);
    throw error;
  }
};

/**
 * Get pending call between two users
 */
export const getPendingCallBetween = async (userId1, userId2) => {
  try {
    const call = await Call.getPendingCallBetween(userId1, userId2);
    return call;
  } catch (error) {
    logger.error("Error fetching pending call:", error);
    throw error;
  }
};

/**
 * Delete old calls (for cleanup)
 */
export const deleteOldCalls = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Call.deleteMany({
      endedAt: { $lt: cutoffDate },
      status: "ended",
    });

    logger.info(`Deleted ${result.deletedCount} old call records`);
    return result;
  } catch (error) {
    logger.error("Error deleting old calls:", error);
    throw error;
  }
};

/**
 * Get call statistics for user
 */
export const getUserCallStats = async (userId) => {
  try {
    const totalCalls = await Call.countDocuments({
      $or: [{ initiatorId: userId }, { recipientId: userId }],
    });

    const missedCalls = await Call.countDocuments({
      recipientId: userId,
      status: "missed",
    });

    const totalDuration = await Call.aggregate([
      {
        $match: {
          $or: [
            { initiatorId: new mongoose.Types.ObjectId(userId) },
            { recipientId: new mongoose.Types.ObjectId(userId) },
          ],
          status: "ended",
        },
      },
      {
        $group: {
          _id: null,
          totalSeconds: { $sum: "$duration" },
        },
      },
    ]);

    return {
      totalCalls,
      missedCalls,
      totalDuration: totalDuration[0]?.totalSeconds || 0,
      averageDuration:
        totalCalls > 0
          ? Math.floor((totalDuration[0]?.totalSeconds || 0) / totalCalls)
          : 0,
    };
  } catch (error) {
    logger.error("Error fetching call statistics:", error);
    throw error;
  }
};

/**
 * Create a new group call
 */
export const createGroupCall = async (
  initiatorId,
  participantIds,
  chatId,
  mediaType = "audio-video",
) => {
  try {
    const call = await Call.createGroupCall(
      initiatorId,
      participantIds,
      chatId,
      mediaType,
    );
    return call;
  } catch (error) {
    logger.error("Error creating group call:", error);
    throw error;
  }
};

/**
 * Add participant to active group call
 */
export const addParticipantToCall = async (callId, userId, addingUserId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify the user adding participant is the initiator or admin
    if (call.initiatorId.toString() !== addingUserId.toString()) {
      throw new AppError(
        "Unauthorized: Only call initiator can add participants",
        403,
      );
    }

    // Check if already at max participants
    if (call.participants.length >= call.maxParticipants) {
      throw new AppError("Call has reached maximum participants", 400);
    }

    await call.addParticipant(userId);
    return call;
  } catch (error) {
    logger.error("Error adding participant to call:", error);
    throw error;
  }
};

/**
 * Remove participant from group call
 */
export const removeParticipantFromCall = async (callId, userId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    await call.removeParticipant(userId);
    return call;
  } catch (error) {
    logger.error("Error removing participant from call:", error);
    throw error;
  }
};

/**
 * Start screen sharing in a call
 */
export const startScreenShare = async (callId, userId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    if (!call.participants.some((id) => id.toString() === userId.toString())) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    await call.startScreenShare(userId);
    logger.info(`Screen sharing started for user ${userId} in call ${callId}`);
    return call;
  } catch (error) {
    logger.error("Error starting screen share:", error);
    throw error;
  }
};

/**
 * Stop screen sharing in a call
 */
export const stopScreenShare = async (callId, userId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    if (!call.participants.some((id) => id.toString() === userId.toString())) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    await call.stopScreenShare(userId);
    logger.info(`Screen sharing stopped for user ${userId} in call ${callId}`);
    return call;
  } catch (error) {
    logger.error("Error stopping screen share:", error);
    throw error;
  }
};

/**
 * Start recording a call
 */
export const startRecording = async (callId, userId) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is the initiator
    if (call.initiatorId.toString() !== userId.toString()) {
      throw new AppError(
        "Unauthorized: Only call initiator can start recording",
        403,
      );
    }

    await call.startRecording();
    logger.info(`Recording started for call ${callId}`);
    return call;
  } catch (error) {
    logger.error("Error starting recording:", error);
    throw error;
  }
};

/**
 * Stop recording a call
 */
export const stopRecording = async (callId, userId, recordingUrl = null) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is the initiator
    if (call.initiatorId.toString() !== userId.toString()) {
      throw new AppError(
        "Unauthorized: Only call initiator can stop recording",
        403,
      );
    }

    await call.stopRecording();
    if (recordingUrl) {
      call.recordingUrl = recordingUrl;
      await call.save();
    }
    logger.info(`Recording stopped for call ${callId}`);
    return call;
  } catch (error) {
    logger.error("Error stopping recording:", error);
    throw error;
  }
};

/**
 * Get group call details with participants
 */
export const getGroupCallDetails = async (callId, userId) => {
  try {
    const call = await Call.getGroupCallDetails(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    if (
      !call.participants.some((p) => p._id.toString() === userId.toString())
    ) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    return call;
  } catch (error) {
    logger.error("Error fetching group call details:", error);
    throw error;
  }
};

/**
 * Update participant quality metrics
 */
export const updateParticipantQuality = async (
  callId,
  userId,
  qualityMetrics,
) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    // Verify user is part of the call
    if (!call.participants.some((id) => id.toString() === userId.toString())) {
      throw new AppError("Unauthorized: You are not part of this call", 403);
    }

    await call.updateParticipantQuality(userId, qualityMetrics);
    return call;
  } catch (error) {
    logger.error("Error updating participant quality:", error);
    throw error;
  }
};

/**
 * Get group call statistics
 */
export const getGroupCallStats = async (userId) => {
  try {
    return await Call.getCallStats(userId);
  } catch (error) {
    logger.error("Error fetching group call statistics:", error);
    throw error;
  }
};
