export type StatusTone = "success" | "danger" | "neutral" | "brand";

const TONES: Record<StatusTone, string> = {
  success: "bg-success-50 text-success-600 ring-success-600/15",
  danger: "bg-red-50 text-red-600 ring-red-600/15",
  neutral: "bg-gray-100 text-gray-500 ring-gray-200",
  brand: "bg-primary-50 text-primary-600 ring-primary-600/15",
};

interface Props {
  icon: React.ReactNode;
  tone?: StatusTone;
  title: string;
  message?: string;
  children?: React.ReactNode;
  /** Renders as a full-page centered screen rather than an inline card. */
  fullScreen?: boolean;
}

export default function StatusCard({
  icon,
  tone = "neutral",
  title,
  message,
  children,
  fullScreen = false,
}: Props) {
  const card = (
    <div
      className={
        fullScreen
          ? "w-full max-w-md animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg"
          : "text-center"
      }
    >
      <div
        className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset ${TONES[tone]}`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h2>
      {message && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{message}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );

  if (!fullScreen) return card;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      {card}
    </div>
  );
}
