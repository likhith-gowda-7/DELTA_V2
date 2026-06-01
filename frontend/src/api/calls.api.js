import apiClient from "./client";

export const callsAPI = {
  // Initiate a new call
  initiateCall: async (recipientId, mediaType = "audio-video") => {
    const response = await apiClient.post("/calls/initiate", {
      recipientId,
      mediaType,
    });
    return response.data.data;
  },

  // Accept an incoming call
  acceptCall: async (callId) => {
    const response = await apiClient.put(`/calls/${callId}/accept`);
    return response.data.data;
  },

  // Reject an incoming call
  rejectCall: async (callId, reason = "declined") => {
    const response = await apiClient.put(`/calls/${callId}/reject`, {
      reason,
    });
    return response.data;
  },

  // End an ongoing call
  endCall: async (callId, duration = null) => {
    const response = await apiClient.put(`/calls/${callId}/end`, {
      duration,
    });
    return response.data.data;
  },

  // Get call details
  getCall: async (callId) => {
    const response = await apiClient.get(`/calls/${callId}`);
    return response.data.data;
  },

  // Get call history (paginated)
  getCallHistory: async (page = 1, limit = 20) => {
    const response = await apiClient.get("/calls", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get missed calls
  getMissedCalls: async () => {
    const response = await apiClient.get("/calls/missed");
    return response.data;
  },

  // Get active calls
  getActiveCalls: async () => {
    const response = await apiClient.get("/calls/active");
    return response.data;
  },

  // Update call metadata
  updateCallMetadata: async (callId, metadata) => {
    const response = await apiClient.put(`/calls/${callId}/metadata`, metadata);
    return response.data.data;
  },

  // Get call statistics
  getCallStats: async () => {
    const response = await apiClient.get("/calls/stats");
    return response.data.data;
  },
};
