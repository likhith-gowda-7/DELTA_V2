import { useState } from "react";
import { Search, X } from "lucide-react";
import { searchUsers } from "../../api/users.api";
import { useSocketStore } from "../../store/useSocketStore";
import { cn } from "../../lib/cn";

export default function UserSearch({ onSelectUser }) {
  const { onlineUsers } = useSocketStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 1) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await searchUsers(value, 10);
      setResults(response.data.data.users);
      setIsOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleSearch}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="input-field pl-10 pr-10 w-full"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-600 dark:text-slate-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {results.map((user) => (
                <li key={user._id}>
                  <button
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 text-left"
                  >
                    <img
                      src={
                        user.avatar ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                          user.email
                      }
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0",
                        onlineUsers.includes(user._id)
                          ? "bg-green-500"
                          : "bg-slate-400",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length > 0 ? (
            <div className="p-4 text-center text-slate-600 dark:text-slate-400">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
