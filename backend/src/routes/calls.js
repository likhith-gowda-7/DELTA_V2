import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import * as callController from "../controllers/callController.js";
import * as callValidator from "../validators/call.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoute);

/**
 * POST /api/calls/initiate
 * Initiate a new call
 */
router.post(
  "/initiate",
  validateRequest(callValidator.initiateCallSchema, "body"),
  callController.initiateCall,
);

/**
 * PUT /api/calls/:id/accept
 * Accept an incoming call
 */
router.put(
  "/:id/accept",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.acceptCall,
);

/**
 * PUT /api/calls/:id/reject
 * Reject an incoming call
 */
router.put(
  "/:id/reject",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.rejectCallSchema, "body"),
  callController.rejectCall,
);

/**
 * PUT /api/calls/:id/end
 * End an ongoing call
 */
router.put(
  "/:id/end",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.endCallSchema, "body"),
  callController.endCall,
);

/**
 * PUT /api/calls/:id/metadata
 * Update call metadata (audio/video status, connection quality)
 */
router.put(
  "/:id/metadata",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.updateCallMetadataSchema, "body"),
  callController.updateCallMetadata,
);

/**
 * POST /api/calls/group/create
 * Create a new group call
 */
router.post(
  "/group/create",
  validateRequest(callValidator.createGroupCallSchema, "body"),
  callController.createGroupCall,
);

/**
 * PUT /api/calls/:id/add-participant
 * Add participant to group call
 */
router.put(
  "/:id/add-participant",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.addParticipantSchema, "body"),
  callController.addParticipant,
);

/**
 * PUT /api/calls/:id/remove-participant
 * Remove participant from group call
 */
router.put(
  "/:id/remove-participant",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.removeParticipantSchema, "body"),
  callController.removeParticipant,
);

/**
 * PUT /api/calls/:id/start-screen-share
 * Start screen sharing in a call
 */
router.put(
  "/:id/start-screen-share",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.startScreenShare,
);

/**
 * PUT /api/calls/:id/stop-screen-share
 * Stop screen sharing in a call
 */
router.put(
  "/:id/stop-screen-share",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.stopScreenShare,
);

/**
 * PUT /api/calls/:id/start-recording
 * Start recording a call
 */
router.put(
  "/:id/start-recording",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.startRecording,
);

/**
 * PUT /api/calls/:id/stop-recording
 * Stop recording a call
 */
router.put(
  "/:id/stop-recording",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.stopRecordingSchema, "body"),
  callController.stopRecording,
);

/**
 * GET /api/calls/:id/details
 * Get group call details
 */
router.get(
  "/:id/details",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.getGroupCallDetails,
);

/**
 * PUT /api/calls/:id/participant-quality
 * Update participant quality metrics
 */
router.put(
  "/:id/participant-quality",
  validateRequest(callValidator.callIdSchema, "params"),
  validateRequest(callValidator.updateParticipantQualitySchema, "body"),
  callController.updateParticipantQuality,
);

/**
 * GET /api/calls/missed
 * Get missed calls
 */
router.get("/missed", callController.getMissedCalls);

/**
 * GET /api/calls/active
 * Get active calls
 */
router.get("/active", callController.getActiveCalls);

/**
 * GET /api/calls/stats
 * Get call statistics
 */
router.get("/stats", callController.getCallStats);

/**
 * GET /api/calls/history
 * Get call history (paginated)
 */
router.get(
  "/",
  validateRequest(callValidator.callHistorySchema, "query"),
  callController.getCallHistory,
);

/**
 * GET /api/calls/:id
 * Get call details
 */
router.get(
  "/:id",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.getCall,
);

export default router;
