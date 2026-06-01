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
 * GET /api/calls/:id
 * Get call details
 */
router.get(
  "/:id",
  validateRequest(callValidator.callIdSchema, "params"),
  callController.getCall,
);

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

export default router;
