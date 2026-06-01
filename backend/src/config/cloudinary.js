import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Validate required env vars
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error("CLOUDINARY_CLOUD_NAME is not set in environment variables");
}
if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error("CLOUDINARY_API_KEY is not set in environment variables");
}
if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error("CLOUDINARY_API_SECRET is not set in environment variables");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage for multer with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "delta-chat", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
    max_file_size: 10485760, // 10MB
    resource_type: "auto", // Auto detect file type
  },
});

// Create multer instance
export const upload = multer({
  storage: storage,
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
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
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
  } catch (error) {
    throw error;
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
