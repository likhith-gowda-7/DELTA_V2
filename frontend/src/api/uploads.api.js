import apiClient from "./client";

export const uploadsAPI = {
  // Upload file to Cloudinary via backend
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/uploads/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
