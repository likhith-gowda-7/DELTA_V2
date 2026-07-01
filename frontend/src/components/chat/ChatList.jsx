import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSocketStore } from "../../store/useSocketStore";
import { MessageSquare, Plus } from "lucide-react";
import UnreadBadge from "./UnreadBadge";

export default function ChatList({ onSelectChat, onCreateGroupClick }) {
  const { chats, selectedChat, setSelectedChat, unreadCounts, clearUnread, loading } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const getOtherUserName = (chat) => {
    if (chat.isGroupChat) {
      return chat.name;
    }
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser?.name || "Unknown";
  };

  const getOtherUserAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Group";
    }
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
  };

  const isUserOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return onlineUsers.includes(otherUser?._id);
  };

  const formatLatestMessage = (chat) => {
    if (!chat.latestMessage) return "Start a conversation";
    const isOwnMessage = chat.latestMessage.sender._id === user._id;
    const prefix = isOwnMessage ? "You: " : "";
    const content = chat.latestMessage.content || "📎 File";
    const message = content.substring(0, 30);
    return prefix + message + (content.length > 30 ? "..." : "");
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    clearUnread(chat._id);
    onSelectChat?.(chat);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-2 text-gray-500">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <MessageSquare className="w-12 h-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">No chats yet</h3>
        <p className="mt-2 text-gray-500 text-center">
          Start a conversation by searching for a user above
        </p>
        <button
          onClick={onCreateGroupClick}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateGroupClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>
      <div className="space-y-2 p-2">
        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => handleSelectChat(chat)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              selectedChat?._id === chat._id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={getOtherUserAvatar(chat)}
                  alt={getOtherUserName(chat)}
                  className="w-10 h-10 rounded-full"
                />
                {isUserOnline(chat) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold truncate">{getOtherUserName(chat)}</h4>
                  <UnreadBadge count={unreadCounts[chat._id] || 0} />
                </div>
                <p
                  className={`text-sm truncate ${
                    selectedChat?._id === chat._id
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formatLatestMessage(chat)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
