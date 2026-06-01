import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export default function ProtectedRoute({ children }) {
  const { user, accessToken, isLoading } = useAuthStore();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full"></div>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !accessToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}
