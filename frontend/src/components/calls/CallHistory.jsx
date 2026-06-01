import React, { useEffect, useState } from "react";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Loader,
  Clock,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useAuthStore } from "../../store/useAuthStore";

const CallHistory = () => {
  const { user } = useAuthStore();
  const { callHistory, fetchCallHistory, loadingHistory } = useCallStore();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all, incoming, outgoing, missed

  useEffect(() => {
    fetchCallHistory(page, 20);
  }, [page]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getCallType = (call) => {
    if (call.status === "missed") {
      return "missed";
    }
    if (call.initiatorId._id === user?._id || call.initiatorId === user?._id) {
      return "outgoing";
    }
    return "incoming";
  };

  const getOtherUser = (call) => {
    const initiatorId = call.initiatorId?._id || call.initiatorId;
    if (initiatorId === user?._id) {
      return call.recipientId;
    }
    return call.initiatorId;
  };

  const filteredCalls = callHistory.filter((call) => {
    if (filter === "all") return true;
    return getCallType(call) === filter;
  });

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Call History
        </h2>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex gap-2">
        {["all", "incoming", "outgoing", "missed"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Call List */}
      <div className="max-h-96 overflow-y-auto">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Phone size={32} className="mx-auto mb-2 opacity-50" />
            <p>No {filter !== "all" ? filter : ""} calls</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCalls.map((call) => {
              const callType = getCallType(call);
              const otherUser = getOtherUser(call);
              const userName = otherUser?.name || "Unknown";
              const userAvatar =
                otherUser?.avatar ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=User";

              return (
                <li
                  key={call._id}
                  className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-4"
                >
                  {/* Avatar */}
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  {/* Call Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(call.createdAt)}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock size={14} />
                    {formatDuration(call.duration)}
                  </div>

                  {/* Call Type Icon */}
                  <div className="flex-shrink-0">
                    {callType === "incoming" && (
                      <PhoneIncoming
                        size={18}
                        className={
                          call.status === "missed"
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      />
                    )}
                    {callType === "outgoing" && (
                      <PhoneOutgoing
                        size={18}
                        className={
                          call.status === "missed"
                            ? "text-red-500"
                            : "text-blue-500"
                        }
                      />
                    )}
                    {callType === "missed" && (
                      <PhoneMissed size={18} className="text-red-500" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {!loadingHistory && filteredCalls.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
