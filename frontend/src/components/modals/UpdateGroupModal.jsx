import { useState } from "react";
import { X, Shield, Trash2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function UpdateGroupModal({ isOpen, onClose, chat }) {
  const {
    renameChat,
    addMemberToChat,
    removeMemberFromChat,
    promoteToAdmin,
    deleteChat,
  } = useChatStore();
  const { user } = useAuthStore();
  const [groupName, setGroupName] = useState(chat?.name || "");
  const [description, setDescription] = useState(chat?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info"); // info, members

  const isAdmin = chat?.groupAdmins?.some((admin) => admin._id === user?._id);

  const handleRename = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || groupName === chat?.name) {
      setError("Please enter a new group name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await renameChat(chat._id, groupName);
      setError("");
      // Show success
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the group?")) return;

    setLoading(true);
    try {
      await removeMemberFromChat(chat._id, memberId);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteAdmin = async (memberId) => {
    if (!window.confirm("Promote this user to admin?")) return;

    setLoading(true);
    try {
      await promoteToAdmin(chat._id, memberId);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to promote admin");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    setLoading(true);
    try {
      await removeMemberFromChat(chat._id, user._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? This action cannot be undone."))
      return;

    setLoading(true);
    try {
      await deleteChat(chat._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !chat) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {chat.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-2 px-4 font-medium border-b-2 transition ${
                activeTab === "info"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-2 px-4 font-medium border-b-2 transition ${
                activeTab === "members"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Members ({chat.users?.length || 0})
            </button>
          </div>

          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="text-center pb-4">
                <img
                  src={
                    chat.picture ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Group"
                  }
                  alt={chat.name}
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chat.users?.length || 0} members •{" "}
                  {chat.groupAdmins?.length || 0} admins
                </p>
              </div>

              {/* Edit form - only for admins */}
              {isAdmin && (
                <form onSubmit={handleRename} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Group description (optional)"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}

              {!isAdmin && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    Only group admins can edit group info
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLeaveGroup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                >
                  Leave Group
                </button>

                {isAdmin && (
                  <button
                    onClick={handleDeleteGroup}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-2">
              {chat.users?.map((member) => {
                const isCurrentUser = member._id === user?._id;
                const isMemberAdmin = chat.groupAdmins?.some(
                  (a) => a._id === member._id,
                );

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <img
                        src={
                          member.avatar ||
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                        }
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {member.name}
                          {isCurrentUser && " (You)"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isMemberAdmin ? "Admin" : "Member"}
                        </p>
                      </div>
                      {isMemberAdmin && (
                        <Shield className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    {/* Admin actions */}
                    {isAdmin && !isCurrentUser && (
                      <div className="flex gap-1">
                        {!isMemberAdmin && (
                          <button
                            onClick={() => handlePromoteAdmin(member._id)}
                            disabled={loading}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition disabled:opacity-50"
                            title="Promote to admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={loading}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
