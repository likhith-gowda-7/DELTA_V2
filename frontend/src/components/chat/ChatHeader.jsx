import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useCallStore } from "../../store/useCallStore";
import { useSocketStore } from "../../store/useSocketStore";
import {
  ChevronDown,
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
import CallButton from "../calls/CallButton";

export default function ChatHeader({ chat, onUpdateGroupClick }) {
  const { user } = useAuthStore();
  const { createGroupCall } = useCallStore();
  const { socket } = useSocketStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);

  const handleStartGroupCall = async (mediaType) => {
    try {
      setIsStartingCall(true);
      setShowCallMenu(false);

      // Get all participant IDs except current user
      const participantIds = chat.users
        .filter((u) => u._id !== user._id)
        .map((u) => u._id);

      // Create group call
      const call = await createGroupCall(participantIds, chat._id, mediaType);

      // Emit socket event to notify participants
      if (socket && call) {
        socket.emit("group_call_initiated", {
          callId: call._id,
          initiatorId: user._id,
          participantIds,
          mediaType,
          chatId: chat._id,
        });
      }

      setIsStartingCall(false);
    } catch (error) {
      console.error("Error starting group call:", error);
      setIsStartingCall(false);
    }
  };

  if (!chat) {
    return null;
  }

  const getHeaderTitle = () => {
    if (chat.isGroupChat) {
      return chat.name;
    }
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser?.name || "Unknown";
  };

  const getHeaderSubtitle = () => {
    if (chat.isGroupChat) {
      return `${chat.users.length} members`;
    }
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser?.isOnline ? "Active now" : "Offline";
  };

  const getHeaderAvatar = () => {
    if (chat.isGroupChat) {
      return (
        chat.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Group"
      );
    }
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return (
      otherUser?.avatar ||
      "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
    );
  };

  const isUserAdmin =
    chat.isGroupChat && chat.groupAdmins.some((a) => a._id === user._id);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={getHeaderAvatar()}
            alt={getHeaderTitle()}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {getHeaderTitle()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* Call buttons (audio/video for 1-to-1, group calls for groups) */}
          {!chat.isGroupChat ? (
            <CallButton
              recipientId={chat.users.find((u) => u._id !== user._id)?._id}
              recipientName={getHeaderTitle()}
              disabled={false}
            />
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCallMenu(!showCallMenu)}
                disabled={isStartingCall}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start group call"
              >
                <Users size={20} />
              </button>

              {/* Group call menu */}
              {showCallMenu && !isStartingCall && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-2 border border-gray-200 dark:border-gray-700">
                  {/* Audio Group Call */}
                  <button
                    onClick={() => handleStartGroupCall("audio")}
                    className="w-full text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Phone size={18} /> Audio Group Call
                  </button>

                  {/* Video Group Call */}
                  <button
                    onClick={() => handleStartGroupCall("audio-video")}
                    className="w-full text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Video size={18} /> Video Group Call
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 py-2">
                {chat.isGroupChat && isUserAdmin && (
                  <>
                    <button
                      onClick={() => {
                        onUpdateGroupClick?.();
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Edit Group
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  </>
                )}
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Clear Chat
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                  Leave Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
