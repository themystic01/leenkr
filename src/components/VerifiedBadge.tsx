export default function VerifiedBadge({ size = 26 }: { size?: number }) {
  return (
    <svg
      className="verified-badge"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verified"
    >
      <path
        className="verified-fill"
        d="M12 1.7l2.5 2 3.2-.4 1 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-1 3.1-3.2-.4-2.5 2-2.5-2-3.2.4-1-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6 1-3.1 3.2.4 2.5-2z"
      />
      <path
        className="verified-check"
        d="M8.3 12.3l2.4 2.4 5-5"
        fill="none"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
