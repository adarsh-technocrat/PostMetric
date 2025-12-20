export function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 21C13.6569 21 15 19.6569 15 18C15 16.3431 13.6569 15 12 15C10.3431 15 9 16.3431 9 18C9 19.6569 10.3431 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M12 15V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M22 13C22 7.47715 17.5228 3 12 3C6.47715 3 2 7.47715 2 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
