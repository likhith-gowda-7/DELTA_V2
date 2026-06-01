import React, { useEffect, useRef, useState } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  Settings,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useSocketStore } from "../../store/useSocketStore";
import useWebRTC from "../../hooks/useWebRTC";

const CallWindow = ({ callId, isInitiator = false, remoteUserId = null }) => {
  const { currentCall, endCall, updateCallMetadata } = useCallStore();
  const { socket } = useSocketStore();
  const {
    localStream,
    remoteStream,
    audioEnabled,
    videoEnabled,
    connectionState,
    iceConnectionState,
    getLocalStream,
    initializePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    closePeerConnection,
  } = useWebRTC(callId, isInitiator);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const callTimerRef = useRef(null);

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get local stream
        await getLocalStream({
          audio: true,
          video: { width: 640, height: 480 },
        });

        // Initialize peer connection
        await initializePeerConnection();

        // Create and send offer if initiator
        if (isInitiator) {
          const offer = await createOffer();
          if (socket) {
            socket.emit("webrtc_offer", {
              callId,
              recipientId: remoteUserId,
              offer,
            });
          }
        }
      } catch (error) {
        console.error("Error initializing call:", error);
      }
    };

    if (!localStream) {
      initializeCall();
    }
  }, []);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Start call timer
  useEffect(() => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  // Handle incoming WebRTC offer
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data) => {
      if (data.callId === callId) {
        try {
          await setRemoteDescription(data.offer);
          const answer = await createAnswer();
          socket.emit("webrtc_answer", {
            callId,
            initiatorId: remoteUserId,
            answer,
          });
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      }
    };

    const handleAnswer = async (data) => {
      if (data.callId === callId) {
        try {
          await setRemoteDescription(data.answer);
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (data.callId === callId) {
        try {
          await addIceCandidate(data.candidate);
        } catch (error) {
          console.warn("Error adding ICE candidate:", error);
        }
      }
    };

    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
    };
  }, [socket, callId]);

  // Handle ICE candidates from local peer
  useEffect(() => {
    const handleIceCandidate = (event) => {
      if (event.detail.callId === callId && socket) {
        socket.emit("webrtc_ice_candidate", {
          callId,
          otherUserId: remoteUserId,
          candidate: event.detail.candidate,
        });
      }
    };

    window.addEventListener("ice-candidate", handleIceCandidate);
    return () => {
      window.removeEventListener("ice-candidate", handleIceCandidate);
    };
  }, [callId, socket]);

  const handleEndCall = async () => {
    try {
      await endCall(callId, callDuration);

      if (socket && remoteUserId) {
        socket.emit("call_ended", {
          callId,
          otherUserId: remoteUserId,
          duration: callDuration,
        });
      }

      closePeerConnection();
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`${
        isPiP
          ? "fixed bottom-4 right-4 w-80 h-60 rounded-lg shadow-2xl"
          : "flex-1 flex flex-col h-screen"
      } bg-black relative`}
    >
      {/* Remote Video (main) */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">📞</span>
              </div>
              <p className="text-white text-lg">Connecting...</p>
              <p className="text-gray-400 text-sm mt-2">
                Connection: {connectionState} | ICE: {iceConnectionState}
              </p>
            </div>
          </div>
        )}

        {/* Call Duration */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg font-mono text-lg">
          {formatDuration(callDuration)}
        </div>

        {/* Connection Status */}
        {(connectionState === "connecting" ||
          iceConnectionState === "checking") && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Connecting...
          </div>
        )}

        {(connectionState === "failed" || iceConnectionState === "failed") && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm">
            Connection Failed
          </div>
        )}
      </div>

      {/* Local Video (PiP) */}
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <span className="text-xl">📷</span>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-4 flex items-center justify-center gap-4">
        {/* Mute Audio */}
        <button
          onClick={() => toggleAudio(!audioEnabled)}
          className={`p-3 rounded-full transition-colors ${
            audioEnabled
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Toggle Video */}
        <button
          onClick={() => toggleVideo(!videoEnabled)}
          className={`p-3 rounded-full transition-colors ${
            videoEnabled
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          title={videoEnabled ? "Stop Video" : "Start Video"}
        >
          {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End call"
        >
          <PhoneOff size={20} />
        </button>

        {/* PiP Toggle */}
        <button
          onClick={() => setIsPiP(!isPiP)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Toggle picture-in-picture"
        >
          {isPiP ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>

        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Show call stats"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Call Stats */}
      {showStats && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 text-white text-xs space-y-1 max-h-40 overflow-y-auto">
          <div>Connection: {connectionState}</div>
          <div>ICE Connection: {iceConnectionState}</div>
          <div>Audio: {audioEnabled ? "ON" : "OFF"}</div>
          <div>Video: {videoEnabled ? "ON" : "OFF"}</div>
          <div>Duration: {formatDuration(callDuration)}</div>
        </div>
      )}
    </div>
  );
};

export default CallWindow;
