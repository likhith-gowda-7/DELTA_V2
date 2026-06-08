import { create } from "zustand";
import { callsAPI } from "../api/calls.api";

export const useCallStore = create((set, get) => ({
  // State
  currentCall: null,
  incomingCall: null,
  callHistory: [],
  activeCalls: [],
  missedCalls: [],
  isCallActive: false,
  callStats: null,
  loading: false,
  loadingHistory: false,
  error: null,

  // Initiator ID for incoming calls
  initiatorId: null,
  mediaType: "audio-video",
  callDuration: 0,
  callStartTime: null,

  // Group call state
  isGroupCall: false,
  groupCallParticipants: [],
  participantDetails: [],
  screenShareParticipants: [],
  isScreenSharing: false,
  isRecording: false,
  recordingUrl: null,
  callMetrics: {},

  // Actions
  initiateCall: async (recipientId, mediaType = "audio-video") => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.initiateCall(recipientId, mediaType);
      set({
        currentCall: call,
        isCallActive: true,
        mediaType,
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to initiate call",
        loading: false,
      });
      throw error;
    }
  },

  acceptCall: async (callId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.acceptCall(callId);
      set({
        currentCall: call,
        incomingCall: null,
        isCallActive: true,
        callStartTime: new Date(),
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to accept call",
        loading: false,
      });
      throw error;
    }
  },

  rejectCall: async (callId, reason = "declined") => {
    try {
      set({ loading: true, error: null });
      await callsAPI.rejectCall(callId, reason);
      set({
        incomingCall: null,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.message || "Failed to reject call",
        loading: false,
      });
      throw error;
    }
  },

  endCall: async (callId, duration = null) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.endCall(callId, duration);
      set({
        currentCall: null,
        isCallActive: false,
        callDuration: 0,
        callStartTime: null,
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to end call",
        loading: false,
      });
      throw error;
    }
  },

  setIncomingCall: (call) => {
    set({
      incomingCall: call,
      initiatorId: call?.initiatorId,
      mediaType: call?.mediaType || "audio-video",
    });
  },

  clearIncomingCall: () => {
    set({ incomingCall: null });
  },

  setCurrentCall: (call) => {
    set({ currentCall: call });
  },

  clearCurrentCall: () => {
    set({
      currentCall: null,
      isCallActive: false,
      callDuration: 0,
      callStartTime: null,
    });
  },

  fetchCallHistory: async (page = 1, limit = 20) => {
    try {
      set({ loadingHistory: true, error: null });
      const result = await callsAPI.getCallHistory(page, limit);
      set({
        callHistory: result.calls,
        loadingHistory: false,
      });
      return result;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch call history",
        loadingHistory: false,
      });
      throw error;
    }
  },

  fetchMissedCalls: async () => {
    try {
      set({ loading: true, error: null });
      const result = await callsAPI.getMissedCalls();
      set({
        missedCalls: result.data || [],
        loading: false,
      });
      return result;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch missed calls",
        loading: false,
      });
      throw error;
    }
  },

  fetchActiveCalls: async () => {
    try {
      const result = await callsAPI.getActiveCalls();
      set({ activeCalls: result.data || [] });
      return result;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch active calls",
      });
      throw error;
    }
  },

  fetchCallStats: async () => {
    try {
      const stats = await callsAPI.getCallStats();
      set({ callStats: stats });
      return stats;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch call statistics",
      });
      throw error;
    }
  },

  updateCallMetadata: async (callId, metadata) => {
    try {
      const call = await callsAPI.updateCallMetadata(callId, metadata);
      set({ currentCall: call });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to update call metadata",
      });
      throw error;
    }
  },

  setCallDuration: (duration) => {
    set({ callDuration: duration });
  },

  setCallStartTime: (time) => {
    set({ callStartTime: time });
  },

  clearError: () => {
    set({ error: null });
  },

  // Group call actions
  createGroupCall: async (
    participantIds,
    chatId,
    mediaType = "audio-video",
  ) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.createGroupCall(
        participantIds,
        chatId,
        mediaType,
      );
      set({
        currentCall: call,
        isCallActive: true,
        isGroupCall: true,
        groupCallParticipants: call.participants || [],
        participantDetails: call.participantDetails || [],
        mediaType,
        callStartTime: new Date(),
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to create group call",
        loading: false,
      });
      throw error;
    }
  },

  addParticipant: async (callId, userId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.addParticipant(callId, userId);
      set({
        currentCall: call,
        groupCallParticipants: call.participants || [],
        participantDetails: call.participantDetails || [],
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to add participant",
        loading: false,
      });
      throw error;
    }
  },

  removeParticipant: async (callId, userId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.removeParticipant(callId, userId);
      set({
        currentCall: call,
        groupCallParticipants: call.participants || [],
        participantDetails: call.participantDetails || [],
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to remove participant",
        loading: false,
      });
      throw error;
    }
  },

  startScreenShare: async (callId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.startScreenShare(callId);
      set({
        currentCall: call,
        isScreenSharing: true,
        screenShareParticipants: call.screenShareParticipants || [],
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to start screen sharing",
        loading: false,
      });
      throw error;
    }
  },

  stopScreenShare: async (callId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.stopScreenShare(callId);
      set({
        currentCall: call,
        isScreenSharing: false,
        screenShareParticipants: call.screenShareParticipants || [],
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to stop screen sharing",
        loading: false,
      });
      throw error;
    }
  },

  startRecording: async (callId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.startRecording(callId);
      set({
        currentCall: call,
        isRecording: true,
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to start recording",
        loading: false,
      });
      throw error;
    }
  },

  stopRecording: async (callId, recordingUrl = null) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.stopRecording(callId, recordingUrl);
      set({
        currentCall: call,
        isRecording: false,
        recordingUrl: call.recordingUrl || recordingUrl,
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to stop recording",
        loading: false,
      });
      throw error;
    }
  },

  getGroupCallDetails: async (callId) => {
    try {
      set({ loading: true, error: null });
      const call = await callsAPI.getGroupCallDetails(callId);
      set({
        currentCall: call,
        isGroupCall: call.isGroupCall || false,
        groupCallParticipants: call.participants || [],
        participantDetails: call.participantDetails || [],
        screenShareParticipants: call.screenShareParticipants || [],
        loading: false,
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to fetch group call details",
        loading: false,
      });
      throw error;
    }
  },

  updateParticipantQuality: async (callId, qualityMetrics) => {
    try {
      const call = await callsAPI.updateParticipantQuality(
        callId,
        qualityMetrics,
      );
      set({
        currentCall: call,
        callMetrics: {
          ...get().callMetrics,
          ...qualityMetrics,
        },
      });
      return call;
    } catch (error) {
      set({
        error: error.message || "Failed to update participant quality",
      });
      throw error;
    }
  },

  setGroupCallParticipants: (participants) => {
    set({ groupCallParticipants: participants });
  },

  setParticipantDetails: (details) => {
    set({ participantDetails: details });
  },

  setScreenShareParticipants: (participants) => {
    set({ screenShareParticipants: participants });
  },

  resetGroupCallState: () => {
    set({
      isGroupCall: false,
      groupCallParticipants: [],
      participantDetails: [],
      screenShareParticipants: [],
      isScreenSharing: false,
      isRecording: false,
      recordingUrl: null,
      callMetrics: {},
    });
  },
}));
