import React from "react";
import { Download, File, Image as ImageIcon } from "lucide-react";

const FilePreview = ({ file }) => {
  if (!file || !file.url) return null;

  const isImage = file.fileType?.startsWith("image/");
  const isPdf = file.fileType === "application/pdf";
  const isDoc =
    file.fileType === "application/msword" ||
    file.fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Image preview
  if (isImage) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <img
          src={file.url}
          alt={file.fileName || "Image"}
          className="max-w-xs max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
        />
      </a>
    );
  }

  // Document preview
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {isPdf ? (
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
          <span className="text-red-600 dark:text-red-400 font-bold text-sm">
            PDF
          </span>
        </div>
      ) : isDoc ? (
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
          <File size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
          <File size={20} className="text-gray-600 dark:text-gray-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.fileName || "Document"}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatFileSize(file.fileSize)}
        </p>
      </div>

      <Download
        size={16}
        className="flex-shrink-0 text-gray-600 dark:text-gray-400"
      />
    </a>
  );
};

export default FilePreview;
