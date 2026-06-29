/**
 * Unread message count badge.
 * Displays a rounded pill with the count. Shows "99+" for counts above 99.
 *
 * @param {{ count: number, className?: string }} props
 */
export default function UnreadBadge({ count = 0, className = "" }) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : count;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[20px] h-5 px-1.5
        text-xs font-bold text-white
        bg-blue-600 rounded-full
        animate-[badge-pop_0.2s_ease-out]
        ${className}
      `}
    >
      {display}
    </span>
  );
}
