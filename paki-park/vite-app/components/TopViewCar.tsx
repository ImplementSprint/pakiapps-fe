interface TopViewCarProps {
  status: 'available' | 'reserved' | 'occupied';
  onClick?: () => void;
  isHovered?: boolean;
}

export function TopViewCar({ status, onClick, isHovered = false }: TopViewCarProps) {
  const getColor = () => {
    switch (status) {
      case 'available':
        return isHovered ? '#10b981' : '#d1d5db'; // Gray or green on hover
      case 'reserved':
        return '#eab308'; // Yellow
      case 'occupied':
        return '#ef4444'; // Red
      default:
        return '#d1d5db';
    }
  };

  const opacity = status === 'available' ? 0.3 : 1;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 60 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 ${isHovered ? 'scale-105' : ''}`}
      style={{ filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
    >
      {/* Car Body */}
      <g opacity={opacity}>
        {/* Main body */}
        <rect x="10" y="20" width="40" height="60" rx="8" fill={getColor()} />
        
        {/* Windshield front */}
        <rect x="15" y="22" width="30" height="12" rx="3" fill="white" fillOpacity="0.4" />
        
        {/* Windshield rear */}
        <rect x="15" y="66" width="30" height="12" rx="3" fill="white" fillOpacity="0.4" />
        
        {/* Hood detail */}
        <rect x="18" y="35" width="24" height="2" rx="1" fill="white" fillOpacity="0.2" />
        
        {/* Trunk detail */}
        <rect x="18" y="63" width="24" height="2" rx="1" fill="white" fillOpacity="0.2" />
        
        {/* Left mirror */}
        <ellipse cx="8" cy="42" rx="3" ry="5" fill={getColor()} />
        
        {/* Right mirror */}
        <ellipse cx="52" cy="42" rx="3" ry="5" fill={getColor()} />
        
        {/* Front left wheel */}
        <rect x="5" y="28" width="8" height="16" rx="2" fill="#1f2937" />
        <rect x="6.5" y="30" width="5" height="12" rx="1" fill="#374151" />
        
        {/* Front right wheel */}
        <rect x="47" y="28" width="8" height="16" rx="2" fill="#1f2937" />
        <rect x="48.5" y="30" width="5" height="12" rx="1" fill="#374151" />
        
        {/* Rear left wheel */}
        <rect x="5" y="56" width="8" height="16" rx="2" fill="#1f2937" />
        <rect x="6.5" y="58" width="5" height="12" rx="1" fill="#374151" />
        
        {/* Rear right wheel */}
        <rect x="47" y="56" width="8" height="16" rx="2" fill="#1f2937" />
        <rect x="48.5" y="58" width="5" height="12" rx="1" fill="#374151" />
        
        {/* Roof detail */}
        <rect x="20" y="45" width="20" height="10" rx="2" fill="white" fillOpacity="0.15" />
        
        {/* Center line */}
        <line x1="30" y1="25" x2="30" y2="75" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="2,2" />
      </g>
    </svg>
  );
}
