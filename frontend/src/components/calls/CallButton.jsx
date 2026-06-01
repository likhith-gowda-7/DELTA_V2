import React, { useState } from "react";
import { Phone, PhoneOff, Video, Loader } from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useSocketStore } from "../../store/useSocketStore";

const CallButton = ({
  recipientId,
  recipientName = "User",
  disabled = false,
}) => {
  const { initiateCall, currentCall, isCallActive } = useCallStore();
  const { socket } = useSocketStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaType, setMediaType] = useState("audio-video");

  const handleStartCall = async (type) => {
    try {
      setIsLoading(true);
      setShowMenu(false);

      const call = await initiateCall(recipientId, type);

      // Emit socket event to notify recipient
      if (socket && call) {
        socket.emit("initiate_call", {
          recipientId,
          mediaType: type,
          callId: call._id,
        });
      }
    } catch (error) {
      console.error("Error starting call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // If already in a call, show end call button
  if (isCallActive && currentCall) {
    return (
      <button
        disabled={disabled}
        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="End current call"
      >
        <PhoneOff size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Main call button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isLoading}
        className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        title="Start call"
      >
        {isLoading ? (
          <Loader size={20} className="animate-spin" />
        ) : (
          <Phone size={20} />
        )}
      </button>

      {/* Call type menu */}
      {showMenu && !isLoading && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-2 border border-gray-200 dark:border-gray-700">
          {/* Audio Call */}
          <button
            onClick={() => handleStartCall("audio")}
            className="w-full text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <Phone size={18} /> Audio Call
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall("audio-video")}
            className="w-full text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <Video size={18} /> Video Call
          </button>
        </div>
      )}
    </div>
  );
};

export default CallButton;
