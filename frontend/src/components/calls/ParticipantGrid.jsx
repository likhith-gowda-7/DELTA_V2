import React, { useEffect, useRef } from "react";
import { Wifi, Zap } from "lucide-react";

/**
 * Component that displays participant video feeds in a responsive grid
 * Supports 2-6 participants with automatic layout
 */
const ParticipantGrid = ({
  localStream,
  remoteStreams,
  connectionStates,
  showStats = false,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  // Set up local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote videos
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      if (!remoteVideoRefs.current.has(peerId)) {
        remoteVideoRefs.current.set(peerId, React.createRef());
      }

      const videoRef = remoteVideoRefs.current.get(peerId);
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // Clean up removed peers
    remoteVideoRefs.current.forEach((_, peerId) => {
      if (!remoteStreams.has(peerId)) {
        remoteVideoRefs.current.delete(peerId);
      }
    });
  }, [remoteStreams]);

  // Calculate grid layout based on number of participants
  const totalParticipants = 1 + remoteStreams.size; // 1 local + remote
  let gridCols = "grid-cols-1";
  let gridRows = "grid-rows-1";

  if (totalParticipants === 2) {
    gridCols = "grid-cols-2";
    gridRows = "grid-rows-1";
  } else if (totalParticipants === 3 || totalParticipants === 4) {
    gridCols = "grid-cols-2";
    gridRows = "grid-rows-2";
  } else if (totalParticipants === 5 || totalParticipants === 6) {
    gridCols = "grid-cols-3";
    gridRows = "grid-rows-2";
  }

  const getConnectionQuality = (peerId) => {
    const state = connectionStates.get(peerId);
    if (state === "connected") return "Good";
    if (state === "connecting") return "Connecting...";
    if (state === "disconnected") return "Disconnected";
    if (state === "failed") return "Failed";
    return "Unknown";
  };

  return (
    <div className={`grid ${gridCols} gap-2 h-full auto-rows-fr`}>
      {/* Local Video */}
      <div className="relative overflow-hidden rounded-lg bg-black flex items-center justify-center">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-3 left-3 bg-gray-900/80 px-3 py-2 rounded text-white text-sm">
          You (Local)
        </div>
        {showStats && (
          <div className="absolute top-3 right-3 bg-gray-900/80 text-green-400 px-3 py-2 rounded text-xs font-mono max-w-[150px]">
            <div className="flex items-center gap-1">
              <Wifi size={14} /> Local
            </div>
          </div>
        )}
      </div>

      {/* Remote Videos */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream], index) => (
        <div
          key={peerId}
          className="relative overflow-hidden rounded-lg bg-black flex items-center justify-center"
        >
          <video
            ref={remoteVideoRefs.current.get(peerId)}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-gray-900/80 px-3 py-2 rounded text-white text-sm">
            Participant {index + 2}
          </div>
          {showStats && (
            <div className="absolute top-3 right-3 bg-gray-900/80 px-3 py-2 rounded text-xs font-mono max-w-[150px]">
              <div
                className={`flex items-center gap-1 ${
                  connectionStates.get(peerId) === "connected"
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                <Zap size={14} />
                {getConnectionQuality(peerId)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Placeholder for missing spots (optional) */}
      {totalParticipants < 4 &&
        Array.from({ length: 4 - totalParticipants }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="relative overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <p className="text-sm">Empty Slot</p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default ParticipantGrid;
