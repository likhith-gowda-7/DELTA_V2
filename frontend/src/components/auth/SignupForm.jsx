import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../lib/cn";

export default function SignupForm() {
  const navigate = useNavigate();
  const { signup, isLoading, error, setError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError("Name is required");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setFormError("Name must be at least 2 characters");
      return false;
    }

    if (!formData.email.trim()) {
      setFormError("Email is required");
      return false;
    }

    if (!formData.password) {
      setFormError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setFormError("Password must contain an uppercase letter");
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setFormError("Password must contain a number");
      return false;
    }

    if (formData.password !== formData.passwordConfirm) {
      setFormError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    try {
      await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.passwordConfirm,
      );
      navigate("/chats");
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Signup failed. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-field pl-10"
            placeholder="John Doe"
            disabled={isLoading}
          />
        </div>
      </div>

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
            className="input-field pl-10"
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
            className="input-field pl-10 pr-10"
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
        <p className="text-xs text-slate-500 mt-1">
          At least 6 characters, 1 uppercase letter, and 1 number
        </p>
      </div>

      <div>
        <label
          htmlFor="passwordConfirm"
          className="block text-sm font-medium mb-2"
        >
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type={showConfirm ? "text" : "password"}
            id="passwordConfirm"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            className="input-field pl-10 pr-10"
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {(formError || error) && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
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
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
