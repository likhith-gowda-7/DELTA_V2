import { useState, useRef, useEffect } from "react";
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
  X,
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
import CallButton from "../calls/CallButton";

export default function ChatHeader({ chat, onUpdateGroupClick }) {
  const { user } = useAuthStore();
  const { deleteChat, removeMemberFromChat, setSelectedChat, setMessages, fetchChats } = useChatStore();
  const { createGroupCall } = useCallStore();
  const { socket } = useSocketStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const optionsRef = useRef(null);
  const callMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
      if (callMenuRef.current && !callMenuRef.current.contains(e.target)) {
        setShowCallMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartGroupCall = async (mediaType) => {
    try {
      setIsStartingCall(true);
      setShowCallMenu(false);

      const participantIds = chat.users
        .filter((u) => u._id !== user._id)
        .map((u) => u._id);

      const call = await createGroupCall(participantIds, chat._id, mediaType);

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

  const handleClearChat = async () => {
    if (!window.confirm("Clear all messages in this chat? Messages will be removed from your view.")) return;
    setShowOptions(false);
    // Clear messages locally (no backend API for clear — just reset local state)
    setMessages([]);
  };

  const handleLeaveChat = async () => {
    if (!chat) return;

    if (chat.isGroupChat) {
      if (!window.confirm(`Leave "${chat.name}"? You won't receive messages from this group anymore.`)) return;
      setShowOptions(false);
      try {
        await removeMemberFromChat(chat._id, user._id);
        setSelectedChat(null);
        await fetchChats();
      } catch (error) {
        console.error("Failed to leave chat:", error);
      }
    } else {
      if (!window.confirm("Delete this conversation? This action cannot be undone.")) return;
      setShowOptions(false);
      try {
        await deleteChat(chat._id);
        setSelectedChat(null);
        await fetchChats();
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  const handleSearchToggle = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery("");
    }
  };

  // Highlight matching messages (scroll to them)
  const handleSearchMessages = (query) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    // Find and scroll to the first matching message
    const messages = document.querySelectorAll(".break-words");
    for (const msg of messages) {
      if (msg.textContent.toLowerCase().includes(query.toLowerCase())) {
        msg.closest("[class*='mb-2']")?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Briefly highlight
        const parent = msg.closest("[class*='rounded-lg']");
        if (parent) {
          parent.style.outline = "2px solid #3b82f6";
          parent.style.outlineOffset = "2px";
          setTimeout(() => {
            parent.style.outline = "";
            parent.style.outlineOffset = "";
          }, 2000);
        }
        break;
      }
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
    chat.isGroupChat && chat.groupAdmins?.some((a) => a._id === user._id);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
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

          {/* Call buttons */}
          {!chat.isGroupChat ? (
            <CallButton
              recipientId={chat.users.find((u) => u._id !== user._id)?._id}
              recipientName={getHeaderTitle()}
              disabled={false}
            />
          ) : (
            <div className="relative" ref={callMenuRef}>
              <button
                onClick={() => setShowCallMenu(!showCallMenu)}
                disabled={isStartingCall}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start group call"
              >
                <Users size={20} />
              </button>

              {showCallMenu && !isStartingCall && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-2 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleStartGroupCall("audio")}
                    className="w-full text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Phone size={18} /> Audio Group Call
                  </button>
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

          {/* Search messages button */}
          <button
            onClick={handleSearchToggle}
            className={`p-2 rounded-lg transition ${
              showSearchBar
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            title="Search messages"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Options menu */}
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 py-2 border border-gray-200 dark:border-gray-600">
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
                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Clear Chat
                </button>
                <button
                  onClick={handleLeaveChat}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {chat.isGroupChat ? "Leave Group" : "Delete Chat"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline search bar */}
      {showSearchBar && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchMessages(e.target.value)}
              placeholder="Search in messages..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearchToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
