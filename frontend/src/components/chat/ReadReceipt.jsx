import { Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * Read receipt checkmarks for a message.
 *
 * - Single grey check  = sent (no one else has read it)
 * - Double grey checks = delivered (default for others' messages)
 * - Double blue checks = read by at least one other user
 *
 * Only shown for messages sent by the current user.
 *
 * @param {{ readBy: Array, chatUsers: Array }} props
 */
export default function ReadReceipt({ readBy = [], chatUsers = [] }) {
  const { user } = useAuthStore();

  // Count how many OTHER users have read this message
  const othersWhoRead = readBy.filter(
    (r) => (r.user?._id || r.user)?.toString() !== user?._id
  );

  const totalOtherUsers = chatUsers.filter((u) => u._id !== user?._id).length;
  const allRead = totalOtherUsers > 0 && othersWhoRead.length >= totalOtherUsers;

  if (othersWhoRead.length === 0) {
    // Sent but not read by anyone else
    return <Check className="w-4 h-4 text-gray-400 inline-block ml-1 flex-shrink-0" />;
  }

  if (allRead) {
    // Read by everyone
    return <CheckCheck className="w-4 h-4 text-blue-500 inline-block ml-1 flex-shrink-0" />;
  }

  // Read by some but not all
  return <CheckCheck className="w-4 h-4 text-gray-400 inline-block ml-1 flex-shrink-0" />;
}
