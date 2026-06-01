import { useState, useCallback } from "react";
import { Mail, MapPin, Clock, Shield } from "lucide-react";
import { getUserProfile, blockUser, unblockUser } from "../../api/users.api";
import { useAuthStore } from "../../store/useAuthStore";
import { useSocketStore } from "../../store/useSocketStore";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/cn";

export default function UserProfileModal({ userId, onClose }) {
  const { user: currentUser } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Fetch profile on mount
  useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile(userId);
      setProfile(response.data.data);
      setIsBlocked(response.data.data.isBlocked);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId])();

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setIsBlocked(false);
      } else {
        await blockUser(userId);
        setIsBlocked(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update block status");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-sm w-full mx-4">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(userId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">User Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Profile content */}
        <div className="p-6 space-y-4">
          {/* Avatar and online status */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  profile.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                    profile.email
                }
                alt={profile.name}
                className="w-16 h-16 rounded-full"
              />
              <div
                className={cn(
                  "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
                  isOnline ? "bg-green-500" : "bg-slate-400",
                )}
              />
            </div>

            <div>
              <h3 className="font-bold text-lg">{profile.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isOnline ? "Online" : `Offline`}
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {profile.email}
              </span>
            </div>

            {profile.bio && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5">
                  📝
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {profile.bio}
                </p>
              </div>
            )}

            {!isOnline && profile.lastSeen && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">
                  Last seen: {formatDateTime(profile.lastSeen)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Joined: {formatDateTime(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Block status */}
          {currentUser?._id !== userId && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleBlock}
                className={cn(
                  "w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                  isBlocked
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30",
                )}
              >
                <Shield className="w-4 h-4" />
                {isBlocked ? "Unblock User" : "Block User"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
