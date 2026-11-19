interface Props {
  icon: React.ReactNode;
  title: string;
  message?: string;
  children?: React.ReactNode;
  /** Compact variant for empty panels inside a page that already has content. */
  compact?: boolean;
}

export default function EmptyState({ icon, title, message, children, compact }: Props) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? "px-4 py-10" : "px-6 py-20"
      }`}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-600/10">
        {icon}
      </div>
      <h3 className={compact ? "font-semibold text-gray-900" : "section-title"}>{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{message}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
