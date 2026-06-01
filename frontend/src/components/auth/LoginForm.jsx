import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../lib/cn";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, setError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validation
    if (!formData.email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!formData.password) {
      setFormError("Password is required");
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate("/chats");
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={cn(
              "input-field pl-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            )}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={cn(
              "input-field pl-10 pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            )}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {(formError || error) && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">
            {formError || error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "btn-primary w-full",
          isLoading && "opacity-50 cursor-not-allowed",
        )}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
