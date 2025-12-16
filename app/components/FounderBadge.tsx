interface FounderBadgeProps {
  size?: number;
}

export default function FounderBadge({ size = 18 }: FounderBadgeProps) {
  const iconSize = size * 0.56; // Icon is roughly 56% of badge size
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '-2px',
      right: '-2px',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: '#FFD700', // Gold color for founder
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 2,
      pointerEvents: 'none',
    }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Crown icon for founder */}
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    </div>
  );
}

