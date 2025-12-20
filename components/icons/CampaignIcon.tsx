export function CampaignIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9.498 15l7.5-7.5M8.006 7.679l7.32-3.46C18.37 2.78 19.89 2.062 20.86 2.783c.97.722.693 2.365.138 5.652l-.955 5.662c-.362 2.149-.543 3.223-1.344 3.692-.801.469-1.842.109-3.923-.611l-6.365-2.202c-3.892-1.346-5.838-2.019-5.91-3.34-.074-1.32 1.786-2.2 5.505-3.957zM9.498 15.5v2.227c0 2.374 0 3.56.71 3.75.71.19 1.458-.798 2.954-2.773l.836-1.204"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
