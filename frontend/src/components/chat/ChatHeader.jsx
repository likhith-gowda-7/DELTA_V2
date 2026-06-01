import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { ChevronDown, Phone, Video, Search, MoreVertical } from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
import CallButton from "../calls/CallButton";

export default function ChatHeader({ chat, onUpdateGroupClick }) {
  const { user } = useAuthStore();
  const [showOptions, setShowOptions] = useState(false);

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

          {/* Call button (only for 1-to-1 chats) */}
          {!chat.isGroupChat && (
            <CallButton
              recipientId={chat.users.find((u) => u._id !== user._id)?._id}
              recipientName={getHeaderTitle()}
              disabled={false}
            />
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
