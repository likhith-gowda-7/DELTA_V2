import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useSocketStore } from "../../store/useSocketStore";

const CallNotification = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  const { socket } = useSocketStore();
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      setRinging(true);

      // Play ringing sound (if audio element exists)
      const ringtone = document.getElementById("ringtone");
      if (ringtone) {
        ringtone
          .play()
          .catch((err) => console.log("Ringtone play failed:", err));
      }

      // Auto-reject after 30 seconds (no answer)
      const timeout = setTimeout(() => {
        handleReject("no_answer");
      }, 30000);

      return () => {
        clearTimeout(timeout);
        if (ringtone) {
          ringtone.pause();
          ringtone.currentTime = 0;
        }
      };
    }
  }, [incomingCall]);

  const handleAccept = async () => {
    try {
      setRinging(false);
      const ringtone = document.getElementById("ringtone");
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }

      await acceptCall(incomingCall._id);

      // Notify initiator via Socket
      if (socket && incomingCall.initiatorId) {
        socket.emit("call_accepted", {
          callId: incomingCall._id,
          initiatorId: incomingCall.initiatorId,
        });
      }
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const handleReject = async (reason = "declined") => {
    try {
      setRinging(false);
      const ringtone = document.getElementById("ringtone");
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }

      await rejectCall(incomingCall._id, reason);

      // Notify initiator via Socket
      if (socket && incomingCall.initiatorId) {
        socket.emit("call_rejected", {
          callId: incomingCall._id,
          initiatorId: incomingCall.initiatorId,
          reason,
        });
      }
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  if (!incomingCall) {
    return null;
  }

  const getInitiatorName = () => {
    if (incomingCall.initiator?.name) {
      return incomingCall.initiator.name;
    }
    return "Unknown Caller";
  };

  const getInitiatorAvatar = () => {
    if (incomingCall.initiator?.avatar) {
      return incomingCall.initiator.avatar;
    }
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=Caller";
  };

  return (
    <>
      {/* Hidden ringtone audio */}
      <audio id="ringtone" loop style={{ display: "none" }}>
        <source src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
      </audio>

      {/* Full-screen call notification */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          {/* Caller Info */}
          <div className="text-center mb-8">
            <img
              src={getInitiatorAvatar()}
              alt="Caller"
              className={`w-24 h-24 rounded-full mx-auto mb-4 object-cover ${
                ringing ? "animate-pulse" : ""
              }`}
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              {getInitiatorName()}
            </h2>
            <p className="text-blue-200 text-sm">
              {incomingCall.mediaType === "video" ? (
                <span className="flex items-center justify-center gap-2">
                  <Video size={16} /> Incoming video call
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Phone size={16} /> Incoming audio call
                </span>
              )}
            </p>
          </div>

          {/* Ringing animation */}
          {ringing && (
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Accept Button */}
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors w-16 h-16"
              title="Accept call"
            >
              <Phone size={24} />
            </button>

            {/* Reject Button */}
            <button
              onClick={() => handleReject("declined")}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-colors w-16 h-16"
              title="Reject call"
            >
              <PhoneOff size={24} />
            </button>
          </div>

          {/* Timer */}
          <p className="text-center text-blue-300 text-xs mt-6">
            Call will end in 30 seconds if not answered
          </p>
        </div>
      </div>
    </>
  );
};

export default CallNotification;
