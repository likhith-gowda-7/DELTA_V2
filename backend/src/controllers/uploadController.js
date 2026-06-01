const { uploadToCloudinary } = require("../config/cloudinary");
const asyncHandler = require("../lib/asyncHandler");
const AppError = require("../lib/AppError");
const logger = require("../lib/logger");

/**
 * @route   POST /api/uploads/image
 * @desc    Upload image/file to Cloudinary
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file provided", 400);
  }

  logger.info(
    `Uploading file: ${req.file.originalname} by user ${req.user._id}`,
  );

  try {
    const uploadResult = await uploadToCloudinary(req.file);

    logger.info(`File uploaded successfully: ${uploadResult.url}`);

    res.status(200).json({
      success: true,
      data: {
        url: uploadResult.url,
        fileType: uploadResult.fileType,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        publicId: uploadResult.publicId,
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    logger.error(`File upload failed: ${error.message}`);
    throw new AppError(`File upload failed: ${error.message}`, 500);
  }
});

module.exports = {
  uploadFile,
};
