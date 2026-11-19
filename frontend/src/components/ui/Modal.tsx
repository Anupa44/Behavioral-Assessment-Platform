import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md";
}

export default function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-gray-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full animate-fade-in-up rounded-2xl border border-gray-200 bg-white shadow-2xl ${
          size === "sm" ? "max-w-sm" : "max-w-md"
        }`}
      >
        <div className="flex items-start gap-4 p-6 pb-0">
          <div className="min-w-0 flex-1">
            <h2 className="section-title">{title}</h2>
            {description && <p className="page-subtitle">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring -mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-6">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
