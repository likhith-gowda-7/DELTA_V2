import CallMetrics from "../models/CallMetrics.js";
import Call from "../models/Call.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

/**
 * Record a single quality sample for a user in a call. Called by the
 * `call_metrics` socket event handler.
 */
export const recordMetric = async (callId, userId, sample) => {
  try {
    // Verify the user is a participant of the call (cheap guard)
    const isParticipant = await Call.exists({
      _id: callId,
      $or: [
        { initiatorId: userId },
        { recipientId: userId },
        { participants: userId },
      ],
    });
    if (!isParticipant) {
      throw new AppError("User is not a participant of this call", 403);
    }

    const doc = await CallMetrics.create({
      callId,
      userId,
      timestamp: new Date(),
      ...sample,
    });
    return doc;
  } catch (error) {
    logger.error("Error recording call metric:", error.message);
    throw error;
  }
};

/**
 * Get aggregated quality for a call (used by analytics dashboard).
 */
export const getCallQuality = async (callId) => {
  try {
    return await CallMetrics.getCallQuality(callId);
  } catch (error) {
    logger.error("Error fetching call quality:", error.message);
    throw error;
  }
};

/**
 * Get the latest N samples for a user in a call.
 */
export const getUserCallSamples = async (callId, userId, limit = 50) => {
  try {
    return await CallMetrics.find({ callId, userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    logger.error("Error fetching user call samples:", error.message);
    throw error;
  }
};
