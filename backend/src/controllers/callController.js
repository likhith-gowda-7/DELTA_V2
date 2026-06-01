import asyncHandler from "../lib/asyncHandler.js";
import * as callService from "../services/call.service.js";

/**
 * Initiate a new call
 * POST /api/calls/initiate
 */
export const initiateCall = asyncHandler(async (req, res) => {
  const { recipientId, mediaType } = req.body;
  const initiatorId = req.user._id;

  const call = await callService.createCall(
    initiatorId,
    recipientId,
    mediaType,
  );

  res.status(201).json({
    success: true,
    data: call,
  });
});

/**
 * Accept a call
 * PUT /api/calls/:id/accept
 */
export const acceptCall = asyncHandler(async (req, res) => {
  const { id: callId } = req.params;
  const userId = req.user._id;

  const call = await callService.acceptCall(callId, userId);

  res.status(200).json({
    success: true,
    data: call,
  });
});

/**
 * Reject a call
 * PUT /api/calls/:id/reject
 */
export const rejectCall = asyncHandler(async (req, res) => {
  const { id: callId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const call = await callService.rejectCall(callId, userId, reason);

  res.status(200).json({
    success: true,
    data: call,
  });
});

/**
 * End a call
 * PUT /api/calls/:id/end
 */
export const endCall = asyncHandler(async (req, res) => {
  const { id: callId } = req.params;
  const { duration } = req.body;
  const userId = req.user._id;

  const call = await callService.endCall(callId, userId, duration);

  res.status(200).json({
    success: true,
    data: call,
  });
});

/**
 * Get call by ID
 * GET /api/calls/:id
 */
export const getCall = asyncHandler(async (req, res) => {
  const { id: callId } = req.params;

  const call = await callService.getCallById(callId);

  res.status(200).json({
    success: true,
    data: call,
  });
});

/**
 * Get call history (paginated)
 * GET /api/calls/history?page=1&limit=20
 */
export const getCallHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const result = await callService.getUserCallHistory(
    userId,
    parseInt(page),
    parseInt(limit),
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Get missed calls
 * GET /api/calls/missed
 */
export const getMissedCalls = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const missedCalls = await callService.getUserMissedCalls(userId);

  res.status(200).json({
    success: true,
    data: missedCalls,
    count: missedCalls.length,
  });
});

/**
 * Get active calls
 * GET /api/calls/active
 */
export const getActiveCalls = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const activeCalls = await callService.getUserActiveCalls(userId);

  res.status(200).json({
    success: true,
    data: activeCalls,
    count: activeCalls.length,
  });
});

/**
 * Update call metadata
 * PUT /api/calls/:id/metadata
 */
export const updateCallMetadata = asyncHandler(async (req, res) => {
  const { id: callId } = req.params;
  const userId = req.user._id;
  const metadata = req.body;

  const call = await callService.updateCallMetadata(callId, userId, metadata);

  res.status(200).json({
    success: true,
    data: call,
  });
});

/**
 * Get call statistics
 * GET /api/calls/stats
 */
export const getCallStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await callService.getUserCallStats(userId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
