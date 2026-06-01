import React, { useRef, useState } from "react";
import { Upload, FileText, Image, Loader } from "lucide-react";
import { uploadsAPI } from "../../api/uploads.api";

const FileUploadButton = ({ onFileUpload, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10485760) {
      setError("File size must not exceed 10MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("File type not allowed");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadsAPI.uploadFile(file);

      if (response.success) {
        onFileUpload(response.data);
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFileIcon = (type) => {
    if (type?.startsWith("image")) return <Image size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className={`p-2 rounded-lg transition-colors ${
          disabled || uploading
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="Upload file"
      >
        {uploading ? (
          <Loader size={20} className="animate-spin" />
        ) : (
          <Upload size={20} />
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;
