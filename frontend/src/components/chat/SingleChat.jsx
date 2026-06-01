import { useState, useEffect, useRef } from "react";
import { MessageSquare, Loader, Send, X } from "lucide-react";
import ChatHeader from "./ChatHeader";
import FileUploadButton from "./FileUploadButton";
import FilePreview from "./FilePreview";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSocketStore } from "../../store/useSocketStore";
import { messagesAPI } from "../../api/messages.api.js";
import { useFileUpload } from "../../hooks/useFileUpload";

export default function SingleChat({ chat, onUpdateGroupClick }) {
  const { user } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    loadingMessages,
    setLoadingMessages,
  } = useChatStore();
  const { socket } = useSocketStore();
  const { uploadFile } = useFileUpload();
  const [messageInput, setMessageInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch messages when chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat?._id) return;

      setLoadingMessages(true);
      try {
        const data = await messagesAPI.getMessages(chat._id, 0, 50);
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [chat?._id]);

  // Join chat room when chat changes
  useEffect(() => {
    if (!socket || !chat?._id) return;

    socket.emit("join_room", chat._id);

    return () => {
      socket.emit("leave_room", chat._id);
    };
  }, [socket, chat?._id]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !chat?._id) return;

    socket.emit("typing", chat._id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", chat._id);
    }, 2000);
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    try {
      const result = await uploadFile(file);
      setUploadedFile(result);
    } catch (error) {
      console.error("File upload failed:", error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !uploadedFile) || !socket || !chat?._id)
      return;

    const content = messageInput.trim() || (uploadedFile ? "📎 File" : "");

    try {
      // Prepare message data
      const messagePayload = {
        content,
      };

      // Add file info if attached
      if (uploadedFile) {
        messagePayload.fileUrl = uploadedFile.url;
        messagePayload.fileType = uploadedFile.fileType;
        messagePayload.fileName = uploadedFile.fileName;
        messagePayload.fileSize = uploadedFile.fileSize;
      }

      // Send via HTTP API
      const response = await messagesAPI.sendMessage(chat._id, messagePayload);
      const messageData = response;

      // Emit socket event for real-time delivery
      socket.emit("send_message", {
        chatId: chat._id,
        content: messageData.content,
        messageId: messageData._id,
        fileUrl: messageData.fileUrl,
        fileType: messageData.fileType,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        sender: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      });

      // Clear input and uploaded file
      setMessageInput("");
      setUploadedFile(null);

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("stop_typing", chat._id);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date
  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  // Check if message is from current user
  const isOwnMessage = (senderId) => senderId === user?._id;

  // Get other user name (for 1-to-1 chats)
  const getOtherUserName = () => {
    if (chat.isGroupChat) return null;
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser?.name;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-lg text-gray-500">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <ChatHeader chat={chat} onUpdateGroupClick={onUpdateGroupClick} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {loadingMessages && (
          <div className="flex justify-center items-center h-full">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {!loadingMessages && (!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p>
              {chat.isGroupChat
                ? `Start the conversation in ${chat.name}`
                : `Start a conversation with ${getOtherUserName()}`}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages &&
          messages.map((message, index) => {
            const showDate =
              index === 0 ||
              formatDate(messages[index - 1]?.createdAt) !==
                formatDate(message.createdAt);

            return (
              <div key={message._id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-300 dark:bg-gray-700 h-px flex-1"></div>
                    <span className="px-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(message.createdAt)}
                    </span>
                    <div className="bg-gray-300 dark:bg-gray-700 h-px flex-1"></div>
                  </div>
                )}

                <div
                  className={`flex ${
                    isOwnMessage(message.sender._id)
                      ? "justify-end"
                      : "justify-start"
                  } mb-2`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage(message.sender._id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {chat.isGroupChat && !isOwnMessage(message.sender._id) && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.sender.name}
                      </p>
                    )}

                    {/* File preview if attached */}
                    {message.fileUrl && (
                      <div className="mb-2">
                        <FilePreview
                          file={{
                            url: message.fileUrl,
                            fileType: message.fileType,
                            fileName: message.fileName,
                            fileSize: message.fileSize,
                          }}
                        />
                      </div>
                    )}

                    {/* Message content */}
                    {message.content && message.content !== "📎 File" && (
                      <p className="break-words">{message.content}</p>
                    )}

                    {message.isDeleted && (
                      <p className="text-xs italic opacity-75">
                        This message was deleted
                      </p>
                    )}
                    <div
                      className={`text-xs mt-1 flex items-center justify-between gap-2 ${
                        isOwnMessage(message.sender._id)
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {message.editedAt && (
                        <span className="italic">(edited)</span>
                      )}
                      {isOwnMessage(message.sender._id) && (
                        <span className="text-xs">
                          {message.readBy?.length > 1 ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing`
                : `${typingUsers.length} people are typing`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        {/* Uploaded file preview */}
        {uploadedFile && (
          <div className="mb-3 flex items-start justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <FilePreview file={uploadedFile} />
            <button
              onClick={() => setUploadedFile(null)}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <FileUploadButton onFileUpload={handleFileUpload} disabled={false} />
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() && !uploadedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
