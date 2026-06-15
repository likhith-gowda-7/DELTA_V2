import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const hasCloudinaryConfig = Boolean(
  cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

// Configure Cloudinary
if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Create multer instance
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10485760, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed. Allowed types: ${allowedMimes.join(", ")}`,
        ),
      );
    }
  },
});

// Upload directly to Cloudinary (without storing locally)
export const uploadToCloudinary = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!hasCloudinaryConfig) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "delta-chat",
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalname}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(file.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    fileType: file.mimetype,
    fileName: file.originalname,
    fileSize: file.size,
  };
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
