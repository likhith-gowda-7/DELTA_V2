import { useEffect, useState } from "react";
import { useToastStore } from "../../store/useToastStore";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200",
  warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200",
};

const ICON_COLORS = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

/**
 * Toast notification container. Renders all active toasts from the toast store.
 * Place this component once at the app root level.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = ICONS[toast.type] || ICONS.info;
  const colorClasses = COLORS[toast.type] || COLORS.info;
  const iconColor = ICON_COLORS[toast.type] || ICON_COLORS.info;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 p-4
        border rounded-lg shadow-lg
        transition-all duration-200
        ${colorClasses}
        ${isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-[slide-in_0.3s_ease-out]"}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
