import { useState } from "react";
import { X, Search, Check, Loader } from "lucide-react";
import { apiClient } from "../../api/client";
import { searchUsers } from "../../api/users.api";
import { useAuthStore } from "../../store/useAuthStore";

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { user: currentUser } = useAuthStore();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchUsers(query, 10);
      // Filter out already selected users and the current user
      const users = (response.data.data.users || []).filter(
        (u) => u._id !== currentUser?._id
      );
      setSearchResults(users);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (selectedUsers.length < 2) {
      setError("Select at least 2 members");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/chats/group", {
        name: groupName,
        userIds: selectedUsers.map((u) => u._id),
        description: description,
      });

      onGroupCreated?.(response.data.data);
      // Reset form
      setGroupName("");
      setDescription("");
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setSelectedUsers([]);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Create Group Chat
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Members ({selectedUsers.length} selected)
            </label>

            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedUsers.map((user) => (
                  <span
                    key={user._id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                  >
                    {user.name}
                    <button
                      type="button"
                      onClick={() => removeUser(user._id)}
                      className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* User search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search results */}
            {searchLoading && (
              <div className="flex items-center justify-center py-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some(
                    (u) => u._id === user._id
                  );
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleUser(user)}
                      className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <img
                        src={
                          user.avatar ||
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                            user.email
                        }
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {!searchLoading &&
              searchQuery.trim().length > 0 &&
              searchResults.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
                  No users found
                </p>
              )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length < 2 || !groupName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
