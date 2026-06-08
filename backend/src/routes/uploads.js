import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoute);

/**
 * @route   POST /api/uploads/file
 * @desc    Upload file/image to Cloudinary
 * @access  Private
 */
router.post("/file", upload.single("file"), uploadFile);

export default router;
