import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import { MessageCircle, LogIn, UserPlus } from "lucide-react";
import { cn } from "../lib/cn";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user && accessToken) {
    navigate("/chats");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="w-10 h-10 text-primary-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              DELTA
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time Chat Application
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-8 mb-6">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("login")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === "login"
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === "signup"
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Forms */}
          <div className="flex justify-center">
            {activeTab === "login" ? <LoginForm /> : <SignupForm />}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            {activeTab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() =>
                setActiveTab(activeTab === "login" ? "signup" : "login")
              }
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              {activeTab === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
