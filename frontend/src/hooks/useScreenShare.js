import { useEffect, useRef, useState } from "react";

const log = (...args) => {
  if (import.meta.env.DEV) {
    console.log("[ScreenShare]", ...args);
  }
};

/**
 * Custom hook for managing screen sharing with WebRTC
 * Handles getDisplayMedia and track replacement
 */
export const useScreenShare = (localStream) => {
  const screenStreamRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Start screen sharing
   */
  const startScreenShare = async () => {
    try {
      // Get display media (screen or window)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      setIsScreenSharing(true);

      // Store original video track
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          originalVideoTrackRef.current = videoTracks[0];
        }

        // Replace local video track with screen track
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        if (screenVideoTrack && localStream) {
          // This is handled by RTCRtpSender.replaceTrack in the parent component
          // We just emit the event here
          window.dispatchEvent(
            new CustomEvent("screen-share-started", {
              detail: { screenStream, screenVideoTrack },
            }),
          );
        }
      }

      // Listen for screen share stop (user clicked stop in browser UI)
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return screenStream;
    } catch (err) {
      const errorMsg = `Failed to start screen share: ${err.message}`;
      setError(errorMsg);
      log(errorMsg);

      // User cancelled screen capture
      if (err.name === "NotAllowedError") {
        setIsScreenSharing(false);
        return null;
      }

      throw err;
    }
  };

  /**
   * Stop screen sharing
   */
  const stopScreenShare = async () => {
    try {
      // Stop all screen tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Restore original video track
      if (localStream && originalVideoTrackRef.current) {
        window.dispatchEvent(
          new CustomEvent("screen-share-stopped", {
            detail: { originalVideoTrack: originalVideoTrackRef.current },
          }),
        );

        originalVideoTrackRef.current = null;
      }

      setScreenStream(null);
      setIsScreenSharing(false);
    } catch (err) {
      const errorMsg = `Failed to stop screen share: ${err.message}`;
      setError(errorMsg);
      log(errorMsg);
      throw err;
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isScreenSharing) {
        stopScreenShare();
      }
    };
  }, []);

  return {
    isScreenSharing,
    screenStream,
    error,
    startScreenShare,
    stopScreenShare,
  };
};

export default useScreenShare;
