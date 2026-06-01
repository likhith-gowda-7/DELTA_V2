import { useEffect, useRef, useState } from "react";
import logger from "../lib/logger.js";

/**
 * Custom hook for managing WebRTC peer connections
 */
export const useWebRTC = (callId, isInitiator = false) => {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [iceConnectionState, setIceConnectionState] = useState("new");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState(null);

  // STUN servers for NAT traversal
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  /**
   * Get local media stream (audio/video)
   */
  const getLocalStream = async (
    constraints = { audio: true, video: { width: 640, height: 480 } },
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      const errorMsg = `Failed to get media: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Initialize RTCPeerConnection
   */
  const initializePeerConnection = async () => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers,
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
        setConnectionState(peerConnection.connectionState);
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
        setIceConnectionState(peerConnection.iceConnectionState);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate:", event.candidate);
          // Emit to parent for sending to remote peer
          window.dispatchEvent(
            new CustomEvent("ice-candidate", {
              detail: { candidate: event.candidate, callId },
            }),
          );
        }
      };

      return peerConnection;
    } catch (err) {
      const errorMsg = `Failed to initialize peer connection: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Create WebRTC offer
   */
  const createOffer = async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      return offer;
    } catch (err) {
      const errorMsg = `Failed to create offer: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Create WebRTC answer
   */
  const createAnswer = async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      return answer;
    } catch (err) {
      const errorMsg = `Failed to create answer: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Set remote description (offer or answer)
   */
  const setRemoteDescription = async (description) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(description),
      );
    } catch (err) {
      const errorMsg = `Failed to set remote description: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Add ICE candidate
   */
  const addIceCandidate = async (candidate) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error("Peer connection not initialized");
      }

      if (candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      }
    } catch (err) {
      console.warn("Failed to add ICE candidate:", err.message);
      // Don't throw - ICE candidate errors shouldn't break the connection
    }
  };

  /**
   * Toggle audio
   */
  const toggleAudio = (enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      setAudioEnabled(enabled);
    }
  };

  /**
   * Toggle video
   */
  const toggleVideo = (enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      setVideoEnabled(enabled);
    }
  };

  /**
   * Close peer connection and cleanup
   */
  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
    setIceConnectionState("closed");
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      closePeerConnection();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    audioEnabled,
    videoEnabled,
    error,
    getLocalStream,
    initializePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    closePeerConnection,
  };
};

export default useWebRTC;
