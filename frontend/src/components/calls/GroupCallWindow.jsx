import React, { useState, useEffect } from "react";
import {
  Phone,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  StopCircle,
  Circle,
  Users,
  X,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useSocketStore } from "../../store/useSocketStore";
import useGroupWebRTC from "../../hooks/useGroupWebRTC";
import ParticipantGrid from "./ParticipantGrid";
import AddParticipantModal from "../modals/AddParticipantModal";

/**
 * Main component for group call interface
 * Displays video grid, controls, and participant management
 */
const GroupCallWindow = ({ callId, participants = [] }) => {
  const {
    currentCall,
    isScreenSharing,
    isRecording,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    endCall,
  } = useCallStore();

  const { socket } = useSocketStore();

  // Get user ID from currentCall or sessionStorage
  const userId =
    currentCall?.initiatorId || JSON.parse(localStorage.getItem("user"))._id;

  // WebRTC hook for group calls
  const {
    localStream,
    remoteStreams,
    connectionStates,
    audioEnabled: webrtcAudioEnabled,
    videoEnabled: webrtcVideoEnabled,
    connectedPeers,
    getLocalStream,
    initializePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    closePeerConnections,
    addParticipant: addParticipantPeer,
  } = useGroupWebRTC(callId, userId, participants);

  const [callDuration, setCallDuration] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize local stream and peer connections
  useEffect(() => {
    const initializeCall = async () => {
      try {
        setLoading(true);
        // Get local stream
        await getLocalStream();

        // Initialize peer connections for all participants
        for (const participantId of participants) {
          if (participantId !== userId) {
            await initializePeerConnection(participantId, true);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize call:", err);
        setLoading(false);
      }
    };

    initializeCall();

    return () => {
      closePeerConnections();
    };
  }, [callId, participants, userId]);

  // Update call duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for WebRTC signaling events
  useEffect(() => {
    if (!socket) return;

    // Handle offers from other peers
    socket.on("group_webrtc_offer", async (data) => {
      const { peerId, offer } = data;
      try {
        await initializePeerConnection(peerId, false);
        await setRemoteDescription(peerId, offer);
        const answer = await createAnswer(peerId);
        socket.emit("group_webrtc_answer", {
          callId,
          peerId,
          answer,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    // Handle answers from other peers
    socket.on("group_webrtc_answer", async (data) => {
      const { peerId, answer } = data;
      try {
        await setRemoteDescription(peerId, answer);
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    // Handle ICE candidates
    socket.on("group_webrtc_ice_candidate", async (data) => {
      const { peerId, candidate } = data;
      try {
        await addIceCandidate(peerId, candidate);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("group_webrtc_offer");
      socket.off("group_webrtc_answer");
      socket.off("group_webrtc_ice_candidate");
    };
  }, [socket, callId]);

  // Handle audio toggle
  const handleToggleAudio = () => {
    toggleAudio(!webrtcAudioEnabled);
  };

  // Handle video toggle
  const handleToggleVideo = () => {
    toggleVideo(!webrtcVideoEnabled);
  };

  // Handle screen share
  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare(callId);
        socket?.emit("screen_share_stopped", {
          callId,
          participantIds: participants,
        });
      } else {
        await startScreenShare(callId);
        socket?.emit("screen_share_started", {
          callId,
          participantIds: participants,
        });
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  // Handle recording
  const handleRecording = async () => {
    try {
      if (isRecording) {
        await stopRecording(callId);
        socket?.emit("recording_stopped", {
          callId,
          participantIds: participants,
        });
      } else {
        await startRecording(callId);
        socket?.emit("recording_started", {
          callId,
          participantIds: participants,
        });
      }
    } catch (err) {
      console.error("Error toggling recording:", err);
    }
  };

  // Handle end call
  const handleEndCall = async () => {
    try {
      await endCall(callId, callDuration);
      closePeerConnections();
      socket?.emit("call_ended", {
        callId,
        participantIds: participants,
        duration: callDuration,
      });
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-white">Initializing group call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Group Call</h2>
          <span className="text-gray-300">
            {connectedPeers.length} connected
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono text-gray-300">
            {formatDuration(callDuration)}
          </span>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-gray-300 hover:text-white"
          >
            {showStats ? "Hide" : "Stats"}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-auto bg-black p-4">
        <ParticipantGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          connectionStates={connectionStates}
          showStats={showStats}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-gray-800 px-6 py-4">
        {/* Audio Toggle */}
        <button
          onClick={handleToggleAudio}
          className={`flex items-center gap-2 rounded-full p-3 transition ${
            webrtcAudioEnabled
              ? "bg-gray-600 hover:bg-gray-500 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          title={webrtcAudioEnabled ? "Mute" : "Unmute"}
        >
          {webrtcAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={handleToggleVideo}
          className={`flex items-center gap-2 rounded-full p-3 transition ${
            webrtcVideoEnabled
              ? "bg-gray-600 hover:bg-gray-500 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          title={webrtcVideoEnabled ? "Stop Video" : "Start Video"}
        >
          {webrtcVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={handleScreenShare}
          className={`flex items-center gap-2 rounded-full p-3 transition ${
            isScreenSharing
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <Share2 size={24} />
        </button>

        {/* Recording */}
        <button
          onClick={handleRecording}
          className={`flex items-center gap-2 rounded-full p-3 transition ${
            isRecording
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          }`}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? <StopCircle size={24} /> : <Circle size={24} />}
        </button>

        {/* Add Participant */}
        <button
          onClick={() => setShowAddParticipant(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 p-3 hover:bg-blue-700 text-white transition"
          title="Add Participant"
        >
          <Users size={24} />
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 rounded-full bg-red-600 p-3 hover:bg-red-700 text-white transition"
          title="End Call"
        >
          <Phone size={24} />
        </button>
      </div>

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <AddParticipantModal
          callId={callId}
          currentParticipants={participants}
          onClose={() => setShowAddParticipant(false)}
          onAdd={addParticipantPeer}
        />
      )}
    </div>
  );
};

export default GroupCallWindow;
