export function CommandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      className={className}
    >
      <path
        d="M15 9v6H9V9h6zM15 15h3a3 3 0 11-3 3v-3zM9 15.002H6a3 3 0 103 3v-3zM15 9V6a3 3 0 113 3h-3zM9 9V6a3 3 0 10-3 3h3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
