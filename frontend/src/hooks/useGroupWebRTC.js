import { useEffect, useRef, useState } from "react";
import { RTC_CONFIG, GROUP_CALL_LIMITS } from "../lib/callConfig.js";

/**
 * Custom hook for managing multiple WebRTC peer connections in group calls.
 * Mesh topology for up to GROUP_CALL_LIMITS.MAX_PARTICIPANTS participants.
 * Past that, an SFU (mediasoup/LiveKit/Daily) is required — see PHASE8_PLANNING.md.
 *
 * Signaling model: instead of `window.dispatchEvent(CustomEvent)` to relay
 * ICE candidates, this hook accepts a `socket` ref. When set, ICE
 * candidates are emitted directly to the peer via socket.
 */
export const useGroupWebRTC = (callId, userId, participantIds = [], socket = null) => {
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [connectionStates, setConnectionStates] = useState(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [connectedPeers, setConnectedPeers] = useState([]);

  // STUN/TURN servers — see frontend/src/lib/callConfig.js
  const iceServers = RTC_CONFIG.iceServers;

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
   * Initialize peer connection for a specific participant
   */
  const initializePeerConnection = async (peerId, isInitiator = false) => {
    try {
      // Check if connection already exists
      if (peerConnectionsRef.current.has(peerId)) {
        return peerConnectionsRef.current.get(peerId);
      }

      const peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add local stream tracks to the peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log(`Remote track received from ${peerId}:`, event.track.kind);
        remoteStreamsRef.current.set(peerId, event.streams[0]);
        setRemoteStreams(new Map(remoteStreamsRef.current));
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `Connection state with ${peerId}:`,
          peerConnection.connectionState,
        );
        setConnectionStates((prev) =>
          new Map(prev).set(peerId, peerConnection.connectionState),
        );

        if (peerConnection.connectionState === "connected") {
          setConnectedPeers((prev) => {
            if (!prev.includes(peerId)) {
              return [...prev, peerId];
            }
            return prev;
          });
        } else if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed"
        ) {
          setConnectedPeers((prev) => prev.filter((p) => p !== peerId));
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          `ICE connection state with ${peerId}:`,
          peerConnection.iceConnectionState,
        );
      };

      // Handle ICE candidates — emit to remote peer via socket
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`ICE candidate for ${peerId}:`, event.candidate);
          if (socket?.current) {
            socket.current.emit("webrtc_ice_candidate", {
              callId,
              otherUserId: peerId,
              candidate: event.candidate,
            });
          }
        }
      };

      peerConnectionsRef.current.set(peerId, peerConnection);
      setConnectionStates((prev) => new Map(prev).set(peerId, "new"));

      return peerConnection;
    } catch (err) {
      const errorMsg = `Failed to initialize peer connection with ${peerId}: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Create offer for a peer
   */
  const createOffer = async (peerId) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(peerId);
      if (!peerConnection) {
        throw new Error(`Peer connection not found for ${peerId}`);
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (err) {
      const errorMsg = `Failed to create offer for ${peerId}: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Create answer for a peer
   */
  const createAnswer = async (peerId) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(peerId);
      if (!peerConnection) {
        throw new Error(`Peer connection not found for ${peerId}`);
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (err) {
      const errorMsg = `Failed to create answer for ${peerId}: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Set remote description for a peer
   */
  const setRemoteDescription = async (peerId, description) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(peerId);
      if (!peerConnection) {
        throw new Error(`Peer connection not found for ${peerId}`);
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(description),
      );
    } catch (err) {
      const errorMsg = `Failed to set remote description for ${peerId}: ${err.message}`;
      setError(errorMsg);
      console.error(errorMsg);
      throw err;
    }
  };

  /**
   * Add ICE candidate for a peer
   */
  const addIceCandidate = async (peerId, candidate) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(peerId);
      if (!peerConnection) {
        console.warn(`Peer connection not found for ${peerId}`);
        return;
      }

      if (candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.warn(`Failed to add ICE candidate for ${peerId}:`, err.message);
    }
  };

  /**
   * Toggle audio for all peers
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
   * Toggle video for all peers
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
   * Remove a participant (close their peer connection)
   */
  const removePeer = (peerId) => {
    const peerConnection = peerConnectionsRef.current.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(peerId);
    }

    remoteStreamsRef.current.delete(peerId);
    setRemoteStreams(new Map(remoteStreamsRef.current));
    setConnectionStates((prev) => {
      const newStates = new Map(prev);
      newStates.delete(peerId);
      return newStates;
    });
    setConnectedPeers((prev) => prev.filter((p) => p !== peerId));
  };

  /**
   * Close all peer connections and cleanup
   */
  const closePeerConnections = () => {
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
    setConnectedPeers([]);
  };

  /**
   * Add new participant to group call
   */
  const addParticipant = async (peerId) => {
    try {
      await initializePeerConnection(peerId, true);
      const offer = await createOffer(peerId);

      // Send offer via socket to the new peer
      if (socket?.current) {
        socket.current.emit("webrtc_offer", {
          callId,
          recipientId: peerId,
          offer,
        });
      }
    } catch (err) {
      console.error(`Failed to add participant ${peerId}:`, err);
      throw err;
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      closePeerConnections();
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    connectionStates,
    audioEnabled,
    videoEnabled,
    error,
    connectedPeers,
    getLocalStream,
    initializePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    removePeer,
    closePeerConnections,
    addParticipant,
  };
};

export default useGroupWebRTC;
