import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

/**
 * @route   POST /api/uploads/image
 * @desc    Upload image/file to Cloudinary
 * @access  Private
 */
export const uploadFile = asyncHandler(async (req, res) => {
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
