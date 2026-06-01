import { useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useUIStore } from "../../store/useUIStore";
import Sidebar from "../sidebar/Sidebar";
import UserProfileModal from "../modals/UserProfileModal";
import { cn } from "../../lib/cn";

export default function MainLayout({ children }) {
  const socket = useSocket(); // Initialize socket connection
  const { sidebarOpen } = useUIStore();

  useEffect(() => {
    // Socket is initialized via hook
  }, [socket]);

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      <Sidebar onSelectUser={() => {}} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
