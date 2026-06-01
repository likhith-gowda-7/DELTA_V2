import { useState } from "react";
import { uploadsAPI } from "../api/uploads.api";

/**
 * Custom hook for handling file uploads
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      if (file.size > 10485760) {
        throw new Error("File size must not exceed 10MB");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("File type not allowed");
      }

      // Simulate progress (0-90% while uploading)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 30;
        });
      }, 100);

      // Upload file
      const response = await uploadsAPI.uploadFile(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const resetProgress = () => {
    setUploadProgress(0);
    setUploading(false);
    setError(null);
  };

  return {
    uploadFile,
    uploading,
    uploadProgress,
    error,
    resetProgress,
  };
};
