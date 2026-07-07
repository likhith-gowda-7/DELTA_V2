import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { useCallStore } from "../store/useCallStore";
import MainLayout from "../components/layouts/MainLayout";
import SingleChat from "../components/chat/SingleChat";
import CreateGroupModal from "../components/modals/CreateGroupModal";
import UpdateGroupModal from "../components/modals/UpdateGroupModal";
import CallNotification from "../components/calls/CallNotification";
import CallWindow from "../components/calls/CallWindow";
import GroupCallWindow from "../components/calls/GroupCallWindow";

export default function ChatPage() {
  const { user } = useAuthStore();
  const { chats, selectedChat, fetchChats, createOrAccessChat } = useChatStore();
  const { socket } = useSocketStore();
  const {
    setIncomingCall,
    currentCall,
    isCallActive,
    isGroupCall,
    groupCallParticipants,
  } = useCallStore();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showUpdateGroupModal, setShowUpdateGroupModal] = useState(false);

  useEffect(() => {
    document.title = "DELTA - Chat";
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // Setup incoming call listener
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const incomingCall = {
        _id: data.callId,
        initiatorId: data.initiatorId,
        recipientId: user?._id,
        mediaType: data.mediaType,
        status: "pending",
        createdAt: new Date(),
      };
      setIncomingCall(incomingCall);
    };

    socket.on("incoming_call", handleIncomingCall);
    return () => {
      socket.off("incoming_call", handleIncomingCall);
    };
  }, [socket, user, setIncomingCall]);

  // Handler: when a user is selected from search, create/access a 1-to-1 chat
  const handleSelectUser = async (selectedUser) => {
    try {
      await createOrAccessChat(selectedUser._id);
      // fetchChats to refresh the chat list with the new/existing chat
      await fetchChats();
    } catch (error) {
      console.error("Failed to create/access chat:", error);
    }
  };

  return (
    <MainLayout
      onSelectUser={handleSelectUser}
      onSelectChat={() => {}}
      onCreateGroupClick={() => setShowCreateGroupModal(true)}
    >
      {/* Incoming Call Notification */}
      <CallNotification />

      {/* Active Call Window */}
      {isCallActive && currentCall && (
        <div className="fixed inset-0 z-40 bg-black">
          {isGroupCall ? (
            <GroupCallWindow
              callId={currentCall._id}
              participants={groupCallParticipants}
            />
          ) : (
            <CallWindow
              callId={currentCall._id}
              isInitiator={currentCall.initiatorId === user?._id}
              remoteUserId={
                currentCall.initiatorId === user?._id
                  ? currentCall.recipientId
                  : currentCall.initiatorId
              }
            />
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <SingleChat
            chat={selectedChat}
            onUpdateGroupClick={() => setShowUpdateGroupModal(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Select a chat to start
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from your chats or start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={() => {
          setShowCreateGroupModal(false);
          fetchChats();
        }}
      />

      {selectedChat && (
        <UpdateGroupModal
          isOpen={showUpdateGroupModal}
          onClose={() => setShowUpdateGroupModal(false)}
          chat={selectedChat}
        />
      )}
    </MainLayout>
  );
}
