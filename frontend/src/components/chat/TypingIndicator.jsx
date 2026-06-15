import { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";

/**
 * Animated typing indicator that shows when other users are typing.
 * Displays: "User is typing..." or "User1, User2 are typing..."
 *
 * @param {string} chatId - The chat room to track typing for
 * @param {object[]} chatUsers - Array of user objects in the chat (for name lookup)
 * @param {string} currentUserId - Current user's ID (to exclude from display)
 */
export default function TypingIndicator({ chatId, chatUsers = [], currentUserId }) {
  const [typingNames, setTypingNames] = useState([]);
  const typingUsers = useChatStore((state) => state.typingUsers);

  useEffect(() => {
    if (!chatId || !typingUsers?.[chatId]) {
      setTypingNames([]);
      return;
    }

    const chatTyping = typingUsers[chatId];
    const now = Date.now();
    const TYPING_TIMEOUT = 5000; // 5 seconds

    // Filter out stale entries and the current user
    const activeTypers = Object.entries(chatTyping)
      .filter(
        ([userId, timestamp]) =>
          userId !== currentUserId && now - timestamp < TYPING_TIMEOUT
      )
      .map(([userId]) => {
        const user = chatUsers.find((u) => u._id === userId);
        return user?.name || "Someone";
      });

    setTypingNames(activeTypers);

    // Clean up stale typing entries periodically
    if (activeTypers.length > 0) {
      const interval = setInterval(() => {
        const currentChatTyping = useChatStore.getState().typingUsers?.[chatId];
        if (!currentChatTyping) return;

        const nowInner = Date.now();
        const hasStale = Object.values(currentChatTyping).some(
          (ts) => nowInner - ts >= TYPING_TIMEOUT
        );

        if (hasStale) {
          useChatStore.setState((state) => {
            const updated = { ...(state.typingUsers || {}) };
            if (updated[chatId]) {
              const cleaned = {};
              for (const [uid, ts] of Object.entries(updated[chatId])) {
                if (nowInner - ts < TYPING_TIMEOUT) {
                  cleaned[uid] = ts;
                }
              }
              updated[chatId] = cleaned;
            }
            return { typingUsers: updated };
          });
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [chatId, typingUsers, chatUsers, currentUserId]);

  if (typingNames.length === 0) return null;

  const text =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : typingNames.length === 2
        ? `${typingNames[0]} and ${typingNames[1]} are typing`
        : `${typingNames[0]} and ${typingNames.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-gray-500 dark:text-gray-400">
      {/* Animated dots */}
      <div className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="italic">{text}</span>
    </div>
  );
}
