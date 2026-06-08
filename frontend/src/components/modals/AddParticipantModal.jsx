import React, { useState, useEffect } from "react";
import { X, Plus, Search } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

/**
 * Modal for adding participants to an active group call
 */
const AddParticipantModal = ({
  callId,
  currentParticipants = [],
  onClose,
  onAdd,
}) => {
  const { currentChat } = useChatStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get available members from current chat
  const availableMembers =
    currentChat?.members?.filter(
      (member) => !currentParticipants.includes(member._id),
    ) || [];

  const filteredMembers = availableMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Toggle user selection
  const toggleUserSelection = (memberId) => {
    setSelectedUsers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  // Handle add participants
  const handleAddParticipants = async () => {
    try {
      setLoading(true);
      for (const userId of selectedUsers) {
        await onAdd(userId);
      }
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Error adding participants:", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Participants</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Box */}
        <div className="mb-4 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Members List */}
        <div className="mb-4 max-h-96 overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {availableMembers.length === 0
                ? "No other members in this chat"
                : "No members match your search"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <label
                  key={member._id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(member._id)}
                    onChange={() => toggleUserSelection(member._id)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm text-gray-400">{member.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 text-sm text-blue-400">
            {selectedUsers.length} participant
            {selectedUsers.length !== 1 ? "s" : ""} selected
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAddParticipants}
            disabled={selectedUsers.length === 0 || loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus size={20} />
                Add ({selectedUsers.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddParticipantModal;
