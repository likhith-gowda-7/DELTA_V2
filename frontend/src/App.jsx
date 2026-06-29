import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ToastContainer from "./components/common/ToastContainer";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

function App() {
  const { user, getCurrentUser, isLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already logged in on app mount
    const token = localStorage.getItem("accessToken");
    if (token && !user) {
      getCurrentUser().catch(() => {
        // Token is invalid or expired
        localStorage.removeItem("accessToken");
      });
    }
  }, []);

  if (isLoading && user === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Suspense
          fallback={
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full"></div>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
