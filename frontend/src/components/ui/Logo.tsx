/**
 * Brand mark: four uneven bars reading as a behavioral profile.
 * Uneven by design — a real DISC/Big Five profile is never flat.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="BehaviorAssess"
    >
      <rect width="32" height="32" rx="7.5" className="fill-primary-600" />
      <g fill="#FFFFFF">
        <rect x="5.5" y="17" width="3.6" height="7" rx="1.8" />
        <rect x="11.3" y="9" width="3.6" height="15" rx="1.8" />
        <rect x="17.1" y="19" width="3.6" height="5" rx="1.8" />
        <rect x="22.9" y="13" width="3.6" height="11" rx="1.8" fillOpacity="0.6" />
      </g>
    </svg>
  );
}

export default function Logo({
  size = 28,
  showWordmark = true,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="shrink-0 shadow-raised rounded-[7.5px]" />
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight text-gray-900">
          BehaviorAssess
        </span>
      )}
    </span>
  );
}
