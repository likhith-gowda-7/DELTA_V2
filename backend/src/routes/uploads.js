const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/uploadController");
const { protectedRoute } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// All routes require authentication
router.use(protectedRoute);

/**
 * @route   POST /api/uploads/file
 * @desc    Upload file/image to Cloudinary
 * @access  Private
 */
router.post("/file", upload.single("file"), uploadFile);

module.exports = router;
