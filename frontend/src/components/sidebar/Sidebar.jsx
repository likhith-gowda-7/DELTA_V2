import { useState, useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";
import { useSocketStore } from "../../store/useSocketStore";
import UserSearch from "./UserSearch";
import ChatList from "../chat/ChatList";
import { cn } from "../../lib/cn";

export default function Sidebar({ onSelectUser, onSelectChat, onCreateGroupClick }) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { onlineUsers } = useSocketStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary-600 text-white"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl font-bold text-primary-600">DELTA</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {user?.name}
            </p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <UserSearch onSelectUser={onSelectUser} />
          </div>

          {/* Chat list */}
          <ChatList
            onSelectChat={(chat) => {
              onSelectChat?.(chat);
              // Auto-close sidebar on mobile after selecting a chat
              setSidebarOpen(false);
            }}
            onCreateGroupClick={onCreateGroupClick}
          />

          {/* User profile section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.email
                }
                alt={user?.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
